import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SyncedConversation, SyncedMessage } from "./SyncedConversationsSidebar";
import { Hash } from "lucide-react";

// Travel-related keywords to highlight
const TRAVEL_KEYWORDS = [
  "travel", "trip", "flight", "hotel", "meeting", "conference",
  "client", "NYC", "New York", "SF", "San Francisco", "LA", "Los Angeles",
  "Chicago", "Boston", "Seattle", "Austin", "Denver", "Miami",
  "next week", "next month", "tomorrow", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "visit", "office", "headquarters", "HQ",
  "presentation", "pitch", "demo", "workshop", "summit", "event"
];

interface SyncedConversationThreadProps {
  conversation: SyncedConversation;
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
          className="text-primary font-medium"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function SyncedConversationThread({ conversation }: SyncedConversationThreadProps) {
  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  const formatMessageDate = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE, MMMM d");
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: SyncedMessage[] }[] = [];
  conversation.messages.forEach((message) => {
    const dateKey = format(new Date(message.createdAt), "yyyy-MM-dd");
    const existingGroup = groupedMessages.find(g => g.date === dateKey);
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groupedMessages.push({ date: dateKey, messages: [message] });
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Minimal thread header */}
      <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground/50" />
          <h2 className="font-medium text-sm">{conversation.name}</h2>
          <span className="text-xs text-muted-foreground/50">•</span>
          <span className="text-xs text-muted-foreground/60 capitalize">
            {conversation.source === "flyby" ? "Internal" : conversation.source}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
          Read-only
        </span>
      </div>

      {/* Messages area - modern Slack/Linear style */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4">
          {groupedMessages.map(({ date, messages }, groupIndex) => (
            <div key={date} className={cn(groupIndex > 0 && "mt-6")}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                  {formatMessageDate(messages[0].createdAt)}
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              
              {/* Messages */}
              <div className="space-y-4">
                {messages.map((message, msgIndex) => {
                  // Check if previous message is from same sender (within 5 mins)
                  const prevMessage = msgIndex > 0 ? messages[msgIndex - 1] : null;
                  const isContinuation = prevMessage && 
                    prevMessage.senderId === message.senderId &&
                    (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) < 300000;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={cn(
                        "flex gap-3 group",
                        isContinuation && "-mt-2"
                      )}
                    >
                      {!isContinuation ? (
                        <img
                          src={message.senderAvatar}
                          alt={message.senderName}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {!isContinuation && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground">
                              {message.senderName}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {formatMessageTime(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {highlightKeywords(message.text)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
