import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SyncedConversation, SyncedMessage } from "./ChannelsContainer";
import { ExpenseContextCard } from "./ExpenseContextCard";
import { ImageLightbox } from "./ImageLightbox";
import { Send, Command, Paperclip, Smile, CheckCircle, AlertTriangle, DollarSign, MessageCircle, FileText, Image as ImageIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Slack icon
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  );
}

// Teams icon
function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.625 8.073c.574 0 1.094.234 1.469.609.375.375.609.895.609 1.469v4.97a2.077 2.077 0 0 1-2.078 2.078h-4.688v-3.516c0-1.23.469-2.344 1.23-3.164a4.436 4.436 0 0 1 3.458-1.446zm-5.977 9.126v-3.516H9.375v3.516a2.077 2.077 0 0 0 2.078 2.078h1.172a2.077 2.077 0 0 0 2.023-2.078zm.977-5.586c0-.574.234-1.094.609-1.469a2.075 2.075 0 0 1 1.469-.609 4.436 4.436 0 0 0-3.458 1.446 4.436 4.436 0 0 0-1.23 3.164v3.516h2.61v-6.048zM12 3c1.547 0 2.813 1.266 2.813 2.813S13.547 8.625 12 8.625 9.188 7.36 9.188 5.812 10.453 3 12 3zm6.328 2.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM5.672 5.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM3.375 8.073a2.077 2.077 0 0 0-2.078 2.078v4.97a2.077 2.077 0 0 0 2.078 2.078h4.688v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.458-1.446zm3.563 1.462a2.075 2.075 0 0 1 1.469.609c.375.375.609.895.609 1.469v6.048h2.609v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.457-1.446z"/>
    </svg>
  );
}

const TRAVEL_KEYWORDS = [
  "travel", "trip", "flight", "hotel", "meeting", "conference",
  "client", "NYC", "New York", "SF", "San Francisco", "LA", "Los Angeles",
  "Chicago", "Boston", "Seattle", "Austin", "Denver", "Miami",
  "next week", "next month", "tomorrow", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "visit", "office", "headquarters", "HQ",
  "presentation", "pitch", "demo", "workshop", "summit", "event"
];

export interface ExpenseMetadataForContext {
  merchant: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  submitterName: string;
  submittedAt: string;
}

interface ConversationCanvasProps {
  conversation: SyncedConversation;
  onSendMessage: (text: string) => void;
  expenseMetadata?: ExpenseMetadataForContext;
  expenseStatus?: string;
}

// Mock emoji reactions for messages
const MOCK_REACTIONS: Record<string, { emoji: string; count: number; reacted: boolean }[]> = {
  "m1": [{ emoji: "👀", count: 2, reacted: false }],
  "m3": [{ emoji: "✈️", count: 3, reacted: true }, { emoji: "👍", count: 1, reacted: false }],
  "m5": [{ emoji: "🏨", count: 1, reacted: false }],
  "m8": [{ emoji: "📅", count: 2, reacted: true }],
  "m12": [{ emoji: "🙋", count: 4, reacted: true }],
};

// Mock thread replies
const MOCK_THREADS: Record<string, number> = {
  "m1": 3,
  "m6": 5,
  "m11": 2,
};

// Mock file attachments
const MOCK_FILES: Record<string, { name: string; type: "pdf" | "image" | "doc"; size: string }[]> = {
  "m4": [{ name: "meeting-agenda.pdf", type: "pdf", size: "245 KB" }],
  "m7": [{ name: "conference-venue.jpg", type: "image", size: "1.2 MB" }],
};

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🚀", "👀"];

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
        <span key={index} className="text-primary font-medium bg-primary/5 px-0.5 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
}

