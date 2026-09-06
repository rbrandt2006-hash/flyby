// Format a date relative to today as "Feb 12, 2025". Negative offsets
// produce past dates; positive offsets produce future dates.
function relDate(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface DemoExpense {
  id: string;
  employee: string;
  employeeInitials: string;
  tripName: string;
  vendor: string;
  amount: number;
  date: string;
  category: "flight" | "hotel" | "meals" | "transportation" | "conference" | "other";
  status: "pending" | "approved" | "disputed";
  hasReceipt: boolean;
  notes?: string;
}

// Demo expense dates are generated relative to today and weighted toward
// recent activity so the Expenses demo always looks current.
// No sample expenses. Every expense in Flyby is real: created when a trip is
// booked, imported from a connected card, or added by hand. This array stays
// empty so nothing fabricated ever appears in expense totals or reports.
export const demoExpenses: DemoExpense[] = [];

export const demoStats = {
  totalPending: demoExpenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0),
  totalApproved: demoExpenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0),
  totalDisputed: demoExpenses.filter(e => e.status === "disputed").reduce((s, e) => s + e.amount, 0),
  total: demoExpenses.reduce((s, e) => s + e.amount, 0),
  pendingCount: demoExpenses.filter(e => e.status === "pending").length,
  approvedCount: demoExpenses.filter(e => e.status === "approved").length,
  disputedCount: demoExpenses.filter(e => e.status === "disputed").length,
};
