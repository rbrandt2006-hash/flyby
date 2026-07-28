import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, MessageSquare, Receipt, DollarSign,
  Sparkles, FileText, ImageIcon, ChevronLeft,
} from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";
import { toast } from "sonner";
import { useExpenses, type Expense } from "@/hooks/useExpenses";
import { useUserProfileContext } from "@/contexts/UserProfileContext";

export interface ExpenseApproval {
  id: string;
  employeeName: string;
  employeeAvatar: string;
  tripName: string;
  expenseType: string;
  merchant: string;
  amount: number;
  dateSubmitted: string;
  status: "pending" | "approved" | "rejected";
  description: string;
  receiptUrl?: string;
  category: string;
  aiInsight?: string;
}

const mockApprovals: ExpenseApproval[] = [
  {
    id: "appr-1",
    employeeName: "Marcus Johnson",
    employeeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    tripName: "SF Tech Summit",
    expenseType: "Hotel",
    merchant: "Marriott Marquis",
    amount: 348.20,
    dateSubmitted: "Mar 2",
    status: "pending",
    description: "2 nights at Marriott Marquis near Moscone Center for the annual tech summit.",
    receiptUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop",
    category: "hotel",
    aiInsight: "This hotel booking exceeds the company policy limit by $48. Average hotel rate for SF is $300/night.",
  },
  {
    id: "appr-2",
    employeeName: "Emily Watson",
    employeeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    tripName: "NYC Client Meeting",
    expenseType: "Uber",
    merchant: "Uber",
    amount: 48.20,
    dateSubmitted: "Mar 3",
    status: "pending",
    description: "Airport transfer from JFK to client office in Midtown Manhattan.",
    category: "transportation",
    aiInsight: "This expense appears consistent with typical travel spending for NYC airport transfers.",
  },
  {
    id: "appr-3",
    employeeName: "Sarah Chen",
    employeeAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    tripName: "Chicago Sales Trip",
    expenseType: "Dinner",
    merchant: "The Capital Grille",
    amount: 72.40,
    dateSubmitted: "Mar 1",
    status: "pending",
    description: "Client dinner with 2 attendees from Acme Corp to discuss Q2 partnership.",
    receiptUrl: "https://images.unsplash.com/photo-1572441710109-0dccae40fed6?w=800&h=600&fit=crop",
    category: "meals",
  },
  {
    id: "appr-4",
    employeeName: "David Kim",
    employeeAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    tripName: "Austin Workshop",
    expenseType: "Flight",
    merchant: "Southwest Airlines",
    amount: 290.00,
    dateSubmitted: "Mar 4",
    status: "pending",
    description: "Round trip SFO to AUS for the engineering team workshop.",
    category: "flight",
    aiInsight: "Flight price is within policy. Average for this route is $275-$320.",
  },
  {
    id: "appr-5",
    employeeName: "Lisa Park",
    employeeAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    tripName: "Seattle Review",
    expenseType: "Hotel",
    merchant: "The Edgewater Hotel",
    amount: 489.00,
    dateSubmitted: "Mar 3",
    status: "pending",
    description: "2 nights waterfront hotel for quarterly business review.",
    receiptUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    category: "hotel",
    aiInsight: "This hotel exceeds the standard rate by $89. Consider requesting justification.",
  },
  {
    id: "appr-6",
    employeeName: "Tom Bradley",
    employeeAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
    tripName: "Denver Conference",
    expenseType: "Meals",
    merchant: "Guard and Grace",
    amount: 156.80,
    dateSubmitted: "Feb 28",
    status: "pending",
    description: "Team dinner with 4 attendees during the annual leadership conference.",
    category: "meals",
  },
  {
    id: "appr-7",
    employeeName: "Alex Turner",
    employeeAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    tripName: "Boston Pitch",
    expenseType: "Transportation",
    merchant: "Lyft",
    amount: 34.50,
    dateSubmitted: "Mar 5",
    status: "pending",
    description: "Airport to hotel transfer at Logan Airport.",
    category: "transportation",
    aiInsight: "This expense appears consistent with typical travel spending.",
  },
];

const categoryIcons: Record<string, string> = {
  hotel: "🏨",
  flight: "✈️",
  meals: "🍽️",
  transportation: "🚗",
  office: "📦",
  entertainment: "🎭",
};

