import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Sparkles, Hash, Check } from "lucide-react";
import { motion } from "framer-motion";

// Slack icon component
function SlackIcon({
  className
}: {
  className?: string;
}) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>;
}

// Teams icon component
function TeamsIcon({
  className
}: {
  className?: string;
}) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.625 8.073c.574 0 1.094.234 1.469.609.375.375.609.895.609 1.469v4.97a2.077 2.077 0 0 1-2.078 2.078h-4.688v-3.516c0-1.23.469-2.344 1.23-3.164a4.436 4.436 0 0 1 3.458-1.446zm-5.977 9.126v-3.516H9.375v3.516a2.077 2.077 0 0 0 2.078 2.078h1.172a2.077 2.077 0 0 0 2.023-2.078zm.977-5.586c0-.574.234-1.094.609-1.469a2.075 2.075 0 0 1 1.469-.609 4.436 4.436 0 0 0-3.458 1.446 4.436 4.436 0 0 0-1.23 3.164v3.516h2.61v-6.048zM12 3c1.547 0 2.813 1.266 2.813 2.813S13.547 8.625 12 8.625 9.188 7.36 9.188 5.812 10.453 3 12 3zm6.328 2.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM5.672 5.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM3.375 8.073a2.077 2.077 0 0 0-2.078 2.078v4.97a2.077 2.077 0 0 0 2.078 2.078h4.688v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.458-1.446zm3.563 1.462a2.075 2.075 0 0 1 1.469.609c.375.375.609.895.609 1.469v6.048h2.609v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.457-1.446z" />
    </svg>;
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
interface ChannelsContainerProps {
  conversations: SyncedConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  connectedPlatforms: {
    slack: boolean;
    teams: boolean;
  };
}
export function ChannelsContainer({
  conversations,
  selectedId,
  onSelect,
  connectedPlatforms
}: ChannelsContainerProps) {
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
  const getSourceIcon = (source: "slack" | "teams" | "flyby") => {
    if (source === "slack") {
      return <SlackIcon className="w-3.5 h-3.5" />;
    }
    if (source === "teams") {
      return <TeamsIcon className="w-3.5 h-3.5" />;
    }
    return <Hash className="w-3.5 h-3.5" />;
  };

  // Group conversations by source
  const slackConvos = conversations.filter(c => c.source === "slack");
  const teamsConvos = conversations.filter(c => c.source === "teams");
  const internalConvos = conversations.filter(c => c.source === "flyby");
  return <div className="h-full flex flex-col bg-secondary/30 rounded-2xl border shadow-sm overflow-hidden border-[#7698cb]">
      {/* Connection Status */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          {connectedPlatforms.slack && <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlackIcon className="w-3.5 h-3.5 text-[#4A154B]" />
              <Check className="w-3 h-3 text-success" />
            </div>}
          {connectedPlatforms.teams && <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TeamsIcon className="w-3.5 h-3.5 text-[#6264A7]" />
              <Check className="w-3 h-3 text-success" />
            </div>}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Slack Channels */}
          {slackConvos.length > 0 && <div>
              <div className="flex items-center gap-2 px-2 mb-2">
                <SlackIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Slack
                </span>
              </div>
              <div className="space-y-1">
                {slackConvos.map(conv => <ChannelRow key={conv.id} conversation={conv} isSelected={conv.id === selectedId} onSelect={() => onSelect(conv.id)} formatTime={formatTime} getSourceIcon={getSourceIcon} />)}
              </div>
            </div>}

          {/* Teams Channels */}
          {teamsConvos.length > 0 && <div>
              <div className="flex items-center gap-2 px-2 mb-2">
                <TeamsIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Teams
                </span>
              </div>
              <div className="space-y-1">
                {teamsConvos.map(conv => <ChannelRow key={conv.id} conversation={conv} isSelected={conv.id === selectedId} onSelect={() => onSelect(conv.id)} formatTime={formatTime} getSourceIcon={getSourceIcon} />)}
              </div>
            </div>}

          {/* Internal Channels */}
          {internalConvos.length > 0 && <div>
              <div className="flex items-center gap-2 px-2 mb-2">
                <Hash className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Internal
                </span>
              </div>
              <div className="space-y-1">
                {internalConvos.map(conv => <ChannelRow key={conv.id} conversation={conv} isSelected={conv.id === selectedId} onSelect={() => onSelect(conv.id)} formatTime={formatTime} getSourceIcon={getSourceIcon} />)}
              </div>
            </div>}
        </div>
      </ScrollArea>
    </div>;
}
function ChannelRow({
  conversation,
  isSelected,
  onSelect,
  formatTime,
  getSourceIcon
}: {
  conversation: SyncedConversation;
  isSelected: boolean;
  onSelect: () => void;
  formatTime: (dateStr: string) => string;
  getSourceIcon: (source: "slack" | "teams" | "flyby") => React.ReactNode;
}) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return <motion.button onClick={onSelect} whileHover={{
    scale: 1.01
  }} whileTap={{
    scale: 0.99
  }} className={cn("w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150", isSelected ? "bg-primary/10 shadow-sm" : "hover:bg-muted/60")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-sm truncate", isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
            {conversation.name}
          </span>
          {conversation.hasTravelIntent && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />}
        </div>
        {lastMessage && <span className="text-[10px] text-muted-foreground/50 shrink-0">
            {formatTime(lastMessage.createdAt)}
          </span>}
      </div>
      {lastMessage && <p className="text-xs text-muted-foreground/60 mt-1 truncate">
          {lastMessage.senderName.split(" ")[0]}: {lastMessage.text}
        </p>}
    </motion.button>;
}