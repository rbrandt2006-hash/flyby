import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SyncedConversation, SyncedMessage } from "./ChannelsContainer";
import { Send, Command, Paperclip, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Slack icon component
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  );
}

// Teams icon component
function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.625 8.073c.574 0 1.094.234 1.469.609.375.375.609.895.609 1.469v4.97a2.077 2.077 0 0 1-2.078 2.078h-4.688v-3.516c0-1.23.469-2.344 1.23-3.164a4.436 4.436 0 0 1 3.458-1.446zm-5.977 9.126v-3.516H9.375v3.516a2.077 2.077 0 0 0 2.078 2.078h1.172a2.077 2.077 0 0 0 2.023-2.078zm.977-5.586c0-.574.234-1.094.609-1.469a2.075 2.075 0 0 1 1.469-.609 4.436 4.436 0 0 0-3.458 1.446 4.436 4.436 0 0 0-1.23 3.164v3.516h2.61v-6.048zM12 3c1.547 0 2.813 1.266 2.813 2.813S13.547 8.625 12 8.625 9.188 7.36 9.188 5.812 10.453 3 12 3zm6.328 2.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM5.672 5.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM3.375 8.073a2.077 2.077 0 0 0-2.078 2.078v4.97a2.077 2.077 0 0 0 2.078 2.078h4.688v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.458-1.446zm3.563 1.462a2.075 2.075 0 0 1 1.469.609c.375.375.609.895.609 1.469v6.048h2.609v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.457-1.446z"/>
    </svg>
  );
}

// Travel-related keywords to highlight
const TRAVEL_KEYWORDS = [
  "travel", "trip", "flight", "hotel", "meeting", "conference",
  "client", "NYC", "New York", "SF", "San Francisco", "LA", "Los Angeles",
  "Chicago", "Boston", "Seattle", "Austin", "Denver", "Miami",
  "next week", "next month", "tomorrow", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "visit", "office", "headquarters", "HQ",
  "presentation", "pitch", "demo", "workshop", "summit", "event"
];

interface ConversationCanvasProps {
  conversation: SyncedConversation;
  onSendMessage: (text: string) => void;
}

function highlightKeywords(text: string): React.ReactNode {
  const pattern = new RegExp(
    `(${TRAVEL_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  
  const parts = text.split(pattern);
  
  return parts.map((part, index) => {
    const isKeyword = TRAVEL_KEYWORDS.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <span 
          key={index} 
          className="text-primary font-medium bg-primary/5 px-0.5 rounded"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function ConversationCanvas({ conversation, onSendMessage }: ConversationCanvasProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  const formatMessageDate = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE, MMMM d");
  };

  // Group messages by date and sender
  const groupedMessages: { date: string; messages: SyncedMessage[] }[] = [];
  conversation.messages.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    const existingGroup = groupedMessages.find(g => g.date === dateKey);
    if (existingGroup) {
      existingGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  // Group consecutive messages by same sender
  const groupBySender = (messages: SyncedMessage[]) => {
    const groups: { sender: SyncedMessage; messages: SyncedMessage[] }[] = [];
    messages.forEach((msg) => {
      const lastGroup = groups[groups.length - 1];
      const timeDiff = lastGroup 
        ? new Date(msg.createdAt).getTime() - new Date(lastGroup.messages[lastGroup.messages.length - 1].createdAt).getTime()
        : Infinity;
      
      if (lastGroup && lastGroup.sender.senderId === msg.senderId && timeDiff < 300000) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ sender: msg, messages: [msg] });
      }
    });
    return groups;
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const getPlatformBadge = () => {
    if (conversation.source === "slack") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SlackIcon className="w-3.5 h-3.5 text-[#4A154B]" />
          <span>Replying via Slack</span>
        </div>
      );
    }
    if (conversation.source === "teams") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TeamsIcon className="w-3.5 h-3.5 text-[#6264A7]" />
          <span>Replying via Teams</span>
        </div>
      );
    }
    return null;
  };

  const getPlaceholder = () => {
    if (conversation.source === "slack") return "Reply to Slack…";
    if (conversation.source === "teams") return "Reply to Teams…";
    return "Send a message…";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          {groupedMessages.map(({ date, messages }, groupIndex) => (
            <div key={date} className={cn(groupIndex > 0 && "mt-8")}>
              {/* Date separator - subtle */}
              <div className="flex items-center justify-center mb-6">
                <span className="text-[11px] text-muted-foreground/50 font-medium bg-muted/30 px-3 py-1 rounded-full">
                  {formatMessageDate(messages[0].createdAt)}
                </span>
              </div>
              
              {/* Message groups by sender */}
              <div className="space-y-6">
                {groupBySender(messages).map(({ sender, messages: senderMessages }, senderIndex) => (
                  <motion.div
                    key={`${sender.senderId}-${senderIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: senderIndex * 0.05 }}
                    className="flex gap-3"
                  >
                    <img
                      src={sender.senderAvatar}
                      alt={sender.senderName}
                      className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {sender.senderName}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {formatMessageTime(sender.createdAt)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {senderMessages.map((msg, msgIndex) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "text-sm text-foreground/90 leading-relaxed",
                              msgIndex > 0 && "pt-1"
                            )}
                          >
                            {highlightKeywords(msg.text)}
                            {msgIndex > 0 && (
                              <span className="text-[10px] text-muted-foreground/40 ml-2">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Unified Message Composer */}
      <div className="border-t border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {getPlatformBadge()}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Command className="w-3 h-3" />
              <span>+ Enter to send</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                rows={1}
                className="w-full px-4 py-3 text-sm bg-muted/40 border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground/50"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground/60 hover:text-muted-foreground"
              >
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground/60 hover:text-muted-foreground"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="h-10 w-10 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
