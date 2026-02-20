import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plane, Building2, Utensils, Car, Ticket, MoreHorizontal,
  Receipt, Search, Download, Check, X, MessageSquare, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DemoExpense } from "./demoExpenseData";

const categoryIcons: Record<string, React.ElementType> = {
  flight: Plane,
  hotel: Building2,
  meals: Utensils,
  transportation: Car,
  conference: Ticket,
  other: MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  flight: "text-blue-500",
  hotel: "text-purple-500",
  meals: "text-orange-500",
  transportation: "text-teal-500",
  conference: "text-indigo-500",
  other: "text-muted-foreground",
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" }> = {
  pending:  { label: "Pending",  variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  disputed: { label: "Disputed", variant: "destructive" },
};

type SortKey = "date" | "amount" | "employee" | "trip";

interface ExpenseDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  expenses: DemoExpense[];
  onUpdateExpense: (id: string, status: DemoExpense["status"]) => void;
  filterStatus?: DemoExpense["status"];
}

export function ExpenseDrawer({ open, onOpenChange, title, expenses, onUpdateExpense, filterStatus }: ExpenseDrawerProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [localExpenses, setLocalExpenses] = useState<DemoExpense[]>([]);

  const workingExpenses = localExpenses.length ? localExpenses : expenses;

  const filtered = useMemo(() => {
    let list = [...workingExpenses];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.employee.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.tripName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "employee") return a.employee.localeCompare(b.employee);
      if (sort === "trip") return a.tripName.localeCompare(b.tripName);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return list;
  }, [workingExpenses, search, sort]);

  const handleApprove = (id: string) => {
    setLocalExpenses(prev => {
      const base = prev.length ? prev : expenses;
      return base.map(e => e.id === id ? { ...e, status: "approved" as const } : e);
    });
    onUpdateExpense(id, "approved");
    toast.success("Expense approved");
  };

  const handleReject = (id: string) => {
    setLocalExpenses(prev => {
      const base = prev.length ? prev : expenses;
      return base.map(e => e.id === id ? { ...e, status: "disputed" as const } : e);
    });
    onUpdateExpense(id, "disputed");
    toast.error("Expense rejected");
  };

  const handleBulkApproveSmall = () => {
    const small = workingExpenses.filter(e => e.status === "pending" && e.amount < 100);
    if (small.length === 0) { toast.info("No pending expenses under $100"); return; }
    setLocalExpenses(prev => {
      const base = prev.length ? prev : expenses;
      return base.map(e => small.find(s => s.id === e.id) ? { ...e, status: "approved" as const } : e);
    });
    small.forEach(e => onUpdateExpense(e.id, "approved"));
    toast.success(`✅ ${small.length} expense${small.length > 1 ? "s" : ""} auto-approved (under $100)`);
  };

  const handleExportCSV = () => {
    const headers = ["Employee", "Trip", "Vendor", "Amount", "Date", "Category", "Status", "Receipt"];
    const rows = filtered.map(e => [
      e.employee, e.tripName, e.vendor, e.amount.toFixed(2), e.date,
      e.category, e.status, e.hasReceipt ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Flyby_Expenses_${title.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("CSV exported");
  };

  const pendingSmallCount = workingExpenses.filter(e => e.status === "pending" && e.amount < 100).length;

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setLocalExpenses([]); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60 shrink-0">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} expenses</p>

          {/* Controls */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee, vendor, trip…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="trip">Trip</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExportCSV}>
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>

          {/* Bulk approve */}
          {filterStatus === "pending" && pendingSmallCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <Button
                size="sm"
                variant="secondary"
                className="w-full gap-2 border border-success/30 bg-success/5 text-success hover:bg-success/10 hover:text-success"
                onClick={handleBulkApproveSmall}
              >
                <CheckCheck className="w-4 h-4" />
                Approve all pending under $100 ({pendingSmallCount} items)
              </Button>
            </motion.div>
          )}
        </div>

        {/* Expense list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((expense, i) => {
              const Icon = categoryIcons[expense.category] || MoreHorizontal;
              const iconColor = categoryColors[expense.category];
              const status = statusConfig[expense.status];
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border/60 bg-card p-4 hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {expense.employeeInitials}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{expense.employee}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{expense.tripName}</span>
                        <Badge variant={status.variant} className="text-[10px] ml-auto shrink-0">{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon className={cn("w-3.5 h-3.5 shrink-0", iconColor)} />
                        <span className="font-medium text-sm">{expense.vendor}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{expense.date}</span>
                        {expense.hasReceipt ? (
                          <span className="flex items-center gap-0.5 text-success"><Receipt className="w-3 h-3" /> Receipt</span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-warning"><Receipt className="w-3 h-3" /> Missing receipt</span>
                        )}
                        {expense.notes && <span className="truncate max-w-[200px]">{expense.notes}</span>}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base">${expense.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                    {expense.status !== "approved" && (
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs gap-1 bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => handleApprove(expense.id)}
                      >
                        <Check className="w-3 h-3" /> Approve
                      </Button>
                    )}
                    {expense.status !== "disputed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs gap-1 text-destructive hover:text-destructive border-destructive/20"
                        onClick={() => handleReject(expense.id)}
                      >
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-3 text-xs gap-1 text-muted-foreground"
                      onClick={() => toast.info(`Comment thread opened for ${expense.vendor}`)}
                    >
                      <MessageSquare className="w-3 h-3" /> Comment
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No expenses found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
