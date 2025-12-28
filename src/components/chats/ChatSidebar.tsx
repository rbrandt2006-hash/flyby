import { Chat, ChatUser } from "@/hooks/useChats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  getMemberById: (id: string) => ChatUser | null;
  getLastMessage: (chat: Chat) => { text: string; senderId: string; createdAt: string } | null;
}

export function ChatSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  getMemberById,
  getLastMessage,
}: ChatSidebarProps) {
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

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
        <p className="font-medium">No chats yet</p>
        <p className="text-sm">Create a group chat from the Team page</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {chats.map((chat) => {
          const lastMessage = getLastMessage(chat);
          const lastSender = lastMessage ? getMemberById(lastMessage.senderId) : null;
          const isSelected = chat.id === selectedChatId;

          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-secondary/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{chat.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" />
                    {chat.memberIds.length} members
                  </p>
                </div>
                {lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTime(lastMessage.createdAt)}
                  </span>
                )}
              </div>
              {lastMessage && (
                <p className="text-sm text-muted-foreground mt-2 truncate">
                  <span className="font-medium">
                    {lastSender?.name?.split(" ")[0] || "Someone"}:
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
