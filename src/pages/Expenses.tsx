import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import ConnectCardModal from "@/components/expenses/ConnectCardModal";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { SendToSupervisorModal } from "@/components/expenses/SendToSupervisorModal";
import { DisputeModal } from "@/components/expenses/DisputeModal";
import { useExpenses, type Expense } from "@/hooks/useExpenses";
import { useChats } from "@/hooks/useChats";
import { toast } from "sonner";
import { 
  Plane, Building2, Utensils, Car, CreditCard, Receipt, AlertCircle,
  Send, Flag, CheckCircle, ArrowRight, Plus, Check, Gamepad2, Briefcase
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
  const { expenses, addExpense, updateExpense, sendToSupervisor, toggleReimbursable, fileDispute, linkChatToExpense, totalPending, totalApproved } = useExpenses();
  const { getOrCreateExpenseChat, sendMessage, sendExpenseSystemMessage, postExpenseUpdate, supervisorMap, findChatByExpenseId } = useChats();
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCardConnected, setIsCardConnected] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSendSupervisorOpen, setIsSendSupervisorOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const handleAddExpense = (expenseData: Omit<Expense, "id">, submitNow: boolean) => {
    addExpense(expenseData);
    toast.success(submitNow ? "Expense submitted for approval" : "Expense added");
    setIsAddExpenseOpen(false);
  };

  const handleSendToSupervisor = (supervisorName: string, note: string) => {
    if (!selectedExpense) return;
    
    // Get supervisor info
    const supervisor = supervisorMap[supervisorName];
    const supervisorId = supervisor?.id || "1"; // Default to first supervisor if not found
    
    // Get or create chat with this supervisor for expense approval
    const chat = getOrCreateExpenseChat(supervisorId, supervisorName, selectedExpense.id);
    
    // Send system message with expense details
    const categoryLabel = selectedExpense.category.charAt(0).toUpperCase() + selectedExpense.category.slice(1);
    const systemMessage = `📝 Julia submitted an expense for approval:\n\n**${selectedExpense.merchant}** – $${selectedExpense.amount.toFixed(2)} (${categoryLabel})\n${selectedExpense.description}`;
    
    sendExpenseSystemMessage(chat.id, selectedExpense.id, "expense_submission", systemMessage);
    
    // If user added a note, send it as a follow-up message
    if (note.trim()) {
      setTimeout(() => {
        sendMessage(chat.id, note, "current", false);
      }, 300);
    }
    
    // Update expense state
    sendToSupervisor(selectedExpense.id, supervisorName);
    linkChatToExpense(selectedExpense.id, chat.id);
    
    // Simulate supervisor response
    setTimeout(() => {
      if (selectedExpense.amount > 500 || selectedExpense.status === "flagged") {
        sendMessage(chat.id, "Thanks for sending. Can you clarify the business purpose for this expense?", supervisorId, false);
      } else {
        // Post approval status update
        postExpenseUpdate(chat.id, selectedExpense.id, "approved", supervisorName);
        updateExpense(selectedExpense.id, { status: "approved" });
      }
    }, 2500);
    
    toast.success(`Expense sent to ${supervisorName} – Check Chats for updates`);
    setSelectedExpense({ ...selectedExpense, status: "submitted", supervisorSentAt: new Date().toISOString(), supervisorName });
    setIsSendSupervisorOpen(false);
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
    
    // Post dispute to existing chat if one exists
    const existingChat = findChatByExpenseId(selectedExpense.id);
    if (existingChat) {
      postExpenseUpdate(existingChat.id, selectedExpense.id, "disputed", "Julia");
    }
    
    setSelectedExpense({ ...selectedExpense, status: "disputed", disputeReason: reason, disputeDescription: description, disputeFiledAt: new Date().toISOString() });
    toast.success("Dispute submitted");
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage your business expenses</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="rounded-xl" onClick={() => setIsAddExpenseOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add expense
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved This Month</p>
                <p className="text-2xl font-bold">${totalApproved.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Expense List */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-4">Recent Expenses</h2>
        <div className="space-y-2">
          {expenses.map((expense) => {
            const CategoryIcon = categoryIcons[expense.category] || Briefcase;
            const status = statusConfig[expense.status] || statusConfig.pending;
            
            return (
              <motion.div key={expense.id} variants={itemVariants} whileHover={{ scale: 1.005, y: -1 }} transition={{ duration: 0.2 }}>
                <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20" onClick={() => setSelectedExpense(expense)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{expense.merchant}</h3>
                          <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
                          {expense.reimbursable && <Badge variant="outline" className="shrink-0 text-xs">Reimbursable</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{expense.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{expense.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Expense Detail Panel */}
      <Sheet open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedExpense && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <SheetHeader className="text-left pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    {(() => { const CategoryIcon = categoryIcons[selectedExpense.category] || Briefcase; return <CategoryIcon className="w-6 h-6 text-muted-foreground" />; })()}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedExpense.merchant}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusConfig[selectedExpense.status]?.variant || "default"}>{statusConfig[selectedExpense.status]?.label || selectedExpense.status}</Badge>
                      {selectedExpense.reimbursable && <Badge variant="outline" className="text-xs">Reimbursable</Badge>}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="text-center py-6 bg-secondary/30 rounded-2xl">
                  <p className="text-4xl font-bold">${selectedExpense.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedExpense.category.charAt(0).toUpperCase() + selectedExpense.category.slice(1)} expense</p>
                </div>

                <div className="space-y-4">
                  <div><p className="text-sm text-muted-foreground">Description</p><p className="font-medium">{selectedExpense.description}</p></div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Date</p><p className="font-medium">{selectedExpense.date}</p></div>
                    <div><p className="text-sm text-muted-foreground">Location</p><p className="font-medium">{selectedExpense.location || "—"}</p></div>
                  </div>
                  <Separator />
                  <div><p className="text-sm text-muted-foreground">Payment Method</p><div className="flex items-center gap-2 mt-1"><CreditCard className="w-4 h-4 text-muted-foreground" /><p className="font-medium">{selectedExpense.paymentMethod}</p></div></div>
                  {selectedExpense.supervisorSentAt && (
                    <div className="text-xs text-muted-foreground">Last sent to supervisor: {new Date(selectedExpense.supervisorSentAt).toLocaleString()}</div>
                  )}
                  {selectedExpense.disputeFiledAt && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">Dispute filed</p>
                      <p className="text-xs text-muted-foreground">{selectedExpense.disputeReason} • {new Date(selectedExpense.disputeFiledAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <Separator />
                <div className="space-y-3 pt-2">
                  <Button className="w-full rounded-xl" size="lg" onClick={() => setIsSendSupervisorOpen(true)}>
                    <Send className="w-4 h-4 mr-2" />Send to supervisor
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="rounded-xl" onClick={handleToggleReimbursable}>
                      <CheckCircle className="w-4 h-4 mr-2" />{selectedExpense.reimbursable ? "Unmark" : "Mark"} reimbursable
                    </Button>
                    <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={() => setIsDisputeOpen(true)}>
                      <Flag className="w-4 h-4 mr-2" />Dispute
                    </Button>
                  </div>
                </div>

                {selectedExpense.status === "flagged" && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">This expense has been flagged</p>
                        <p className="text-sm text-muted-foreground mt-1">Amount exceeds policy limits. Please provide additional documentation.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <ConnectCardModal open={isCardModalOpen} onOpenChange={setIsCardModalOpen} onSuccess={() => setIsCardConnected(true)} />
      <AddExpenseModal open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen} onSave={handleAddExpense} />
      {selectedExpense && (
        <>
          <SendToSupervisorModal open={isSendSupervisorOpen} onOpenChange={setIsSendSupervisorOpen} expenseMerchant={selectedExpense.merchant} expenseAmount={selectedExpense.amount} onSend={handleSendToSupervisor} />
          <DisputeModal open={isDisputeOpen} onOpenChange={setIsDisputeOpen} expenseMerchant={selectedExpense.merchant} expenseAmount={selectedExpense.amount} onSubmit={handleFileDispute} />
        </>
      )}
    </motion.div>
  );
}
