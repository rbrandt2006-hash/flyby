import { useState, useEffect, useCallback } from "react";

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
  supervisorSentAt?: string;
  supervisorName?: string;
  disputeReason?: string;
  disputeDescription?: string;
  disputeFiledAt?: string;
  linkedChatId?: string;
}

const STORAGE_KEY = "flyby_expenses";

// Initial mock expenses
const initialExpenses: Expense[] = [
  {
    id: "1",
    merchant: "Delta Air Lines",
    description: "Client travel to NYC - round trip",
    date: "Dec 18, 2024",
    amount: 487.00,
    category: "flight",
    status: "approved",
    location: "Atlanta → New York",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
  },
  {
    id: "2",
    merchant: "Marriott Downtown",
    description: "Hotel stay for Q1 planning meeting",
    date: "Dec 15-17, 2024",
    amount: 524.80,
    category: "hotel",
    status: "submitted",
    location: "San Francisco, CA",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
  },
  {
    id: "3",
    merchant: "Uber",
    description: "Airport transfer to client office",
    date: "Dec 18, 2024",
    amount: 42.50,
    category: "transportation",
    status: "pending",
    location: "New York, NY",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
  },
  {
    id: "4",
    merchant: "Sweetgreen",
    description: "Client lunch meeting - 3 attendees",
    date: "Dec 19, 2024",
    amount: 67.25,
    category: "meals",
    status: "approved",
    location: "New York, NY",
    paymentMethod: "Personal Card",
    reimbursable: true,
  },
  {
    id: "5",
    merchant: "The Capital Grille",
    description: "Team dinner with visiting executives",
    date: "Dec 12, 2024",
    amount: 342.00,
    category: "meals",
    status: "flagged",
    location: "Chicago, IL",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
  },
  {
    id: "6",
    merchant: "Hilton Garden Inn",
    description: "Extended stay for project launch",
    date: "Dec 8-11, 2024",
    amount: 612.40,
    category: "hotel",
    status: "approved",
    location: "Austin, TX",
    paymentMethod: "Corporate Amex ••4521",
    reimbursable: false,
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

  return {
    expenses,
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
  };
}
