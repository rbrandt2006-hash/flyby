import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, History, ArrowUp, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BookingResultsPanel, type ParsedChips } from "@/components/home/BookingResultsPanel";
import type { Flight } from "@/components/flights/FlightResults";
import type { HotelOption } from "@/components/chats/booking/types";
import type { GroundTransportOption } from "@/services/mockGroundTransportService";

export interface BookingResults {
  chips: ParsedChips;
  flights: Flight[];
  hotels: HotelOption[];
  ground: GroundTransportOption[];
  reasons: { flight?: string; hotel?: string; ground?: string };
  nights: number;
}

export type ChatMsg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "text"; text: string }
  | { id: string; role: "assistant"; kind: "results"; note?: string; results: BookingResults }
  | { id: string; role: "assistant"; kind: "loading" };

export interface ChatThreadMeta {
  id: string;
  title: string;
  createdAt: string;
}

interface Props {
  messages: ChatMsg[];
  isThinking: boolean;
  threads: ChatThreadMeta[];
  activeThreadId: string | null;
  onSend: (text: string) => void;
  onNewTrip: () => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onSelectFlight: (f: Flight) => void;
  onSelectHotel: (h: HotelOption) => void;
}

export function BookingChatThread({
  messages,
  isThinking,
  threads,
  activeThreadId,
  onSend,
  onNewTrip,
  onSelectThread,
  onDeleteThread,
  onSelectFlight,
  onSelectHotel,
}: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeThreadId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    onSend(v);
    setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={onNewTrip} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          New trip
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <History className="w-3.5 h-3.5" />
              History
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Trip conversations</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-5rem)] mt-4 -mx-6 px-6">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No past conversations yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {threads.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "group flex items-center gap-2 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer",
                        activeThreadId === t.id && "bg-secondary",
                      )}
                      onClick={() => onSelectThread(t.id)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(t.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm min-h-[400px] max-h-[70vh] overflow-y-auto p-5 space-y-5"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "user" ? (
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
                  {m.text}
                </div>
              ) : m.kind === "text" ? (
                <div className="max-w-[90%] text-sm text-foreground leading-relaxed">
                  {m.text}
                </div>
              ) : m.kind === "loading" ? (
                <ResultsSkeleton />
              ) : (
                <div className="w-full space-y-3">
                  {m.note && (
                    <p className="text-sm text-muted-foreground">{m.note}</p>
                  )}
                  <BookingResultsPanel
                    chips={m.results.chips}
                    flights={m.results.flights}
                    hotels={m.results.hotels}
                    ground={m.results.ground}
                    reasons={m.results.reasons}
                    onSelectFlight={onSelectFlight}
                    onSelectHotel={onSelectHotel}
                    onEditChip={() => inputRef.current?.focus()}
                    onClose={() => {/* no-op in thread */}}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isThinking && <ResultsSkeleton />}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 relative rounded-2xl border-2 border-border bg-card shadow-sm focus-within:border-primary/30 transition-all"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Ask a follow-up — “nonstop”, “cheaper”, “day after”, “different hotel”…"
          rows={1}
          className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm outline-none placeholder:text-muted-foreground/60 max-h-32"
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={!input.trim() || isThinking}
          className="absolute right-2 bottom-2"
          aria-label="Send"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
