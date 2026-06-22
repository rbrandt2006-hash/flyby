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
export const demoExpenses: DemoExpense[] = [
  // PENDING — within the last ~2 weeks
  { id: "d1", employee: "Sarah Kim", employeeInitials: "SK", tripName: "SF Tech Summit", vendor: "Delta Air Lines", amount: 348.50, date: relDate(-2), category: "flight", status: "pending", hasReceipt: true, notes: "Economy main cabin — within policy" },
  { id: "d2", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "Seattle Partnership", vendor: "Marriott Seattle", amount: 229.00, date: relDate(-4), category: "hotel", status: "pending", hasReceipt: false, notes: "Receipt not yet uploaded" },
  { id: "d3", employee: "Priya Patel", employeeInitials: "PP", tripName: "NYC Q1 Planning", vendor: "Uber", amount: 47.25, date: relDate(-6), category: "transportation", status: "pending", hasReceipt: true },
  { id: "d4", employee: "Julia Chen", employeeInitials: "JC", tripName: "Chicago Client Visit", vendor: "American Airlines", amount: 268.00, date: relDate(-8), category: "flight", status: "pending", hasReceipt: true },
  { id: "d5", employee: "Alex Rivera", employeeInitials: "AR", tripName: "Boston Investor Meeting", vendor: "Nobu Restaurant", amount: 184.50, date: relDate(-10), category: "meals", status: "pending", hasReceipt: true, notes: "Client dinner — 4 attendees" },
  { id: "d6", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "SF Tech Summit", vendor: "Lyft", amount: 38.50, date: relDate(-2), category: "transportation", status: "pending", hasReceipt: true },
  { id: "d7", employee: "Sarah Kim", employeeInitials: "SK", tripName: "NYC Q1 Planning", vendor: "Gartner Summit Registration", amount: 895.00, date: relDate(-12), category: "conference", status: "pending", hasReceipt: true, notes: "Annual conference — early bird rate" },
  // APPROVED — roughly 2-8 weeks ago
  { id: "d8", employee: "Julia Chen", employeeInitials: "JC", tripName: "NYC Q1 Planning", vendor: "United Airlines", amount: 312.00, date: relDate(-16), category: "flight", status: "approved", hasReceipt: true },
  { id: "d9", employee: "Priya Patel", employeeInitials: "PP", tripName: "Seattle Partnership", vendor: "The Edgewater Hotel", amount: 264.00, date: relDate(-18), category: "hotel", status: "approved", hasReceipt: true },
  { id: "d10", employee: "Alex Rivera", employeeInitials: "AR", tripName: "Chicago Client Visit", vendor: "The Capital Grille", amount: 218.00, date: relDate(-22), category: "meals", status: "approved", hasReceipt: true, notes: "Team dinner with executives" },
  { id: "d11", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "Boston Investor Meeting", vendor: "JetBlue Airways", amount: 247.00, date: relDate(-25), category: "flight", status: "approved", hasReceipt: true },
  { id: "d12", employee: "Sarah Kim", employeeInitials: "SK", tripName: "Chicago Client Visit", vendor: "Hilton Chicago", amount: 248.00, date: relDate(-30), category: "hotel", status: "approved", hasReceipt: true },
  { id: "d13", employee: "Julia Chen", employeeInitials: "JC", tripName: "SF Tech Summit", vendor: "Salesforce Conference", amount: 549.00, date: relDate(-35), category: "conference", status: "approved", hasReceipt: true },
  { id: "d14", employee: "Priya Patel", employeeInitials: "PP", tripName: "Boston Investor Meeting", vendor: "Uber", amount: 62.40, date: relDate(-40), category: "transportation", status: "approved", hasReceipt: true },
  { id: "d15", employee: "Alex Rivera", employeeInitials: "AR", tripName: "Seattle Partnership", vendor: "Sweetgreen", amount: 42.25, date: relDate(-45), category: "meals", status: "approved", hasReceipt: true, notes: "Working lunch" },
  // DISPUTED — within the last ~2 weeks
  { id: "d16", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "Seattle Partnership", vendor: "Marriott Seattle", amount: 84.00, date: relDate(-3), category: "hotel", status: "disputed", hasReceipt: true, notes: "Disputed: minibar charges not authorized" },
  { id: "d17", employee: "Sarah Kim", employeeInitials: "SK", tripName: "NYC Q1 Planning", vendor: "Uber", amount: 64.80, date: relDate(-7), category: "transportation", status: "disputed", hasReceipt: false, notes: "Disputed: no receipt, charge seems incorrect" },
  { id: "d18", employee: "Priya Patel", employeeInitials: "PP", tripName: "Chicago Client Visit", vendor: "The Peninsula Chicago", amount: 419.00, date: relDate(-11), category: "hotel", status: "disputed", hasReceipt: true, notes: "Over policy limit — needs VP approval" },
];

export const demoStats = {
  totalPending: demoExpenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0),
  totalApproved: demoExpenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0),
  totalDisputed: demoExpenses.filter(e => e.status === "disputed").reduce((s, e) => s + e.amount, 0),
  total: demoExpenses.reduce((s, e) => s + e.amount, 0),
  pendingCount: demoExpenses.filter(e => e.status === "pending").length,
  approvedCount: demoExpenses.filter(e => e.status === "approved").length,
  disputedCount: demoExpenses.filter(e => e.status === "disputed").length,
};