// ─── Sidebar Card ──────────────────────────────────
function ApprovalCard({
  approval,
  isSelected,
  onSelect,
}: {
  approval: ExpenseApproval;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left px-3 py-3 rounded-xl transition-all duration-150",
        isSelected ? "bg-primary/10 shadow-sm" : "hover:bg-muted/60",
      )}
    >
      <div className="flex items-start gap-3">
        <img
          src={approval.employeeAvatar}
          alt={approval.employeeName}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("text-sm truncate", isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
              {approval.employeeName}
            </span>
            <span className="text-[10px] text-muted-foreground/50 shrink-0">
              {approval.dateSubmitted}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {categoryIcons[approval.category] || "📝"} {approval.expenseType} — ${approval.amount.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
            {approval.tripName}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Detail Panel ──────────────────────────────────
function ApprovalDetail({
  approval,
  onApprove,
  onReject,
  onRequestInfo,
}: {
  approval: ExpenseApproval;
  onApprove: () => void;
  onReject: () => void;
  onRequestInfo: () => void;
}) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Receipt className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Expense Approval</h2>
          <Badge variant={approval.status === "approved" ? "default" : approval.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] ml-auto">
            {approval.status === "pending" ? "Pending Review" : approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
          {/* Employee Info */}
          <div className="flex items-center gap-3">
            <img
              src={approval.employeeAvatar}
              alt={approval.employeeName}
              className="w-11 h-11 rounded-full object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{approval.employeeName}</p>
              <p className="text-xs text-muted-foreground">Submitted {approval.dateSubmitted}</p>
            </div>
          </div>

          {/* Expense Details Table */}
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
            <div className="bg-primary/5 border-b border-border/40 px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">Expense Details</span>
            </div>
            <div className="divide-y divide-border/30">
              {[
                ["Employee", approval.employeeName],
                ["Trip", approval.tripName],
                ["Expense Type", approval.expenseType],
                ["Merchant", approval.merchant],
                ["Amount", `$${approval.amount.toFixed(2)}`],
                ["Date Submitted", approval.dateSubmitted],
                ["Category", approval.category.charAt(0).toUpperCase() + approval.category.slice(1)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{approval.description}</p>
          </div>

          {/* Receipt Preview */}
          {approval.receiptUrl && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Receipt</p>
              <button
                onClick={() => setLightboxImage(approval.receiptUrl!)}
                className="group relative rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-colors"
              >
                <img
                  src={approval.receiptUrl}
                  alt="Receipt"
                  className="w-full max-w-sm h-48 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-lg">
                    View Receipt
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* AI Insight */}
          {approval.aiInsight && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">AI Insight</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {approval.aiInsight}
              </p>
            </motion.div>
          )}

          {/* Approval Status Feedback */}
          <AnimatePresence>
            {approval.status === "approved" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-medium text-success">Expense Approved</p>
                  <p className="text-xs text-success/70 mt-0.5">The employee has been notified and this expense will be processed for reimbursement.</p>
                </div>
              </motion.div>
            )}
            {approval.status === "rejected" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Expense Rejected</p>
                  <p className="text-xs text-destructive/70 mt-0.5">The employee has been notified with the reason for rejection.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reject Reason Input */}
          <AnimatePresence>
            {showRejectInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Reason for rejection</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejecting this expense..."
                  className="w-full px-3 py-2 text-sm bg-muted/40 border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive/30"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onReject();
                      setShowRejectInput(false);
                    }}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      {approval.status === "pending" && !showRejectInput && (
        <div className="shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button onClick={onApprove} className="flex-1 gap-2" variant="default">
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
            <Button onClick={() => setShowRejectInput(true)} variant="destructive" className="flex-1 gap-2">
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button onClick={onRequestInfo} variant="outline" className="flex-1 gap-2">
              <MessageSquare className="w-4 h-4" />
              Request Info
            </Button>
          </div>
        </div>
      )}

      <ImageLightbox src={lightboxImage} alt="Receipt" onClose={() => setLightboxImage(null)} />
    </div>
  );
}

// Map a real expense (one sent to a supervisor) into the approval-queue shape.
const EXPENSE_TYPE_LABEL: Record<string, string> = {
  hotel: "Hotel", flight: "Flight", meals: "Meals",
  transportation: "Transportation", entertainment: "Entertainment", office: "Office",
};

function mapExpenseToApproval(e: Expense, employeeName: string, employeeAvatar: string): ExpenseApproval {
  // The queue's three states collapse the expense's richer status set.
  const status: ExpenseApproval["status"] =
    e.status === "approved" ? "approved"
    : e.status === "flagged" || e.status === "disputed" ? "rejected"
    : "pending";

  const when = e.supervisorSentAt || e.date;
  const dateSubmitted = when
    ? new Date(when).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return {
    id: e.id,
    employeeName,
    employeeAvatar,
    tripName: e.tripName || "General expenses",
    expenseType: EXPENSE_TYPE_LABEL[e.category] || e.category,
    merchant: e.merchant,
    amount: e.amount,
    dateSubmitted,
    status,
    description: e.description || e.notes || "",
    // Real expenses don't carry a receipt image in this build, so the detail
    // panel simply omits the receipt preview.
    category: e.category,
  };
}

// ─── Main Export ──────────────────────────────────
interface ExpenseApprovalQueueProps {
  onApprovalCountChange?: (count: number) => void;
}

const DEFAULT_AVATAR =
  "https://api.dicebear.com/7.x/initials/svg?seed=You&backgroundColor=a3c5e0";

export function ExpenseApprovalQueue({ onApprovalCountChange }: ExpenseApprovalQueueProps) {
  const { expenses, updateExpense } = useExpenses();
  const { profile } = useUserProfileContext();

  // Real approvals = expenses that were actually sent to a supervisor. They
  // persist and sync, so approving here is a genuine state change. Until the
  // user submits one, the queue shows the demo roster so it isn't empty.
  const realApprovals = useMemo<ExpenseApproval[]>(() => {
    const name = profile?.full_name || "You";
    const avatar = profile?.avatar_url || DEFAULT_AVATAR;
    return expenses
      .filter((e) => Boolean(e.supervisorSentAt) || e.status === "submitted")
      .map((e) => mapExpenseToApproval(e, name, avatar));
  }, [expenses, profile]);

  const usingReal = realApprovals.length > 0;

  // Internal state only backs the demo fallback; real approvals live in the
  // expenses store and are updated through it.
  const [mockState, setMockState] = useState<ExpenseApproval[]>(mockApprovals);
  const approvals = usingReal ? realApprovals : mockState;

  const [selectedId, setSelectedId] = useState<string>("");
  const effectiveSelectedId = approvals.find((a) => a.id === selectedId)?.id || approvals[0]?.id || "";

  const pendingCount = approvals.filter(a => a.status === "pending").length;
  const selectedApproval = approvals.find(a => a.id === effectiveSelectedId);

  // Keep the parent's badge count in step with the real pending total.
  useEffect(() => {
    onApprovalCountChange?.(pendingCount);
  }, [pendingCount, onApprovalCountChange]);

  const handleApprove = (id: string) => {
    if (usingReal) {
      updateExpense(id, { status: "approved" });
    } else {
      setMockState(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a));
    }
    toast.success("Expense approved", { description: "The expense will be processed for reimbursement." });
  };

  const handleReject = (id: string) => {
    if (usingReal) {
      // "flagged" is the expense store's rejected-by-approver state.
      updateExpense(id, { status: "flagged" });
    } else {
      setMockState(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a));
    }
    toast.error("Expense rejected", { description: "The submitter has been notified with the reason." });
  };

  const handleRequestInfo = (_id: string) => {
    toast.info("Information requested", { description: "A message has been sent to the submitter." });
  };

  return (
    <div className="h-full flex gap-3">
      {/* Left: Approval Queue Sidebar */}
      <div className="w-72 shrink-0 bg-secondary/30 rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Expense Approvals</span>
            </div>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                {pendingCount}
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {approvals.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                isSelected={approval.id === effectiveSelectedId}
                onSelect={() => setSelectedId(approval.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Detail Panel */}
      <div className="flex-1 bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {selectedApproval ? (
          <ApprovalDetail
            key={selectedApproval.id + selectedApproval.status}
            approval={selectedApproval}
            onApprove={() => handleApprove(selectedApproval.id)}
            onReject={() => handleReject(selectedApproval.id)}
            onRequestInfo={() => handleRequestInfo(selectedApproval.id)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Receipt className="w-8 h-8 opacity-30 mb-3" />
            <p className="text-sm">Select an expense to review</p>
          </div>
        )}
      </div>
    </div>
  );
}

export { mockApprovals };
