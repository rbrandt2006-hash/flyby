import { useCallback, useMemo } from "react";
import { useBackendCollection } from "./useBackendCollection";

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
// Nothing is seeded. Expenses are only ever real: filed automatically when a
// trip is booked through Flyby, imported from a connected card, or added by
// hand. An empty list means the traveler genuinely has no expenses yet.
const initialExpenses: Expense[] = [];

export function useExpenses() {
  // Expenses are stored in the backend; a new account starts from the sample
  // set so the reporting views have something to show.
  const [expenses, setExpenses] = useBackendCollection<Expense[]>({
    endpoint: "expenses",
    payloadKey: "expenses",
    cacheKey: STORAGE_KEY,
    initial: [],
    seed: () => initialExpenses,
    isEmpty: (rows) => !Array.isArray(rows) || rows.length === 0,
  });

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
