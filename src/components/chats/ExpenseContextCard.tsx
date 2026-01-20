import { format } from "date-fns";
import { Receipt, ExternalLink, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ExpenseContextCardProps {
  expenseId: string;
  merchant: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status?: string;
  submittedAt?: string;
  submitterName?: string;
}

const statusVariants: Record<string, "default" | "success" | "warning" | "info" | "destructive"> = {
  approved: "success",
  submitted: "info",
  pending: "warning",
  flagged: "destructive",
  disputed: "destructive",
};

export function ExpenseContextCard({
  expenseId,
  merchant,
  amount,
  category,
  description,
  date,
  status = "submitted",
  submittedAt,
  submitterName = "Julia",
}: ExpenseContextCardProps) {
  const navigate = useNavigate();

  const handleViewExpense = () => {
    navigate("/expenses", { state: { openExpenseId: expenseId } });
  };

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const formattedDate = submittedAt ? format(new Date(submittedAt), "MMM d, yyyy 'at' h:mm a") : date;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-transparent pb-4"
    >
      <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border/40 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Expense Approval Request
            </span>
          </div>
          <Badge variant={statusVariants[status] || "info"} className="text-[10px]">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-medium text-foreground">{submitterName}</span> submitted an expense for approval
              </p>
              <h3 className="font-semibold text-lg text-foreground truncate">
                {merchant}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="bg-muted/50 px-2 py-0.5 rounded-md">{categoryLabel}</span>
                <span>{formattedDate}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-2xl font-bold text-foreground">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                {amount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/5"
              onClick={handleViewExpense}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View expense details
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
