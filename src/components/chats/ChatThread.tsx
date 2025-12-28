import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Users } from "lucide-react";
import { Chat, ChatMessage, ChatUser } from "@/hooks/useChats";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatThreadProps {
  chat: Chat;
  currentUser: ChatUser;
  getMemberById: (id: string) => ChatUser | null;
  onSendMessage: (text: string) => void;
  onSimulateReply: () => void;
}

export function ChatThread({
  chat,
  currentUser,
  getMemberById,
  onSendMessage,
  onSimulateReply,
}: ChatThreadProps) {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText.trim());
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{chat.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {chat.memberIds.length} members
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSimulateReply}
          className="gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Simulate Reply
        </Button>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {chat.messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            chat.messages.map((message) => {
              const sender = getMemberById(message.senderId);
              const isCurrentUser = message.senderId === currentUser.id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isCurrentUser && "flex-row-reverse"
                  )}
                >
                  <img
                    src={sender?.avatar || currentUser.avatar}
                    alt={sender?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div
                    className={cn(
                      "max-w-[70%] space-y-1",
                      isCurrentUser && "items-end"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isCurrentUser && "flex-row-reverse")}>
                      <span className="text-sm font-medium">
                        {isCurrentUser ? "You" : sender?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-secondary rounded-tl-sm"
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message composer */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!messageText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
