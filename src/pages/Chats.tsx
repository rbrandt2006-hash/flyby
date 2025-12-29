import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageSquare, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SyncedConversationsSidebar, SyncedConversation } from "@/components/chats/SyncedConversationsSidebar";
import { SyncedConversationThread } from "@/components/chats/SyncedConversationThread";
import { AITripDetectionPanel } from "@/components/chats/AITripDetectionPanel";
import { mockSyncedConversations, mockDetectedTrips } from "@/data/mockSyncedConversations";
import { Button } from "@/components/ui/button";

export default function Chats() {
  const [conversations] = useState<SyncedConversation[]>(mockSyncedConversations);
  const [selectedId, setSelectedId] = useState<string | null>(mockSyncedConversations[0]?.id || null);
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedConversation = conversations.find(c => c.id === selectedId);
  const detectedTrip = selectedId ? mockDetectedTrips[selectedId] : null;

  const handleSync = () => {
    setIsSyncing(true);
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
                From Slack & Teams
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <SyncedConversationsSidebar
                conversations={conversations}
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

      {/* Floating AI indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-24 right-8 md:bottom-8"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-lg">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            AI is monitoring {conversations.filter(c => c.hasTravelIntent).length} conversations with travel intent
          </span>
        </div>
      </motion.div>
    </div>
  );
}
