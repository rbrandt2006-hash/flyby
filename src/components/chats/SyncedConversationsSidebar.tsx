import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";

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

export interface SyncedMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
}

export interface SyncedConversation {
  id: string;
  name: string;
  source: "slack" | "teams" | "flyby";
  channel: string;
  messages: SyncedMessage[];
  hasTravelIntent: boolean;
  lastUpdated: string;
}

interface SyncedConversationsSidebarProps {
  conversations: SyncedConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SyncedConversationsSidebar({
  conversations,
  selectedId,
  onSelect,
}: SyncedConversationsSidebarProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, "h:mm a");
    } else if (diffDays < 7) {
      return format(date, "EEE");
    }
    return format(date, "MMM d");
  };

  const getSourceBadge = (source: "slack" | "teams" | "flyby") => {
    if (source === "slack") {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#4A154B]/10 text-[#4A154B] text-[10px] font-medium">
          <SlackIcon className="w-2.5 h-2.5" />
          Slack
        </span>
      );
    }
    if (source === "flyby") {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
          FlyBy
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#6264A7]/10 text-[#6264A7] text-[10px] font-medium">
        <TeamsIcon className="w-2.5 h-2.5" />
        Teams
      </span>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {conversations.map((conv) => {
          const lastMessage = conv.messages[conv.messages.length - 1];
          const isSelected = conv.id === selectedId;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all duration-200",
                isSelected
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-secondary/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate text-sm">{conv.name}</h3>
                    {conv.hasTravelIntent && (
                      <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                        <Sparkles className="w-2.5 h-2.5" />
                        Trip
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getSourceBadge(conv.source)}
                    <span className="text-xs text-muted-foreground">
                      #{conv.channel}
                    </span>
                  </div>
                </div>
                {lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTime(lastMessage.createdAt)}
                  </span>
                )}
              </div>
              {lastMessage && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  <span className="font-medium">
                    {lastMessage.senderName.split(" ")[0]}:
                  </span>{" "}
                  {lastMessage.text}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
