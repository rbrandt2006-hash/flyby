import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useChats } from "@/hooks/useChats";
import { ChatSidebar } from "@/components/chats/ChatSidebar";
import { ChatThread } from "@/components/chats/ChatThread";

export default function Chats() {
  const [searchParams] = useSearchParams();
  const {
    chats,
    selectedChatId,
    setSelectedChatId,
    sendMessage,
    simulateReply,
    getChatById,
    getLastMessage,
    getMemberById,
    currentUser,
  } = useChats();

  // Select chat from URL param if provided
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      setSelectedChatId(chatId);
    }
  }, [searchParams, setSelectedChatId]);

  const selectedChat = selectedChatId ? getChatById(selectedChatId) : null;

  const handleSendMessage = (text: string) => {
    if (selectedChatId) {
      sendMessage(selectedChatId, text);
    }
  };

  const handleSimulateReply = () => {
    if (selectedChatId) {
      simulateReply(selectedChatId);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Chats</h1>
        <p className="text-muted-foreground">
          Group conversations with your team
        </p>
      </div>

      <Card className="h-[calc(100%-5rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-border shrink-0">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">All Chats</h2>
            </div>
            <div className="h-[calc(100%-57px)]">
              <ChatSidebar
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={setSelectedChatId}
                getMemberById={getMemberById}
                getLastMessage={getLastMessage}
              />
            </div>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <ChatThread
                chat={selectedChat}
                currentUser={currentUser}
                getMemberById={getMemberById}
                onSendMessage={handleSendMessage}
                onSimulateReply={handleSimulateReply}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a chat</p>
                <p className="text-sm">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
