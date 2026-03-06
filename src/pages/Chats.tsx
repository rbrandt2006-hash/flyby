import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles, RefreshCw, X, Hash, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChannelsContainer, SyncedConversation } from "@/components/chats/ChannelsContainer";
import { ConversationCanvas, ExpenseMetadataForContext } from "@/components/chats/ConversationCanvas";
import { SmartTripAssistant } from "@/components/chats/SmartTripAssistant";
import { Platform } from "@/components/chats/PlatformSelector";
import { ChatContextPanel } from "@/components/chats/ChatContextPanel";
import { ExpenseApprovalQueue, mockApprovals } from "@/components/chats/ExpenseApprovalQueue";
import { mockSyncedConversations, mockDetectedTrips } from "@/data/mockSyncedConversations";
import { Button } from "@/components/ui/button";
import { useChats, ExpenseMetadata } from "@/hooks/useChats";
import { useExpenses } from "@/hooks/useExpenses";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Slack icon
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.625 8.073c.574 0 1.094.234 1.469.609.375.375.609.895.609 1.469v4.97a2.077 2.077 0 0 1-2.078 2.078h-4.688v-3.516c0-1.23.469-2.344 1.23-3.164a4.436 4.436 0 0 1 3.458-1.446zm-5.977 9.126v-3.516H9.375v3.516a2.077 2.077 0 0 0 2.078 2.078h1.172a2.077 2.077 0 0 0 2.023-2.078zm.977-5.586c0-.574.234-1.094.609-1.469a2.075 2.075 0 0 1 1.469-.609 4.436 4.436 0 0 0-3.458 1.446 4.436 4.436 0 0 0-1.23 3.164v3.516h2.61v-6.048zM12 3c1.547 0 2.813 1.266 2.813 2.813S13.547 8.625 12 8.625 9.188 7.36 9.188 5.812 10.453 3 12 3zm6.328 2.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM5.672 5.344a2.11 2.11 0 1 1 0 4.219 2.11 2.11 0 0 1 0-4.219zM3.375 8.073a2.077 2.077 0 0 0-2.078 2.078v4.97a2.077 2.077 0 0 0 2.078 2.078h4.688v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.458-1.446zm3.563 1.462a2.075 2.075 0 0 1 1.469.609c.375.375.609.895.609 1.469v6.048h2.609v-3.516a4.436 4.436 0 0 0-1.23-3.164 4.436 4.436 0 0 0-3.457-1.446z" />
    </svg>
  );
}

const platformTabs: { id: Platform; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Messages", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "slack", label: "Slack", icon: <SlackIcon className="w-4 h-4" /> },
  { id: "teams", label: "Teams", icon: <TeamsIcon className="w-4 h-4" /> },
  { id: "flyby", label: "Expense Approvals", icon: <Receipt className="w-4 h-4" /> },
];

