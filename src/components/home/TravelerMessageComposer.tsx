import { motion, AnimatePresence } from "framer-motion";
import { Check, Paperclip, Send, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ComposerMessage {
  id: string;
  text: string;
  createdAt: string;
  sender: "me" | "traveler" | "system";
}

interface TravelerMessageComposerProps {
  open: boolean;
  traveler: {
    name: string;
    initials: string;
    destination: string;
    statusType: "info" | "success" | "warning";
  };
  messages: ComposerMessage[];
  value: string;
  onValueChange: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
  sentStateVisible: boolean;
}

export function TravelerMessageComposer({
  open,
  traveler,
  messages,
  value,
  onValueChange,
  onClose,
  onSend,
  sentStateVisible,
}: TravelerMessageComposerProps) {
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0 z-20 bg-background/95 backdrop-blur-md border-l border-border/50 flex flex-col"
        >
          <div className="px-6 py-4 border-b border-border/40 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {traveler.initials}
                </div>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                    traveler.statusType === "success" && "bg-success",
                    traveler.statusType === "warning" && "bg-warning",
                    traveler.statusType === "info" && "bg-primary",
                  )}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">{traveler.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{traveler.destination}</span>
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-border/60 bg-muted/20 flex items-center justify-center text-center px-6">
                <p className="text-sm text-muted-foreground">Start a conversation with {traveler.name}</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.sender === "me";
                return (
                  <div key={message.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm border",
                        isMe
                          ? "bg-primary text-primary-foreground border-primary/20 rounded-br-md"
                          : "bg-card text-foreground border-border/60 rounded-bl-md",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 py-4 border-t border-border/40 bg-muted/20 space-y-2">
            <div className="relative">
              <Textarea
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                className="min-h-[88px] pr-24 resize-none"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button size="icon" className="h-8 w-8" onClick={onSend} disabled={!value.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</p>
              {sentStateVisible && (
                <div className="inline-flex items-center gap-1 text-xs text-success font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Message sent
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
