import { useState, useEffect, useCallback, useMemo } from "react";

export interface Expense {
  id: string;
  merchant: string;
  description: string;
  date: string;
  amount: number;
  category: "flight" | "hotel" | "meals" | "transportation" | "entertainment" | "office";
  status: "pending" | "submitted" | "approved" | "flagged" | "disputed";
  location: string;
  paymentMethod: string;
  reimbursable: boolean;
  tripId?: string;
  tripName?: string;
  tripDates?: string;
  supervisorSentAt?: string;
  supervisorName?: string;
  disputeReason?: string;
  disputeDescription?: string;
  disputeFiledAt?: string;
  linkedChatId?: string;
  notes?: string;
  currency?: string;
}

export interface TripExpenseGroup {
  tripId: string;
  tripName: string;
  tripDates: string;
  tripStatus: "draft" | "pending" | "confirmed" | "completed" | "cancelled";
  destination: string;
  expenses: Expense[];
  totalAmount: number;
}

const STORAGE_KEY = "flyby_expenses";

// Initial mock expenses with trip associations
const initialExpenses: Expense[] = [
  // New York Trip - Jan 14-16, 2025
  {
    id: "1",
    merchant: "Delta Air Lines",
    description: "Round trip flight to NYC",
    date: "Jan 14, 2025",
    amount: 487.00,
    category: "flight",
    status: "approved",
    location: "Atlanta → New York",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_nyc_jan",
    tripName: "New York, NY",
    tripDates: "Jan 14–16, 2025",
    currency: "USD",
  },
  {
    id: "2",
    merchant: "The Roosevelt Hotel",
    description: "2 nights hotel stay",
    date: "Jan 14-16, 2025",
    amount: 524.80,
    category: "hotel",
    status: "approved",
    location: "New York, NY",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_nyc_jan",
    tripName: "New York, NY",
    tripDates: "Jan 14–16, 2025",
    currency: "USD",
  },
  {
    id: "3",
    merchant: "Uber",
    description: "Airport transfer to hotel",
    date: "Jan 14, 2025",
    amount: 42.50,
    category: "transportation",
    status: "approved",
    location: "New York, NY",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_nyc_jan",
    tripName: "New York, NY",
    tripDates: "Jan 14–16, 2025",
    currency: "USD",
  },
  {
    id: "4",
    merchant: "Sweetgreen",
    description: "Client lunch meeting - 3 attendees",
    date: "Jan 15, 2025",
    amount: 67.25,
    category: "meals",
    status: "approved",
    location: "New York, NY",
    paymentMethod: "Personal Card",
    reimbursable: true,
    tripId: "trip_nyc_jan",
    tripName: "New York, NY",
    tripDates: "Jan 14–16, 2025",
    currency: "USD",
  },
  
  // San Francisco Trip - Jan 20-23, 2025
  {
    id: "5",
    merchant: "United Airlines",
    description: "Round trip to San Francisco",
    date: "Jan 20, 2025",
    amount: 398.00,
    category: "flight",
    status: "approved",
    location: "Atlanta → San Francisco",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_sf_jan",
    tripName: "San Francisco, CA",
    tripDates: "Jan 20–23, 2025",
    currency: "USD",
  },
  {
    id: "6",
    merchant: "Marriott Union Square",
    description: "3 nights hotel stay",
    date: "Jan 20-23, 2025",
    amount: 712.40,
    category: "hotel",
    status: "submitted",
    location: "San Francisco, CA",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_sf_jan",
    tripName: "San Francisco, CA",
    tripDates: "Jan 20–23, 2025",
    currency: "USD",
  },
  {
    id: "7",
    merchant: "Lyft",
    description: "Airport to hotel",
    date: "Jan 20, 2025",
    amount: 38.75,
    category: "transportation",
    status: "pending",
    location: "San Francisco, CA",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_sf_jan",
    tripName: "San Francisco, CA",
    tripDates: "Jan 20–23, 2025",
    currency: "USD",
  },
  {
    id: "8",
    merchant: "The Slanted Door",
    description: "Team dinner - Q1 planning",
    date: "Jan 21, 2025",
    amount: 285.00,
    category: "meals",
    status: "submitted",
    location: "San Francisco, CA",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_sf_jan",
    tripName: "San Francisco, CA",
    tripDates: "Jan 20–23, 2025",
    currency: "USD",
  },
  
  // Chicago Trip - Feb 5-7, 2025
  {
    id: "9",
    merchant: "American Airlines",
    description: "Round trip to Chicago",
    date: "Feb 5, 2025",
    amount: 312.00,
    category: "flight",
    status: "pending",
    location: "Atlanta → Chicago",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_chi_feb",
    tripName: "Chicago, IL",
    tripDates: "Feb 5–7, 2025",
    currency: "USD",
  },
  {
    id: "10",
    merchant: "The Capital Grille",
    description: "Team dinner with visiting executives",
    date: "Feb 6, 2025",
    amount: 342.00,
    category: "meals",
    status: "flagged",
    location: "Chicago, IL",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_chi_feb",
    tripName: "Chicago, IL",
    tripDates: "Feb 5–7, 2025",
    currency: "USD",
  },
  {
    id: "11",
    merchant: "Hilton Chicago",
    description: "2 nights hotel stay",
    date: "Feb 5-7, 2025",
    amount: 428.00,
    category: "hotel",
    status: "pending",
    location: "Chicago, IL",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_chi_feb",
    tripName: "Chicago, IL",
    tripDates: "Feb 5–7, 2025",
    currency: "USD",
  },
  
  // Seattle Trip - Feb 10-12, 2025
  {
    id: "12",
    merchant: "Alaska Airlines",
    description: "Round trip to Seattle",
    date: "Feb 10, 2025",
    amount: 289.00,
    category: "flight",
    status: "approved",
    location: "Atlanta → Seattle",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_sea_feb",
    tripName: "Seattle, WA",
    tripDates: "Feb 10–12, 2025",
    currency: "USD",
  },
  {
    id: "13",
    merchant: "The Edgewater Hotel",
    description: "2 nights waterfront hotel",
    date: "Feb 10-12, 2025",
    amount: 489.00,
    category: "hotel",
    status: "approved",
    location: "Seattle, WA",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
    tripId: "trip_sea_feb",
    tripName: "Seattle, WA",
    tripDates: "Feb 10–12, 2025",
    currency: "USD",
  },
  {
    id: "14",
    merchant: "Uber",
    description: "Multiple airport/office transfers",
    date: "Feb 10-12, 2025",
    amount: 86.50,
    category: "transportation",
    status: "disputed",
    location: "Seattle, WA",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: true,
    tripId: "trip_sea_feb",
    tripName: "Seattle, WA",
    tripDates: "Feb 10–12, 2025",
    currency: "USD",
    disputeReason: "Incorrect charge",
    disputeDescription: "Charged for ride that was cancelled",
    disputeFiledAt: "2025-02-13T10:30:00Z",
  },
  
  // Unassigned expenses
  {
    id: "15",
    merchant: "Office Depot",
    description: "Office supplies for remote work",
    date: "Jan 25, 2025",
    amount: 124.50,
    category: "office",
    status: "pending",
    location: "Atlanta, GA",
    paymentMethod: "Personal Card",
    reimbursable: true,
    currency: "USD",
  },
  {
    id: "16",
    merchant: "Starbucks",
    description: "Coffee meeting with potential client",
    date: "Jan 28, 2025",
    amount: 28.45,
    category: "meals",
    status: "pending",
    location: "Atlanta, GA",
    paymentMethod: "Personal Card",
    reimbursable: true,
    currency: "USD",
  },
];

