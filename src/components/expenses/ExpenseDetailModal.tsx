import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plane, Building2, Utensils, Car, Gamepad2, Briefcase,
  CreditCard, Send, CheckCircle, Flag, AlertCircle, Undo2
} from "lucide-react";
import type { Expense } from "@/hooks/useExpenses";

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

interface ExpenseDetailModalProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToSupervisor: () => void;
  onToggleReimbursable: () => void;
  onDispute: () => void;
  onUndoSubmission?: () => void;
}

export function ExpenseDetailModal({
  expense,
  open,
  onOpenChange,
  onSendToSupervisor,
  onToggleReimbursable,
  onDispute,
  onUndoSubmission,
}: ExpenseDetailModalProps) {
  if (!expense) return null;
  
  const CategoryIcon = categoryIcons[expense.category] || Briefcase;
  const status = statusConfig[expense.status] || statusConfig.pending;
  const canUndoSubmission = expense.status === "submitted" && expense.supervisorSentAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <CategoryIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl">{expense.merchant}</DialogTitle>
              <DialogDescription>
                Full details for this expense, including trip, category, and receipt.
              </DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
                {expense.reimbursable && <Badge variant="outline" className="text-xs">Reimbursable</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center py-6 bg-secondary/30 rounded-2xl">
            <p className="text-4xl font-bold">${expense.amount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} expense
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{expense.description}</p>
            </div>
            {expense.tripName && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Trip</p>
                  <p className="font-medium">{expense.tripName}</p>
                  <p className="text-xs text-muted-foreground">{expense.tripDates}</p>
                </div>
              </>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{expense.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{expense.location || "—"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <div className="flex items-center gap-2 mt-1">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">{expense.paymentMethod}</p>
              </div>
            </div>
            {expense.supervisorSentAt && (
              <div className="text-xs text-muted-foreground">
                Sent to {expense.supervisorName || "supervisor"}: {new Date(expense.supervisorSentAt).toLocaleString()}
              </div>
            )}
            {expense.disputeFiledAt && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Dispute filed</p>
                <p className="text-xs text-muted-foreground">
                  {expense.disputeReason} • {new Date(expense.disputeFiledAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <Separator />
          <div className="space-y-3 pt-2">
            {canUndoSubmission && onUndoSubmission ? (
              <Button variant="outline" className="w-full rounded-xl text-warning hover:text-warning" onClick={onUndoSubmission}>
                <Undo2 className="w-4 h-4 mr-2" />Unsend from supervisor
              </Button>
            ) : (
              <Button className="w-full rounded-xl" size="lg" onClick={onSendToSupervisor}>
                <Send className="w-4 h-4 mr-2" />Send to supervisor
              </Button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-xl" onClick={onToggleReimbursable}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {expense.reimbursable ? "Unmark" : "Mark"} reimbursable
              </Button>
              <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={onDispute}>
                <Flag className="w-4 h-4 mr-2" />Dispute
              </Button>
            </div>
          </div>

          {expense.status === "flagged" && (
            <div className="p-4 rounded-lg border-destructive/30 bg-destructive/5 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">This expense has been flagged</p>
                <p className="text-sm text-muted-foreground mt-1">Amount exceeds policy limits.</p>
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
