import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plane, Building2, Utensils, Car, Gamepad2, Briefcase, FileText, Receipt,
  Pencil, Trash2, Paperclip, Download, Eye, Sparkles, Calendar, User, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoExpense } from "./demoExpenseData";

const categoryIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Building2,
  meals: Utensils,
  transportation: Car,
  entertainment: Gamepad2,
  office: Briefcase,
  conference: FileText,
};

const categoryLabels: Record<string, string> = {
  flight: "Flight",
  hotel: "Hotel",
  meals: "Meals",
  transportation: "Transportation",
  entertainment: "Entertainment",
  office: "Office / Other",
  conference: "Conference",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  disputed: { label: "Disputed", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface ExpenseViewDrawerProps {
  expense: DemoExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: DemoExpense) => void;
  onDelete: (expense: DemoExpense) => void;
}

export function ExpenseViewDrawer({ expense, open, onOpenChange, onEdit, onDelete }: ExpenseViewDrawerProps) {
  if (!expense) return null;

  const CategoryIcon = categoryIcons[expense.category] || Receipt;
  const status = statusConfig[expense.status] || statusConfig.pending;
  const canEdit = expense.status === "pending" || expense.status === "disputed";

  const aiInsights = getAIInsights(expense);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <CategoryIcon className="w-5 h-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg leading-snug">{expense.vendor}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {categoryLabels[expense.category] || expense.category} · {expense.tripName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{expense.date}</p>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Amount + Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
              <p className="text-3xl font-bold">${expense.amount.toFixed(2)}</p>
            </div>
            <Badge variant="outline" className={cn("text-xs font-medium", status.className)}>
              {status.label}
            </Badge>
          </div>

          {/* Details grid */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <DetailRow icon={Calendar} label="Date" value={expense.date} />
              <DetailRow icon={Receipt} label="Type" value={categoryLabels[expense.category] || expense.category} />
              <DetailRow icon={Plane} label="Trip" value={expense.tripName || "Unassigned"} />
              <DetailRow icon={User} label="Submitted by" value={expense.employee} />
              {expense.notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{expense.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Receipt</p>
            {expense.hasReceipt ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">receipt_{expense.vendor.toLowerCase().replace(/\s+/g, '_')}.jpg</p>
                      <p className="text-xs text-muted-foreground">Uploaded · {expense.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <Paperclip className="w-5 h-5 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No receipt uploaded yet.</p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs">
                      <Paperclip className="w-3.5 h-3.5" />
                      Upload receipt
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expense Metadata</p>
            <Card>
              <CardContent className="p-4 space-y-2.5">
                <MetaRow icon={User} label="Submitted by" value={expense.employee} />
                <MetaRow icon={Calendar} label="Submitted" value={expense.date} />
                <MetaRow icon={Clock} label="Last edited" value={expense.date} />
                <MetaRow
                  icon={Receipt}
                  label="Approval workflow"
                  value={expense.status === "approved" ? "Approved" : expense.status === "disputed" ? "Under review" : "Pending review"}
                />
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {aiInsights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Insights</p>
              </div>
              <Card className="bg-primary/[0.03] border-primary/10">
                <CardContent className="p-4 space-y-2">
                  {aiInsights.map((insight, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                      {insight}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="px-6 py-4 shrink-0 flex gap-3">
          {canEdit && (
            <Button className="flex-1 gap-2" onClick={() => { onOpenChange(false); onEdit(expense); }}>
              <Pencil className="w-4 h-4" />
              Edit Expense
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => { onOpenChange(false); onDelete(expense); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {!canEdit && (
            <p className="text-sm text-muted-foreground text-center w-full py-1">
              This expense has been approved and cannot be modified.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof Plane; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}

function getAIInsights(expense: DemoExpense): string[] {
  const insights: string[] = [];
  if (expense.status === "disputed") {
    insights.push("⚠️ This expense is currently under dispute and requires manager review.");
  }
  if (expense.category === "flight" && expense.amount > 500) {
    insights.push("✈️ This flight exceeds the typical booking price for this route. Consider reviewing for a policy exception.");
  } else if (expense.category === "flight") {
    insights.push("✈️ This flight is within company travel policy guidelines.");
  }
  if (expense.category === "hotel" && expense.amount > 400) {
    insights.push("🏨 Hotel rate is above the average nightly rate for this destination.");
  }
  if (expense.category === "meals" && expense.amount > 200) {
    insights.push("🍽️ Meal expense is above the per-person daily limit. Ensure attendee count justifies the total.");
  }
  if (!expense.hasReceipt) {
    insights.push("📎 No receipt attached. Company policy requires receipts for expenses over $25.");
  }
  return insights.slice(0, 3);
}