function loadExpensesFromStorage(): Expense[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load expenses from localStorage:", e);
  }
  return initialExpenses;
}

function saveExpensesToStorage(expenses: Expense[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error("Failed to save expenses to localStorage:", e);
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpensesFromStorage());

  useEffect(() => {
    saveExpensesToStorage(expenses);
  }, [expenses]);

  const addExpense = useCallback((expenseData: Omit<Expense, "id">): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `expense_${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  }, []);

  const updateExpense = useCallback((expenseId: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === expenseId ? { ...expense, ...updates } : expense
      )
    );
  }, []);

  const deleteExpense = useCallback((expenseId: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
  }, []);

  const getExpenseById = useCallback((expenseId: string) => {
    return expenses.find((e) => e.id === expenseId) || null;
  }, [expenses]);

  const sendToSupervisor = useCallback((expenseId: string, supervisorName: string) => {
    const now = new Date().toISOString();
    updateExpense(expenseId, {
      status: "submitted",
      supervisorSentAt: now,
      supervisorName,
    });
    return now;
  }, [updateExpense]);

  const toggleReimbursable = useCallback((expenseId: string) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === expenseId 
          ? { ...expense, reimbursable: !expense.reimbursable } 
          : expense
      )
    );
  }, []);

  const fileDispute = useCallback((expenseId: string, reason: string, description: string) => {
    updateExpense(expenseId, {
      status: "disputed",
      disputeReason: reason,
      disputeDescription: description,
      disputeFiledAt: new Date().toISOString(),
    });
  }, [updateExpense]);

  const approveExpense = useCallback((expenseId: string) => {
    updateExpense(expenseId, { status: "approved" });
  }, [updateExpense]);

  const linkChatToExpense = useCallback((expenseId: string, chatId: string) => {
    updateExpense(expenseId, { linkedChatId: chatId });
  }, [updateExpense]);

  // Group expenses by trip
  const expensesByTrip = useMemo(() => {
    const groups: Record<string, TripExpenseGroup> = {};
    const unassigned: Expense[] = [];

    expenses.forEach((expense) => {
      if (expense.tripId && expense.tripName) {
        if (!groups[expense.tripId]) {
          groups[expense.tripId] = {
            tripId: expense.tripId,
            tripName: expense.tripName,
            tripDates: expense.tripDates || "",
            tripStatus: "confirmed", // Default status
            destination: expense.tripName,
            expenses: [],
            totalAmount: 0,
          };
        }
        groups[expense.tripId].expenses.push(expense);
        groups[expense.tripId].totalAmount += expense.amount;
      } else {
        unassigned.push(expense);
      }
    });

    // Sort expenses within each group by date (most recent first)
    Object.values(groups).forEach((group) => {
      group.expenses.sort((a, b) => {
        const dateA = new Date(a.date.replace(/–.*/, "").replace(/,/g, ""));
        const dateB = new Date(b.date.replace(/–.*/, "").replace(/,/g, ""));
        return dateB.getTime() - dateA.getTime();
      });
    });

    // Sort groups by trip date (most recent first)
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.tripDates.split("–")[0].replace(/,/g, "").trim());
      const dateB = new Date(b.tripDates.split("–")[0].replace(/,/g, "").trim());
      return dateB.getTime() - dateA.getTime();
    });

    return { groups: sortedGroups, unassigned };
  }, [expenses]);

  // Calculated totals
  const totalPending = expenses
    .filter((e) => e.status === "pending" || e.status === "submitted")
    .reduce((acc, e) => acc + e.amount, 0);

  const totalApproved = expenses
    .filter((e) => e.status === "approved")
    .reduce((acc, e) => acc + e.amount, 0);

  const totalReimbursable = expenses
    .filter((e) => e.reimbursable)
    .reduce((acc, e) => acc + e.amount, 0);

  const totalDisputed = expenses
    .filter((e) => e.status === "disputed")
    .reduce((acc, e) => acc + e.amount, 0);

  return {
    expenses,
    expensesByTrip,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    sendToSupervisor,
    toggleReimbursable,
    fileDispute,
    approveExpense,
    linkChatToExpense,
    totalPending,
    totalApproved,
    totalReimbursable,
    totalDisputed,
  };
}