export default function Chats() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chats, getMemberById, sendMessage, currentUser, systemUser } = useChats();
  const { expenses, getExpenseById } = useExpenses();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("all");

  const allConversations = useMemo(() => {
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
        expenseMetadata: chat.expenseMetadata,
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

  // Filter by platform — for "flyby" tab, we now show the dedicated approval queue
  const filteredConversations = useMemo(() => {
    if (selectedPlatform === "all") return allConversations;
    if (selectedPlatform === "flyby") {
      return allConversations.filter(c => c.source === "flyby" && ((c as any).type === "expense_approval" || (c as any).expenseId));
    }
    return allConversations.filter(c => c.source === selectedPlatform);
  }, [allConversations, selectedPlatform]);

  const platformCounts = useMemo(() => ({
    slack: allConversations.filter(c => c.source === "slack").length,
    teams: allConversations.filter(c => c.source === "teams").length,
    flyby: mockApprovals.filter(a => a.status === "pending").length,
  }), [allConversations]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const stateId = location.state?.openChatId || location.state?.entityId;
    if (stateId) return stateId;
    return allConversations[0]?.id || null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(true);

  useEffect(() => {
    const stateId = location.state?.openChatId || location.state?.entityId;
    if (stateId && allConversations.find(c => c.id === stateId)) {
      setSelectedId(stateId);
    }
  }, [location.state, allConversations]);

  const selectedConversation = allConversations.find(c => c.id === selectedId) as SyncedConversation | undefined;
  const detectedTrip = selectedId ? mockDetectedTrips[selectedId] : null;
  const travelIntentCount = allConversations.filter(c => c.hasTravelIntent).length;

  const selectedExpenseMetadata = useMemo(() => {
    if (!selectedConversation?.expenseId) return undefined;
    const chat = chats.find(c => c.id === selectedConversation.id);
    if (chat?.expenseMetadata) return chat.expenseMetadata as ExpenseMetadataForContext;
    const expense = getExpenseById(selectedConversation.expenseId);
    if (expense) {
      return {
        merchant: expense.merchant,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        submitterName: "Julia",
        submittedAt: expense.supervisorSentAt || new Date().toISOString(),
      } as ExpenseMetadataForContext;
    }
    return undefined;
  }, [selectedConversation, chats, getExpenseById]);

  const selectedExpenseStatus = useMemo(() => {
    if (!selectedConversation?.expenseId) return undefined;
    const expense = getExpenseById(selectedConversation.expenseId);
    return expense?.status;
  }, [selectedConversation, getExpenseById]);

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
    if (selectedConversation && (selectedConversation.type === "expense_approval" || selectedConversation.expenseId)) {
      sendMessage(selectedConversation.id, text, currentUser.id, false);
      return;
    }
    toast.success(`Message sent via ${selectedConversation?.source || "Flyby"}`);
  };

  const isExpenseApprovalsTab = selectedPlatform === "flyby";

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header with tabs */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
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

        {/* Horizontal Platform Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit">
          {platformTabs.map((tab) => {
            const isActive = selectedPlatform === tab.id;
            const count = tab.id === "all" 
              ? platformCounts.slack + platformCounts.teams
              : platformCounts[tab.id as keyof typeof platformCounts] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedPlatform(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="h-[calc(100%-7rem)]">
        {isExpenseApprovalsTab ? (
          /* Expense Approval Queue — dedicated full-width view */
          <ExpenseApprovalQueue />
        ) : (
          /* Standard 2-Panel Layout: Channels | Conversation */
          <div className="h-full flex gap-3">
            {/* Left: Channels */}
            <div className="w-72 shrink-0">
              <ChannelsContainer
                conversations={filteredConversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
                connectedPlatforms={{ slack: true, teams: true }}
              />
            </div>

            {/* Right: Conversation Canvas + Context */}
            <div className="flex-1 flex gap-3 min-w-0">
              <div className="flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden relative border-border/60">
                <AnimatePresence mode="wait">
                  {selectedConversation ? (
                    <motion.div
                      key={selectedConversation.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <ConversationCanvas
                        conversation={selectedConversation}
                        onSendMessage={handleSendMessage}
                        expenseMetadata={selectedExpenseMetadata}
                        expenseStatus={selectedExpenseStatus}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 opacity-40" />
                      </div>
                      <p className="text-sm font-medium">Select a conversation</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Choose a channel to view messages
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {detectedTrip && (
                  <div className="absolute bottom-24 right-6 z-10">
                    <SmartTripAssistant detectedTrip={detectedTrip} onReviewTrip={() => {
                      toast.success("Trip review opened — navigating to Trips");
                      navigate("/trips");
                    }} />
                  </div>
                )}
              </div>

              <div className="w-56 shrink-0 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden hidden xl:block">
                <ChatContextPanel conversation={selectedConversation || null} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Status */}
      <AnimatePresence>
        {showAIStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 left-5 z-40"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/40 shadow-lg">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-xs text-muted-foreground">
                Monitoring {travelIntentCount} channel{travelIntentCount !== 1 ? 's' : ''} for travel intent
              </span>
              <button onClick={() => setShowAIStatus(false)} className="p-1 rounded-lg hover:bg-muted transition-colors ml-1">
                <X className="w-3 h-3 text-muted-foreground/60" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
