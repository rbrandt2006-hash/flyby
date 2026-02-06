import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  ExternalLink,
  Plane, 
  Building2, 
  Utensils, 
  Car, 
  Gamepad2, 
  Briefcase,
  MapPin,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, TripExpenseGroup } from "@/hooks/useExpenses";

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

const tripStatusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Approved", variant: "success" },
  completed: { label: "Completed", variant: "info" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface ExpenseTripGroupProps {
  group: TripExpenseGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onExpenseClick: (expense: Expense) => void;
  filteredExpenses?: Expense[];
}

export function ExpenseTripGroup({
  group,
  isExpanded,
  onToggle,
  onExpenseClick,
  filteredExpenses,
}: ExpenseTripGroupProps) {
  const navigate = useNavigate();
  const displayExpenses = filteredExpenses || group.expenses;
  
  const displayTotal = useMemo(() => {
    return displayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [displayExpenses]);

  const handleExportCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const headers = ["Date", "Merchant", "Category", "Amount", "Currency", "Status", "Reimbursable", "Notes", "Trip"];
    const rows = displayExpenses.map((expense) => [
      expense.date,
      expense.merchant,
      expense.category,
      expense.amount.toFixed(2),
      expense.currency || "USD",
      expense.status,
      expense.reimbursable ? "Yes" : "No",
      expense.notes || expense.description,
      group.tripName,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filename = `Flyby_Expenses_${group.tripName.replace(/[^a-zA-Z0-9]/g, "_")}_${group.tripDates.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleViewTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to trip detail - using tripId or a mock route
    navigate(`/trips/${group.tripId}`);
  };

  const tripStatus = tripStatusConfig[group.tripStatus] || tripStatusConfig.confirmed;

  if (displayExpenses.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="w-full cursor-pointer hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Expand/Collapse Icon */}
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>

                {/* Trip Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">{group.tripName}</h3>
                    </div>
                    <Badge variant={tripStatus.variant} className="text-xs">
                      {tripStatus.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{group.tripDates}</span>
                    <span className="mx-1">•</span>
                    <span>{displayExpenses.length} expense{displayExpenses.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Total & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-bold">${displayTotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={handleExportCSV}
                      title="Export to CSV"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={handleViewTrip}
                      title="View trip"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border-t border-border/60 bg-muted/20">
                  <div className="p-2 space-y-1">
                    {displayExpenses.map((expense) => {
                      const CategoryIcon = categoryIcons[expense.category] || Briefcase;
                      const status = statusConfig[expense.status] || statusConfig.pending;

                      return (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                          className="rounded-lg cursor-pointer transition-colors"
                          onClick={() => onExpenseClick(expense)}
                        >
                          <div className="p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{expense.merchant}</span>
                                <Badge variant={status.variant} className="text-[10px] shrink-0">
                                  {status.label}
                                </Badge>
                                {expense.reimbursable && (
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    Reimbursable
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{expense.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-sm">${expense.amount.toFixed(2)}</p>
                              <p className="text-[10px] text-muted-foreground">{expense.date}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Unassigned expenses group component
interface UnassignedExpenseGroupProps {
  expenses: Expense[];
  isExpanded: boolean;
  onToggle: () => void;
  onExpenseClick: (expense: Expense) => void;
}

export function UnassignedExpenseGroup({
  expenses,
  isExpanded,
  onToggle,
  onExpenseClick,
}: UnassignedExpenseGroupProps) {
  const total = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  if (expenses.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="overflow-hidden border-dashed">
        <CollapsibleTrigger asChild>
          <div className="w-full cursor-pointer hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-muted-foreground">Unassigned Expenses</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {expenses.length} expense{expenses.length !== 1 ? "s" : ""} not linked to a trip
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-muted-foreground">${total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border-t border-border/60 bg-muted/20">
                  <div className="p-2 space-y-1">
                    {expenses.map((expense) => {
                      const CategoryIcon = categoryIcons[expense.category] || Briefcase;
                      const status = statusConfig[expense.status] || statusConfig.pending;

                      return (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                          className="rounded-lg cursor-pointer transition-colors"
                          onClick={() => onExpenseClick(expense)}
                        >
                          <div className="p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{expense.merchant}</span>
                                <Badge variant={status.variant} className="text-[10px] shrink-0">
                                  {status.label}
                                </Badge>
                                {expense.reimbursable && (
                                  <Badge variant="outline" className="text-[10px] shrink-0">
                                    Reimbursable
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{expense.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-sm">${expense.amount.toFixed(2)}</p>
                              <p className="text-[10px] text-muted-foreground">{expense.date}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
