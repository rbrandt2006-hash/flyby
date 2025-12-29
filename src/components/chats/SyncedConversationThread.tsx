import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SyncedConversation, SyncedMessage } from "./SyncedConversationsSidebar";
import { Lock } from "lucide-react";

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
  // Create regex pattern from keywords (case insensitive)
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
          className="bg-primary/20 text-primary px-0.5 rounded font-medium"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  );
}

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.625 8.073c.574 0 1.094.234 1.469.609.375.375.609.895.609 1.469v4.97a2.077 2.077 0 0 1-2.078 2.078h-4.688v-3.516c0-1.23.469-2.344 1.23-3.164a4.436 4.436 0 0 1 3.458-1.446zm-5.977 9.126v-3.516H9.375v3.516a2.077 2.077 0 0 0 2.078 2.078h1.172a2.077 2.077 0 0 0 2.023-2.078zm.977-5.586c0-.574.234-1.094.609-1.469a2.075 2.075 0 0 1 1.469-.609 4.436 4.436 0 0 0-3.458 1.446 4.436 4.436 0 0 0-1.23 3.164v3.516h2.61v-6.048zM12 3c1.547 0 2.813 1.266 2.813 2.813S13.547 8.625 12 8.625 9.188 7.36 9.188 5.812 10.453 3 12 3zm6.328 2.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM5.672 5.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM3.375 8.073a2.077 2.077 0 0 0-2.078 2.078v4.97a2.077 2.077 0 0 0 2.078 2.078h4.688v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.458-1.446zm3.563 1.462a2.075 2.075 0 0 1 1.469.609c.375.375.609.895.609 1.469v6.048h2.609v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.457-1.446z"/>
    </svg>
  );
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
      {/* Thread header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {conversation.source === "slack" ? (
            <SlackIcon className="w-5 h-5 text-[#4A154B]" />
          ) : (
            <TeamsIcon className="w-5 h-5 text-[#6264A7]" />
          )}
          <div>
            <h2 className="font-semibold">{conversation.name}</h2>
            <p className="text-xs text-muted-foreground">
              #{conversation.channel} • {conversation.source === "slack" ? "Slack" : "Microsoft Teams"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
          <Lock className="w-3 h-3" />
          Read-only
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {groupedMessages.map(({ date, messages }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground font-medium">
                  {formatMessageDate(messages[0].createdAt)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3 group">
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName}
                      className="w-8 h-8 rounded-md object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {/* Platform indicator on hover */}
                        <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          via {conversation.source === "slack" ? (
                            <>
                              <SlackIcon className="w-2.5 h-2.5 text-[#4A154B]" />
                              Slack
                            </>
                          ) : (
                            <>
                              <TeamsIcon className="w-2.5 h-2.5 text-[#6264A7]" />
                              Teams
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-sm mt-1 leading-relaxed">
                        {highlightKeywords(message.text)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
