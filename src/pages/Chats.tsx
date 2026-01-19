import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Sparkles, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChannelsContainer, SyncedConversation } from "@/components/chats/ChannelsContainer";
import { ConversationCanvas } from "@/components/chats/ConversationCanvas";
import { SmartTripAssistant } from "@/components/chats/SmartTripAssistant";
import { mockSyncedConversations, mockDetectedTrips } from "@/data/mockSyncedConversations";
import { Button } from "@/components/ui/button";
import { useChats } from "@/hooks/useChats";
import { toast } from "sonner";
export default function Chats() {
  const location = useLocation();
  const {
    chats,
    getMemberById,
    systemUser
  } = useChats();

  // Merge synced conversations with dynamic expense approval chats
  const allConversations = useMemo(() => {
    // Filter chats that have expense approval or linked expense
    const expenseChats: SyncedConversation[] = chats
      .filter(chat => chat.type === "expense_approval" || chat.expenseId)
      .map(chat => ({
        id: chat.id,
        name: chat.name,
        source: "flyby" as const,
        channel: "expenses",
        hasTravelIntent: false,
        lastUpdated: chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1].createdAt 
          : chat.createdAt,
        type: chat.type,
        expenseId: chat.expenseId,
        messages: chat.messages.map(m => {
          const member = getMemberById(m.senderId);
          return {
            id: m.id,
            senderId: m.senderId,
            senderName: member?.name || "Unknown",
            senderAvatar: member?.avatar || "",
            text: m.text,
            createdAt: m.createdAt,
            isSystemMessage: m.isSystemMessage,
            expenseId: m.expenseId,
            messageType: m.messageType,
          };
        })
      }));
    return [...expenseChats, ...mockSyncedConversations];
  }, [chats, getMemberById]);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const stateId = location.state?.openChatId || location.state?.entityId;
    if (stateId) return stateId;
    return allConversations[0]?.id || null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(true);

  // Handle navigation state for opening specific chat
  useEffect(() => {
    const stateId = location.state?.openChatId || location.state?.entityId;
    if (stateId && allConversations.find(c => c.id === stateId)) {
      setSelectedId(stateId);
    }
  }, [location.state, allConversations]);
  const selectedConversation = allConversations.find(c => c.id === selectedId);
  const detectedTrip = selectedId ? mockDetectedTrips[selectedId] : null;
  const travelIntentCount = allConversations.filter(c => c.hasTravelIntent).length;

  // Auto-dismiss AI status after 8 seconds
  useEffect(() => {
    if (showAIStatus) {
      const timer = setTimeout(() => setShowAIStatus(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showAIStatus]);
  const handleSync = () => {
    setIsSyncing(true);
    setShowAIStatus(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Channels synced");
    }, 2000);
  };
  const handleSendMessage = (text: string) => {
    // In a real app, this would send to Slack/Teams API
    toast.success(`Message sent via ${selectedConversation?.source || "Flyby"}`);
  };

  // Mock connected platforms
  const connectedPlatforms = {
    slack: true,
    teams: true
  };
  return <div className="h-[calc(100vh-8rem)] animate-fade-in">
      {/* Clean header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified messaging across Slack, Teams & internal channels
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleSync} disabled={isSyncing}>
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>

      {/* 3-Zone Layout with spacing-based separation */}
      <div className="h-[calc(100%-4rem)] flex gap-6">
        {/* Left: Channels Container (Card Style) */}
        <div className="w-72 shrink-0">
          <ChannelsContainer conversations={allConversations} selectedId={selectedId} onSelect={setSelectedId} connectedPlatforms={connectedPlatforms} />
        </div>

        {/* Center: Conversation Canvas */}
        <div className="flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden relative border-[#7698cb]">
          <AnimatePresence mode="wait">
            {selectedConversation ? <motion.div key={selectedConversation.id} initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.15
          }} className="h-full">
                <ConversationCanvas conversation={selectedConversation} onSendMessage={handleSendMessage} />
              </motion.div> : <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">Select a conversation</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Choose a channel to view messages
                </p>
              </motion.div>}
          </AnimatePresence>

          {/* Smart Trip Assistant - Floating Pill */}
          {detectedTrip && <div className="absolute bottom-24 right-6 z-10">
              <SmartTripAssistant detectedTrip={detectedTrip} onReviewTrip={() => {}} />
            </div>}
        </div>
      </div>

      {/* Minimal AI Status indicator */}
      <AnimatePresence>
        {showAIStatus && <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 5
      }} transition={{
        duration: 0.2
      }} className="fixed bottom-5 left-5 z-40">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/40 shadow-lg">
              <motion.div animate={{
            opacity: [0.5, 1, 0.5]
          }} transition={{
            duration: 2,
            repeat: Infinity
          }}>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-xs text-muted-foreground">
                Monitoring {travelIntentCount} channel{travelIntentCount !== 1 ? 's' : ''} for travel intent
              </span>
              <button onClick={() => setShowAIStatus(false)} className="p-1 rounded-lg hover:bg-muted transition-colors ml-1">
                <X className="w-3 h-3 text-muted-foreground/60" />
              </button>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
}