function getSystemMessageIcon(messageType?: string) {
  switch (messageType) {
    case "expense_approved":
      return <CheckCircle className="w-3.5 h-3.5 text-success" />;
    case "expense_disputed":
      return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
    case "expense_reimbursed":
      return <DollarSign className="w-3.5 h-3.5 text-primary" />;
    default:
      return (
        <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getSystemMessageStyle(messageType?: string) {
  switch (messageType) {
    case "expense_approved":
      return "bg-success/10 border-success/30";
    case "expense_disputed":
      return "bg-destructive/10 border-destructive/30";
    case "expense_reimbursed":
      return "bg-primary/10 border-primary/30";
    default:
      return "bg-muted/40 border-border/50";
  }
}

function FilePreviewCard({ file, onImageClick }: { file: { name: string; type: "pdf" | "image" | "doc"; size: string }; onImageClick?: () => void }) {
  const Icon = file.type === "image" ? ImageIcon : FileText;
  const bgColor = file.type === "image" ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border/50";
  return (
    <div
      className={cn("inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border mt-2 cursor-pointer hover:bg-muted/60 transition-colors", bgColor)}
      onClick={file.type === "image" ? onImageClick : undefined}
    >
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">{file.size}</p>
      </div>
    </div>
  );
}

function EmojiReactions({ reactions, onAdd }: { reactions: { emoji: string; count: number; reacted: boolean }[]; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      {reactions.map((r, i) => (
        <button
          key={i}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
            r.reacted
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/60"
          )}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
      <button
        onClick={onAdd}
        className="w-6 h-6 rounded-full border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:border-border transition-colors"
      >
        <Smile className="w-3 h-3" />
      </button>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground/50">Someone is typing…</span>
    </motion.div>
  );
}

export function ConversationCanvas({ 
  conversation, 
  onSendMessage,
  expenseMetadata,
  expenseStatus 
}: ConversationCanvasProps) {
  const [message, setMessage] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatMessageTime = (dateStr: string) => format(new Date(dateStr), "h:mm a");
  const formatMessageDate = (dateStr: string) => format(new Date(dateStr), "EEEE, MMMM d");

  const isExpenseChat = conversation.type === "expense_approval" || !!conversation.expenseId;

  const filteredMessages = isExpenseChat && expenseMetadata
    ? conversation.messages.filter(msg => msg.messageType !== "expense_submission")
    : conversation.messages;

  // Group messages by date
  const groupedMessages: { date: string; messages: SyncedMessage[] }[] = [];
  filteredMessages.forEach((msg) => {
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
      if (msg.isSystemMessage) {
        groups.push({ sender: msg, messages: [msg] });
      } else if (lastGroup && !lastGroup.sender.isSystemMessage && lastGroup.sender.senderId === msg.senderId && timeDiff < 300000) {
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
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      // Show typing indicator briefly
      setShowTyping(true);
      setTimeout(() => setShowTyping(false), 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

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
    if (isExpenseChat) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <DollarSign className="w-3.5 h-3.5 text-primary" />
          <span>Expense discussion</span>
        </div>
      );
    }
    return null;
  };

  const getPlaceholder = () => {
    if (conversation.source === "slack") return "Reply to Slack…";
    if (conversation.source === "teams") return "Reply to Teams…";
    if (isExpenseChat) return "Ask a question or add context…";
    return "Send a message…";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Channel Header */}
      <div className="shrink-0 px-6 py-3 border-b border-border/30 flex items-center justify-between bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground"># {conversation.name}</h2>
          {conversation.hasTravelIntent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
              <Sparkles className="w-3 h-3" />
              Travel detected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{conversation.messages.length} messages</span>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Expense Context Card */}
          {isExpenseChat && expenseMetadata && (
            <ExpenseContextCard
              expenseId={conversation.expenseId || ""}
              merchant={expenseMetadata.merchant}
              amount={expenseMetadata.amount}
              category={expenseMetadata.category}
              description={expenseMetadata.description}
              date={expenseMetadata.date}
              status={expenseStatus}
              submittedAt={expenseMetadata.submittedAt}
              submitterName={expenseMetadata.submitterName}
            />
          )}

          {groupedMessages.map(({ date, messages }, groupIndex) => (
            <div key={date} className={cn(groupIndex > 0 && "mt-8")}>
              {/* Date separator */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[11px] text-muted-foreground/50 font-medium px-4">
                  {formatMessageDate(messages[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              
              {/* Message groups */}
              <div className="space-y-1">
                {groupBySender(messages).map(({ sender, messages: senderMessages }, senderIndex) => {
                  const isSystemMessage = sender.isSystemMessage;
                  
                  if (isSystemMessage) {
                    return (
                      <motion.div
                        key={`${sender.senderId}-${senderIndex}-${sender.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: senderIndex * 0.05 }}
                        className="flex justify-center"
                      >
                        <div className={cn(
                          "max-w-md w-full border rounded-xl px-4 py-3",
                          getSystemMessageStyle(sender.messageType)
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-background/80 flex items-center justify-center">
                              {getSystemMessageIcon(sender.messageType)}
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Flyby
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {formatMessageTime(sender.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                            {senderMessages.map((msg) => (
                              <div key={msg.id}>{msg.text}</div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                  
                  // Regular Slack-style message
                  return (
                    <motion.div
                      key={`${sender.senderId}-${senderIndex}-${sender.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: senderIndex * 0.03 }}
                      className="group relative rounded-lg hover:bg-muted/30 px-2 py-1.5 -mx-2 transition-colors"
                      onMouseEnter={() => setHoveredMsgId(sender.id)}
                      onMouseLeave={() => { setHoveredMsgId(null); setShowEmojiPicker(null); }}
                    >
                      <div className="flex gap-3">
                        <img
                          src={sender.senderAvatar}
                          alt={sender.senderName}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground">
                              {sender.senderName}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {formatMessageTime(sender.createdAt)}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {senderMessages.map((msg, msgIndex) => (
                              <div key={msg.id}>
                                <div className={cn(
                                  "text-sm text-foreground/90 leading-relaxed",
                                  msgIndex > 0 && "pt-0.5"
                                )}>
                                  {highlightKeywords(msg.text)}
                                  {msgIndex > 0 && (
                                    <span className="text-[10px] text-muted-foreground/40 ml-2">
                                      {formatMessageTime(msg.createdAt)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* File Preview Cards */}
                                {MOCK_FILES[msg.id] && (
                                  <div className="flex flex-wrap gap-2">
                                    {MOCK_FILES[msg.id].map((file, fi) => (
                                      <FilePreviewCard
                                        key={fi}
                                        file={file}
                                        onImageClick={file.type === "image" ? () => setLightboxImage("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop") : undefined}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Emoji Reactions */}
                          {MOCK_REACTIONS[sender.id] && (
                            <EmojiReactions
                              reactions={MOCK_REACTIONS[sender.id]}
                              onAdd={() => setShowEmojiPicker(sender.id)}
                            />
                          )}

                          {/* Thread Reply Indicator */}
                          {MOCK_THREADS[sender.id] && (
                            <button className="flex items-center gap-1.5 mt-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="font-medium">{MOCK_THREADS[sender.id]} replies</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Hover Action Bar */}
                      <AnimatePresence>
                        {hoveredMsgId === sender.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute top-0 right-2 -translate-y-1/2 flex items-center gap-0.5 bg-card border border-border/60 rounded-lg shadow-md px-1 py-0.5"
                          >
                            {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
                              <button
                                key={emoji}
                                className="w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center text-sm transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                            <div className="w-px h-5 bg-border/50 mx-0.5" />
                            <button className="w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors">
                              <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Empty state */}
          {isExpenseChat && filteredMessages.length === 0 && expenseMetadata && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the conversation below.</p>
            </div>
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {showTyping && <TypingIndicator />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Composer */}
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
      <ImageLightbox src={lightboxImage} alt="Chat image" onClose={() => setLightboxImage(null)} />
    </div>
  );
}
