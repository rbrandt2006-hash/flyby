import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamMemberCard";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

function getInitialMessages(name: string, destination?: string): ChatMessage[] {
  const dest = destination || "the office";
  return [
    { id: "1", sender: name, text: `Hey! Just wanted to let you know I'll be heading to ${dest} next week.`, time: "9:12 AM", isMe: false },
    { id: "2", sender: "You", text: "Great, safe travels! Do you need anything before you go?", time: "9:14 AM", isMe: true },
    { id: "3", sender: name, text: `I land at the airport around 3:15 PM. Hotel check-in is at 5 PM at the Marriott Downtown.`, time: "9:16 AM", isMe: false },
    { id: "4", sender: "You", text: "Perfect. I'll send over the meeting agenda shortly.", time: "9:18 AM", isMe: true },
    { id: "5", sender: name, text: "Sounds good! Looking forward to the Q1 planning session.", time: "9:20 AM", isMe: false },
  ];
}

const simulatedReplies = [
  "Got it, thanks!",
  "Sounds good, see you at the meeting.",
  "Let me know when you land.",
  "Perfect, I'll update the calendar.",
  "Will do! Talk soon.",
  "Great, I'll loop in the rest of the team.",
  "Awesome, looking forward to it! 🙌",
  "Sure thing, I'll send the details over.",
];

// Session-level message store keyed by member ID
const messageStore = new Map<string, ChatMessage[]>();

interface TeamChatViewProps {
  member: TeamMember;
}

export function TeamChatView({ member }: TeamChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = messageStore.get(member.id);
    if (stored) return stored;
    const initial = getInitialMessages(member.name, member.upcomingTrip?.destination);
    messageStore.set(member.id, initial);
    return initial;
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync to store whenever messages change
  useEffect(() => {
    messageStore.set(member.id, messages);
  }, [messages, member.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "You",
      text,
      time: now(),
      isMe: true,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Show typing indicator after a short delay
    const typingDelay = 800 + Math.random() * 1200;
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(true);
    }, typingDelay);

    // Send simulated reply
    const replyDelay = 2000 + Math.random() * 3000;
    replyTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const reply: ChatMessage = {
        id: `r-${Date.now()}`,
        sender: member.name,
        text: simulatedReplies[Math.floor(Math.random() * simulatedReplies.length)],
        time: now(),
        isMe: false,
      };
      setMessages(prev => [...prev, reply]);
    }, replyDelay);
  }, [input, member.name]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const firstName = member.name.split(" ")[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pb-3 border-b border-border/20 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Chat with {member.name}</h3>
        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}
          >
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5",
              msg.isMe
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted/60 text-foreground rounded-bl-md"
            )}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className={cn(
                "text-[10px] mt-1",
                msg.isMe ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>{msg.time}</p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex justify-start"
            >
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{firstName} is typing</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-6 pb-4 pt-3 border-t border-border/20 shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-muted/40 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[40px] max-h-[100px]"
            style={{ height: "40px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "40px";
              target.style.height = Math.min(target.scrollHeight, 100) + "px";
            }}
          />
          <Button
            size="icon"
            className="rounded-xl shrink-0"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
