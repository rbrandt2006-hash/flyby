import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Sparkles, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SyncedConversationsSidebar, SyncedConversation } from "@/components/chats/SyncedConversationsSidebar";
import { SyncedConversationThread } from "@/components/chats/SyncedConversationThread";
import { AITripDetectionPanel } from "@/components/chats/AITripDetectionPanel";
import { mockSyncedConversations, mockDetectedTrips } from "@/data/mockSyncedConversations";
import { Button } from "@/components/ui/button";
import { useChats, currentUser, teamMembers } from "@/hooks/useChats";

export default function Chats() {
  const location = useLocation();
  const { chats } = useChats();
  
  // Merge synced conversations with dynamic expense approval chats
  const allConversations = useMemo(() => {
    const expenseChats: SyncedConversation[] = chats
      .filter(chat => chat.name.includes("Expense Approval"))
      .map(chat => ({
        id: chat.id,
        name: chat.name,
        source: "flyby" as const,
        channel: "expenses",
        hasTravelIntent: false,
        lastUpdated: chat.createdAt,
        messages: chat.messages.map(m => {
          const sender = m.senderId === currentUser.id ? currentUser : teamMembers.find(t => t.id === m.senderId);
          return {
            id: m.id,
            senderId: m.senderId,
            senderName: sender?.name || "Unknown",
            senderAvatar: sender?.avatar || "",
            text: m.text,
            createdAt: m.createdAt,
          };
        }),
      }));
    return [...expenseChats, ...mockSyncedConversations];
  }, [chats]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const stateId = location.state?.openChatId || location.state?.entityId;
    if (stateId) return stateId;
    return allConversations[0]?.id || null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);

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
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in">
      {/* Clean header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Synced from Slack, Teams & internal channels
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </div>

      {/* Main container with clean borders */}
      <div className="h-[calc(100%-4rem)] bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar - Conversations list */}
          <div className="w-72 border-r border-border/60 shrink-0 flex flex-col bg-secondary/30">
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Channels
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <SyncedConversationsSidebar
                conversations={allConversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </div>

          {/* Main conversation area */}
          <div className="flex-1 flex min-w-0">
            <AnimatePresence mode="wait">
              {selectedConversation ? (
                <motion.div
                  key={selectedConversation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <SyncedConversationThread conversation={selectedConversation} />
                  </div>
                  
                  {/* AI Panel - contextual assistant */}
                  <AnimatePresence>
                    {detectedTrip && showAIPanel && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 340, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <AITripDetectionPanel 
                          detectedTrip={detectedTrip} 
                          onReviewTrip={() => {}}
                          onClose={() => setShowAIPanel(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-muted-foreground"
                >
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">Select a conversation</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Choose a channel to view messages
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Minimal AI Status indicator */}
      <AnimatePresence>
        {showAIStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 left-5 z-40"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/60 shadow-md">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-xs text-muted-foreground">
                Monitoring {travelIntentCount} channel{travelIntentCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowAIStatus(false)}
                className="p-0.5 rounded hover:bg-muted transition-colors ml-1"
              >
                <X className="w-3 h-3 text-muted-foreground/60" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
