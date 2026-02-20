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

export const demoExpenses: DemoExpense[] = [
  // PENDING
  { id: "d1", employee: "Sarah Kim", employeeInitials: "SK", tripName: "SF Tech Summit", vendor: "Delta Air Lines", amount: 624.50, date: "Feb 12, 2025", category: "flight", status: "pending", hasReceipt: true, notes: "Business class upgrade approved by manager" },
  { id: "d2", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "Seattle Partnership", vendor: "Marriott Seattle", amount: 389.00, date: "Feb 10, 2025", category: "hotel", status: "pending", hasReceipt: false, notes: "Receipt not yet uploaded" },
  { id: "d3", employee: "Priya Patel", employeeInitials: "PP", tripName: "NYC Q1 Planning", vendor: "Uber", amount: 47.25, date: "Feb 8, 2025", category: "transportation", status: "pending", hasReceipt: true },
  { id: "d4", employee: "Julia Chen", employeeInitials: "JC", tripName: "Chicago Client Visit", vendor: "American Airlines", amount: 312.00, date: "Feb 5, 2025", category: "flight", status: "pending", hasReceipt: true },
  { id: "d5", employee: "Alex Rivera", employeeInitials: "AR", tripName: "Boston Investor Meeting", vendor: "Nobu Restaurant", amount: 284.75, date: "Feb 3, 2025", category: "meals", status: "pending", hasReceipt: true, notes: "Client dinner — 4 attendees" },
  { id: "d6", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "SF Tech Summit", vendor: "Lyft", amount: 38.50, date: "Feb 12, 2025", category: "transportation", status: "pending", hasReceipt: true },
  { id: "d7", employee: "Sarah Kim", employeeInitials: "SK", tripName: "NYC Q1 Planning", vendor: "Gartner Summit Registration", amount: 1299.00, date: "Feb 1, 2025", category: "conference", status: "pending", hasReceipt: true, notes: "Annual conference registration" },
  // APPROVED
  { id: "d8", employee: "Julia Chen", employeeInitials: "JC", tripName: "NYC Q1 Planning", vendor: "United Airlines", amount: 498.00, date: "Jan 28, 2025", category: "flight", status: "approved", hasReceipt: true },
  { id: "d9", employee: "Priya Patel", employeeInitials: "PP", tripName: "Seattle Partnership", vendor: "The Edgewater Hotel", amount: 521.60, date: "Jan 25, 2025", category: "hotel", status: "approved", hasReceipt: true },
  { id: "d10", employee: "Alex Rivera", employeeInitials: "AR", tripName: "Chicago Client Visit", vendor: "The Capital Grille", amount: 342.00, date: "Jan 22, 2025", category: "meals", status: "approved", hasReceipt: true, notes: "Team dinner with executives" },
  { id: "d11", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "Boston Investor Meeting", vendor: "JetBlue Airways", amount: 287.00, date: "Jan 20, 2025", category: "flight", status: "approved", hasReceipt: true },
  { id: "d12", employee: "Sarah Kim", employeeInitials: "SK", tripName: "Chicago Client Visit", vendor: "Hilton Chicago", amount: 448.00, date: "Jan 18, 2025", category: "hotel", status: "approved", hasReceipt: true },
  { id: "d13", employee: "Julia Chen", employeeInitials: "JC", tripName: "SF Tech Summit", vendor: "Salesforce Conference", amount: 799.00, date: "Jan 15, 2025", category: "conference", status: "approved", hasReceipt: true },
  { id: "d14", employee: "Priya Patel", employeeInitials: "PP", tripName: "Boston Investor Meeting", vendor: "Uber", amount: 62.40, date: "Jan 14, 2025", category: "transportation", status: "approved", hasReceipt: true },
  { id: "d15", employee: "Alex Rivera", employeeInitials: "AR", tripName: "Seattle Partnership", vendor: "Sweetgreen", amount: 78.25, date: "Jan 12, 2025", category: "meals", status: "approved", hasReceipt: true, notes: "Working lunch" },
  // DISPUTED
  { id: "d16", employee: "Marcus Johnson", employeeInitials: "MJ", tripName: "Seattle Partnership", vendor: "Marriott Seattle", amount: 189.00, date: "Feb 11, 2025", category: "hotel", status: "disputed", hasReceipt: true, notes: "Disputed: minibar charges not authorized" },
  { id: "d17", employee: "Sarah Kim", employeeInitials: "SK", tripName: "NYC Q1 Planning", vendor: "Uber", amount: 124.80, date: "Feb 7, 2025", category: "transportation", status: "disputed", hasReceipt: false, notes: "Disputed: no receipt, charge seems incorrect" },
  { id: "d18", employee: "Priya Patel", employeeInitials: "PP", tripName: "Chicago Client Visit", vendor: "The Peninsula Chicago", amount: 685.00, date: "Feb 4, 2025", category: "hotel", status: "disputed", hasReceipt: true, notes: "Over policy limit — needs VP approval" },
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
