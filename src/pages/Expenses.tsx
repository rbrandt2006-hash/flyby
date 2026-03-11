import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ConnectCardModal from "@/components/expenses/ConnectCardModal";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { SendToSupervisorModal } from "@/components/expenses/SendToSupervisorModal";
import { DisputeModal } from "@/components/expenses/DisputeModal";
import { ExpenseTripGroup, UnassignedExpenseGroup } from "@/components/expenses/ExpenseTripGroup";
import { ExpenseDrawer } from "@/components/expenses/ExpenseDrawer";
import { ExpenseAnalyticsModal } from "@/components/expenses/ExpenseAnalyticsModal";
import { AIExpenseInsights } from "@/components/expenses/AIExpenseInsights";
import { ExpenseDetailModal } from "@/components/expenses/ExpenseDetailModal";
import { ExpenseHistoryTable } from "@/components/expenses/ExpenseHistoryTable";
import { EditExpenseDrawer } from "@/components/expenses/EditExpenseDrawer";
import { ExpenseViewDrawer } from "@/components/expenses/ExpenseViewDrawer";
import { demoExpenses, demoStats, type DemoExpense } from "@/components/expenses/demoExpenseData";
import { useExpenses, type Expense } from "@/hooks/useExpenses";
import { useChats } from "@/hooks/useChats";
import { toast } from "sonner";
import { 
  Plane, Building2, Utensils, Car, CreditCard, Receipt, AlertCircle,
  Send, Flag, CheckCircle, ArrowRight, Plus, Check, Gamepad2, Briefcase,
  ChevronDown, ChevronUp, Filter, BarChart3
} from "lucide-react";

const categoryIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Building2,
  meals: Utensils,
  transportation: Car,
  entertainment: Gamepad2,
  office: Briefcase,
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "destructive" }> = {
  approved: { label: "Approved", variant: "success" },
  submitted: { label: "Submitted", variant: "info" },
  pending: { label: "Pending", variant: "warning" },
  flagged: { label: "Flagged", variant: "destructive" },
  disputed: { label: "Disputed", variant: "destructive" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function Expenses() {
  const { 
    expenses, 
    expensesByTrip,
    addExpense, 
    updateExpense, 
    sendToSupervisor, 
    toggleReimbursable, 
    fileDispute, 
    linkChatToExpense, 
    totalPending, 
    totalApproved,
    totalDisputed,
  } = useExpenses();
  const { getOrCreateExpenseChat, sendMessage, sendExpenseSystemMessage, postExpenseUpdate, supervisorMap, findChatByExpenseId } = useChats();
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCardConnected, setIsCardConnected] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSendSupervisorOpen, setIsSendSupervisorOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  // Demo drawer + analytics state
  const [demoDrawerStatus, setDemoDrawerStatus] = useState<DemoExpense["status"] | null>(null);
  const [demoExpenseList, setDemoExpenseList] = useState<DemoExpense[]>(demoExpenses);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DemoExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<DemoExpense | null>(null);
  const drawerTitle = useMemo(() => {
    if (demoDrawerStatus === "pending") return "Pending Approvals";
    if (demoDrawerStatus === "approved") return "Approved Expenses";
    if (demoDrawerStatus === "disputed") return "Disputed Expenses";
    return "All Expenses";
  }, [demoDrawerStatus]);

  const drawerExpenses = useMemo(() =>
    demoDrawerStatus ? demoExpenseList.filter(e => e.status === demoDrawerStatus) : demoExpenseList,
    [demoExpenseList, demoDrawerStatus]
  );

  const handleUpdateDemoExpense = (id: string, status: DemoExpense["status"]) => {
    setDemoExpenseList(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const handleEditDemoExpense = (id: string, updates: Partial<DemoExpense>) => {
    setDemoExpenseList(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    toast.success("Expense updated successfully");
  };

  const uniqueTripNames = useMemo(() => {
    const trips = new Set<string>();
    demoExpenseList.forEach(e => { if (e.tripName) trips.add(e.tripName); });
    return Array.from(trips);
  }, [demoExpenseList]);

  // Live totals from demo data
  const livePending = useMemo(() => demoExpenseList.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0), [demoExpenseList]);
  const liveApproved = useMemo(() => demoExpenseList.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0), [demoExpenseList]);
  const liveDisputed = useMemo(() => demoExpenseList.filter(e => e.status === "disputed").reduce((s, e) => s + e.amount, 0), [demoExpenseList]);
  const liveTotal = useMemo(() => demoExpenseList.reduce((s, e) => s + e.amount, 0), [demoExpenseList]);

  // Expand/Collapse state
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(() => {
    const { groups } = expensesByTrip;
    if (groups.length <= 3 && groups.length > 0) {
      return new Set([groups[0].tripId]);
    }
    return new Set();
  });
  const [unassignedExpanded, setUnassignedExpanded] = useState(false);

  // Filters
  const [showDisputedOnly, setShowDisputedOnly] = useState(false);
  const [showReimbursableOnly, setShowReimbursableOnly] = useState(false);

  // Filter expenses based on current filters
  const filterExpenses = useCallback((expenseList: Expense[]) => {
    return expenseList.filter((expense) => {
      if (showDisputedOnly && expense.status !== "disputed") return false;
      if (showReimbursableOnly && !expense.reimbursable) return false;
      return true;
    });
  }, [showDisputedOnly, showReimbursableOnly]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return expensesByTrip.groups.map((group) => ({
      ...group,
      filteredExpenses: filterExpenses(group.expenses),
    })).filter((group) => group.filteredExpenses.length > 0);
  }, [expensesByTrip.groups, filterExpenses]);

  const filteredUnassigned = useMemo(() => {
    return filterExpenses(expensesByTrip.unassigned);
  }, [expensesByTrip.unassigned, filterExpenses]);

  // Expand/Collapse all
  const handleExpandAll = () => {
    const allIds = new Set(filteredGroups.map((g) => g.tripId));
    setExpandedTrips(allIds);
    setUnassignedExpanded(true);
  };

  const handleCollapseAll = () => {
    setExpandedTrips(new Set());
    setUnassignedExpanded(false);
  };

  const toggleTripExpanded = (tripId: string) => {
    setExpandedTrips((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) {
        next.delete(tripId);
      } else {
        next.add(tripId);
      }
      return next;
    });
  };

  const handleAddExpense = (expenseData: Omit<Expense, "id">, submitNow: boolean) => {
    const saved = addExpense(expenseData);

    // Also add to the demo expense list so it appears in the Recent Expenses table
    const newDemo: DemoExpense = {
      id: saved.id,
      employee: "You",
      employeeInitials: "YO",
      tripName: expenseData.tripName || "Unassigned",
      vendor: expenseData.merchant,
      amount: expenseData.amount,
      date: expenseData.date,
      category: (["flight","hotel","meals","transportation","conference","other"].includes(expenseData.category)
        ? expenseData.category
        : "other") as DemoExpense["category"],
      status: submitNow ? "pending" : "pending",
      hasReceipt: false,
      notes: expenseData.description,
    };
    setDemoExpenseList(prev => [...prev, newDemo]);

    toast.success(submitNow ? "Expense submitted for approval" : "Expense added successfully");
    setIsAddExpenseOpen(false);
  };

  const handleSendToSupervisor = (supervisorName: string, note: string) => {
    if (!selectedExpense) return;
    
    const supervisor = supervisorMap[supervisorName];
    const supervisorId = supervisor?.id || "1";
    
    const expenseMetadata = {
      merchant: selectedExpense.merchant,
      amount: selectedExpense.amount,
      category: selectedExpense.category,
      description: selectedExpense.description,
      date: selectedExpense.date,
      submitterName: "Julia",
      submittedAt: new Date().toISOString(),
    };
    
    const chat = getOrCreateExpenseChat(supervisorId, supervisorName, selectedExpense.id, expenseMetadata);
    
    const categoryLabel = selectedExpense.category.charAt(0).toUpperCase() + selectedExpense.category.slice(1);
    const systemMessage = `Julia submitted an expense for approval:\n\n**${selectedExpense.merchant}** – $${selectedExpense.amount.toFixed(2)} (${categoryLabel})\n${selectedExpense.description}`;
    
    sendExpenseSystemMessage(chat.id, selectedExpense.id, "expense_submission", systemMessage);
    
    if (note.trim()) {
      setTimeout(() => {
        sendMessage(chat.id, note, "current", false);
      }, 300);
    }
    
    sendToSupervisor(selectedExpense.id, supervisorName);
    linkChatToExpense(selectedExpense.id, chat.id);
    
    setTimeout(() => {
      if (selectedExpense.amount > 500 || selectedExpense.status === "flagged") {
        sendMessage(chat.id, "Thanks for sending. Can you clarify the business purpose for this expense?", supervisorId, false);
      } else {
        postExpenseUpdate(chat.id, selectedExpense.id, "approved", supervisorName);
        updateExpense(selectedExpense.id, { status: "approved" });
      }
    }, 2500);
    
    toast.success(`Expense sent to ${supervisorName} – Check Chats for updates`);
    setSelectedExpense({ ...selectedExpense, status: "submitted", supervisorSentAt: new Date().toISOString(), supervisorName });
    setIsSendSupervisorOpen(false);
  };

  const handleUndoSubmission = () => {
    if (!selectedExpense) return;
    updateExpense(selectedExpense.id, {
      status: "pending",
      supervisorSentAt: undefined,
      supervisorName: undefined,
    });
    setSelectedExpense({
      ...selectedExpense,
      status: "pending",
      supervisorSentAt: undefined,
      supervisorName: undefined,
    });
    toast.success("Submission undone — expense is back to pending");
  };

  const handleToggleReimbursable = () => {
    if (!selectedExpense) return;
    toggleReimbursable(selectedExpense.id);
    const newValue = !selectedExpense.reimbursable;
    setSelectedExpense({ ...selectedExpense, reimbursable: newValue });
    toast.success(newValue ? "Marked reimbursable" : "Removed reimbursable");
  };

  const handleFileDispute = (reason: string, description: string) => {
    if (!selectedExpense) return;
    fileDispute(selectedExpense.id, reason, description);
    
    const existingChat = findChatByExpenseId(selectedExpense.id);
    if (existingChat) {
      postExpenseUpdate(existingChat.id, selectedExpense.id, "disputed", "Julia");
    }
    
    setSelectedExpense({ ...selectedExpense, status: "disputed", disputeReason: reason, disputeDescription: description, disputeFiledAt: new Date().toISOString() });
    toast.success("Dispute submitted");
  };

  const hasActiveFilters = showDisputedOnly || showReimbursableOnly;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage your business expenses by trip</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="rounded-xl" onClick={() => setIsAddExpenseOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add expense
          </Button>
        </motion.div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <AIExpenseInsights />
      </motion.div>

      {/* Stats Cards — interactive */}
      <motion.div variants={itemVariants}>
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Pending */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="cursor-pointer" onClick={() => setDemoDrawerStatus("pending")}>
                  <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:border-warning/40 hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold">${livePending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{demoExpenseList.filter(e => e.status === "pending").length} awaiting review · Click to review</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] p-3">
                <p className="font-semibold text-xs mb-1.5">Pending breakdown</p>
                <p className="text-xs text-muted-foreground">3 flights awaiting approval</p>
                <p className="text-xs text-muted-foreground">2 hotel receipts missing</p>
                <p className="text-xs text-muted-foreground">1 conference registration</p>
                <p className="text-xs font-medium mt-1.5">Sarah K., Marcus J., Priya P.</p>
                <p className="text-xs font-bold mt-1">Total: ${livePending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </TooltipContent>
            </Tooltip>

            {/* Approved */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="cursor-pointer" onClick={() => setDemoDrawerStatus("approved")}>
                  <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:border-success/40 hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Approved</p>
                          <p className="text-2xl font-bold">${liveApproved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{demoExpenseList.filter(e => e.status === "approved").length} expenses approved · Click to view</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] p-3">
                <p className="font-semibold text-xs mb-1.5">Recently approved</p>
                <p className="text-xs text-muted-foreground">Julia C. – United Airlines $498</p>
                <p className="text-xs text-muted-foreground">Priya P. – Edgewater Hotel $521</p>
                <p className="text-xs text-muted-foreground">Alex R. – Capital Grille $342</p>
                <p className="text-xs font-bold mt-1">Total: ${liveApproved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </TooltipContent>
            </Tooltip>

            {/* Disputed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="cursor-pointer" onClick={() => setDemoDrawerStatus("disputed")}>
                  <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 hover:border-destructive/40 hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                          <Flag className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Disputed</p>
                          <p className="text-2xl font-bold">${liveDisputed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{demoExpenseList.filter(e => e.status === "disputed").length} under review · Click to manage</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px] p-3">
                <p className="font-semibold text-xs mb-1.5">Active disputes</p>
                <p className="text-xs text-muted-foreground">Marcus J. – Marriott minibar $189</p>
                <p className="text-xs text-muted-foreground">Sarah K. – Uber $124.80 no receipt</p>
                <p className="text-xs text-muted-foreground">Priya P. – Peninsula Chicago $685 over policy</p>
                <p className="text-xs font-bold mt-1">Total: ${liveDisputed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </TooltipContent>
            </Tooltip>

            {/* Total / Analytics */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="cursor-pointer" onClick={() => setAnalyticsOpen(true)}>
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Expenses</p>
                          <p className="text-2xl font-bold">${liveTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <p className="text-xs text-primary/70 font-medium mt-2">Click for analytics dashboard →</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] p-3">
                <p className="font-semibold text-xs mb-1">Click to open</p>
                <p className="text-xs text-muted-foreground">Spend by category, employee, and month-over-month trends</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </motion.div>

      {/* Corporate Card CTA */}
      <motion.div variants={itemVariants}>
        {isCardConnected ? (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Corporate card connected</h3>
                  <p className="text-sm text-muted-foreground">American Express Business •••• 3456</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/20 bg-secondary/30">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Connect your corporate credit card</h3>
                  <p className="text-sm text-muted-foreground">Auto-import transactions and streamline expense tracking</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl shrink-0" onClick={() => setIsCardModalOpen(true)}>
                Connect card
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Filters & Controls */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="disputed-filter" checked={showDisputedOnly} onCheckedChange={setShowDisputedOnly} />
                  <Label htmlFor="disputed-filter" className="text-sm cursor-pointer">Disputed only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="reimbursable-filter" checked={showReimbursableOnly} onCheckedChange={setShowReimbursableOnly} />
                  <Label htmlFor="reimbursable-filter" className="text-sm cursor-pointer">Reimbursable only</Label>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setShowDisputedOnly(false); setShowReimbursableOnly(false); }}>
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={handleExpandAll}>
                  <ChevronDown className="w-3.5 h-3.5 mr-1" />Expand all
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={handleCollapseAll}>
                  <ChevronUp className="w-3.5 h-3.5 mr-1" />Collapse all
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grouped Expenses by Trip */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-lg font-semibold">Expenses by Trip</h2>
        
        {filteredGroups.length === 0 && filteredUnassigned.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">No matching expenses</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters ? "Try adjusting your filters to see more expenses." : "Add your first expense to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <ExpenseTripGroup
                key={group.tripId}
                group={group}
                isExpanded={expandedTrips.has(group.tripId)}
                onToggle={() => toggleTripExpanded(group.tripId)}
                onExpenseClick={setSelectedExpense}
                filteredExpenses={group.filteredExpenses}
              />
            ))}
            {filteredUnassigned.length > 0 && (
              <UnassignedExpenseGroup
                expenses={filteredUnassigned}
                isExpanded={unassignedExpanded}
                onToggle={() => setUnassignedExpanded(!unassignedExpanded)}
                onExpenseClick={setSelectedExpense}
              />
            )}
          </div>
        )}
      </motion.div>

      {/* Recent Expenses History Table */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Expenses</h2>
        <ExpenseHistoryTable
          expenses={demoExpenseList}
          onViewReceipt={(expense) => setViewingExpense(expense)}
          onEdit={(expense) => setEditingExpense(expense)}
          onDelete={(expense) => {
            setDemoExpenseList(prev => prev.filter(e => e.id !== expense.id));
            toast.success(`${expense.vendor} expense deleted`);
          }}
          onTripClick={(tripName) => toast.info(`Viewing expenses for ${tripName}`)}
          onRowClick={(expense) => setViewingExpense(expense)}
        />
      </motion.div>

      {/* Expense Detail Modal (centered) */}
      <ExpenseDetailModal
        expense={selectedExpense}
        open={!!selectedExpense}
        onOpenChange={(open) => { if (!open) setSelectedExpense(null); }}
        onSendToSupervisor={() => setIsSendSupervisorOpen(true)}
        onToggleReimbursable={handleToggleReimbursable}
        onDispute={() => setIsDisputeOpen(true)}
        onUndoSubmission={handleUndoSubmission}
      />

      {/* Modals */}
      <ConnectCardModal open={isCardModalOpen} onOpenChange={setIsCardModalOpen} onSuccess={() => setIsCardConnected(true)} />
      <AddExpenseModal open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen} onSave={handleAddExpense} />
      {selectedExpense && (
        <>
          <SendToSupervisorModal open={isSendSupervisorOpen} onOpenChange={setIsSendSupervisorOpen} expenseMerchant={selectedExpense.merchant} expenseAmount={selectedExpense.amount} onSend={handleSendToSupervisor} />
          <DisputeModal open={isDisputeOpen} onOpenChange={setIsDisputeOpen} expenseMerchant={selectedExpense.merchant} expenseAmount={selectedExpense.amount} onSubmit={handleFileDispute} />
        </>
      )}

      {/* Demo interactive drawers */}
      <ExpenseDrawer
        open={demoDrawerStatus !== null}
        onOpenChange={open => { if (!open) setDemoDrawerStatus(null); }}
        title={drawerTitle}
        expenses={drawerExpenses}
        onUpdateExpense={handleUpdateDemoExpense}
        filterStatus={demoDrawerStatus ?? undefined}
      />

      {/* Analytics modal */}
      <ExpenseAnalyticsModal open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
    </motion.div>
  );
}
