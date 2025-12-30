import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { MessageSquare, Sparkles, RefreshCw, X, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SyncedConversationsSidebar, SyncedConversation } from "@/components/chats/SyncedConversationsSidebar";
import { SyncedConversationThread } from "@/components/chats/SyncedConversationThread";
import { AITripDetectionPanel } from "@/components/chats/AITripDetectionPanel";
import { mockSyncedConversations, mockDetectedTrips } from "@/data/mockSyncedConversations";
import { Button } from "@/components/ui/button";
import { useChats, currentUser, teamMembers } from "@/hooks/useChats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
    // Check if we're navigating from search/notification
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
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">AI Inbox</h1>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              Beta
            </span>
          </div>
          <p className="text-muted-foreground">
            Synced conversations from your workspace tools
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </Button>
      </div>

      <Card className="h-[calc(100%-5rem)] overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar - Synced Conversations */}
          <div className="w-72 border-r border-border shrink-0 flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-sm">Synced Channels</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                From Slack, Teams & FlyBy
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
          <div className="flex-1 flex">
            <AnimatePresence mode="wait">
              {selectedConversation ? (
                <motion.div
                  key={selectedConversation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex"
                >
                  <div className="flex-1">
                    <SyncedConversationThread conversation={selectedConversation} />
                  </div>
                  {/* AI Trip Detection Panel */}
                  {detectedTrip && (
                    <AITripDetectionPanel 
                      detectedTrip={detectedTrip} 
                      onReviewTrip={() => {}} 
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-muted-foreground"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">
                    Choose a synced channel to view detected travel intent
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {/* Floating AI Status Toast - positioned to avoid CTA buttons */}
      <AnimatePresence>
        {showAIStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 left-6 z-40 md:left-auto md:right-[420px]"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-background border border-border shadow-lg">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm text-muted-foreground">
                  AI monitoring {travelIntentCount} conversation{travelIntentCount !== 1 ? 's' : ''} with travel intent
                </span>
              </div>
              <button
                onClick={() => setShowAIStatus(false)}
                className="p-1 rounded-full hover:bg-secondary/80 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
