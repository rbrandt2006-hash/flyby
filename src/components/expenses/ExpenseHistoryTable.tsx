import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, Plane, Building2, Utensils, Car, Gamepad2, Briefcase, 
  Receipt, Eye, Pencil, Trash2, FileText, ExternalLink
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

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  disputed: { label: "Disputed", className: "bg-destructive/10 text-destructive border-destructive/20" },
  submitted: { label: "Submitted", className: "bg-primary/10 text-primary border-primary/20" },
  flagged: { label: "Flagged", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface ExpenseHistoryTableProps {
  expenses: DemoExpense[];
  onViewReceipt?: (expense: DemoExpense) => void;
  onEdit?: (expense: DemoExpense) => void;
  onDelete?: (expense: DemoExpense) => void;
  onTripClick?: (tripName: string) => void;
  onRowClick?: (expense: DemoExpense) => void;
}

type FilterStatus = "all" | "pending" | "approved" | "disputed";

export function ExpenseHistoryTable({ expenses, onViewReceipt, onEdit, onDelete, onTripClick, onRowClick }: ExpenseHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterTrip, setFilterTrip] = useState<string>("all");

  const uniqueTrips = useMemo(() => {
    const trips = new Set<string>();
    expenses.forEach(e => {
      if (e.tripName) trips.add(e.tripName);
    });
    return Array.from(trips);
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      if (filterTrip !== "all" && e.tripName !== filterTrip) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.vendor.toLowerCase().includes(q) ||
          (e.notes || "").toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.tripName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, filterStatus, filterTrip, search]);

  const statusFilters: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "disputed", label: "Disputed" },
  ];

  if (expenses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-medium mb-1">No expenses submitted yet</h3>
          <p className="text-sm text-muted-foreground">
            Submit your first expense to begin tracking travel spending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterStatus === f.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Trip filter */}
        {uniqueTrips.length > 0 && (
          <Select value={filterTrip} onValueChange={setFilterTrip}>
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue placeholder="All trips" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="all">All trips</SelectItem>
              {uniqueTrips.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs w-24">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Trip</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Receipt</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No expenses match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((expense) => {
                  const CategoryIcon = categoryIcons[expense.category] || Receipt;
                  const status = statusConfig[expense.status] || statusConfig.pending;
                  const isPending = expense.status === "pending";
                  return (
                    <TableRow key={expense.id} className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onRowClick?.(expense)}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {expense.date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{expense.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{expense.vendor}</p>
                          {expense.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.notes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.tripName ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onTripClick?.(expense.tripName || ""); }}
                            className="text-sm text-primary hover:underline"
                          >
                            {expense.tripName}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-right whitespace-nowrap">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-medium", status.className)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expense.hasReceipt ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary gap-1 h-7"
                            onClick={(e) => { e.stopPropagation(); onViewReceipt?.(expense); }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); onEdit?.(expense); }}
                            >
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); onDelete?.(expense); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {expenses.length} expenses
      </p>
    </div>
  );
}
