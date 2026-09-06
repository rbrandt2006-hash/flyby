/**
 * Drafting an expense report for a trip.
 *
 * Once a trip's charges are captured (automatically from a connected card, or
 * added by hand), this assembles them into a report the traveler can review and
 * send to their supervisor — totals, a category breakdown, and the line items,
 * plus anything that would get the report bounced back.
 *
 * Pure functions over expenses that already exist, so this works today and
 * keeps working unchanged once card capture is live.
 */

export interface ReportExpense {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  status: string;
  tripName?: string;
  hasReceipt?: boolean;
}

export interface ExpenseReportDraft {
  tripName: string;
  /** Line items, newest first. */
  items: ReportExpense[];
  total: number;
  /** Spend per category, largest first. */
  byCategory: { category: string; amount: number; count: number }[];
  count: number;
  /** Things that would likely get the report rejected. */
  issues: string[];
  /** A short human summary, ready to drop into the note to a supervisor. */
  summary: string;
}

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Build a report draft for one trip.
 *
 * Only expenses belonging to `tripName` are included. Already-approved items
 * are left out — a report is for what still needs sign-off.
 */
export function buildExpenseReport(
  tripName: string,
  allExpenses: ReportExpense[],
): ExpenseReportDraft {
  const items = allExpenses
    .filter((e) => (e.tripName || "Unassigned") === tripName)
    .filter((e) => e.status !== "approved")
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const total = items.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = new Map<string, { amount: number; count: number }>();
  items.forEach((e) => {
    const current = categoryTotals.get(e.category) || { amount: 0, count: 0 };
    categoryTotals.set(e.category, {
      amount: current.amount + e.amount,
      count: current.count + 1,
    });
  });
  const byCategory = Array.from(categoryTotals, ([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.amount - a.amount);

  // Surface what a reviewer would send back, before it gets sent.
  const issues: string[] = [];
  const missingReceipts = items.filter((e) => e.hasReceipt === false);
  if (missingReceipts.length > 0) {
    issues.push(
      `${missingReceipts.length} expense${missingReceipts.length > 1 ? "s" : ""} missing a receipt (${missingReceipts
        .map((e) => e.merchant)
        .slice(0, 3)
        .join(", ")}${missingReceipts.length > 3 ? "…" : ""})`,
    );
  }
  const disputed = items.filter((e) => e.status === "disputed");
  if (disputed.length > 0) {
    issues.push(`${disputed.length} disputed item${disputed.length > 1 ? "s" : ""} still open`);
  }

  const topCategory = byCategory[0];
  const summary = items.length === 0
    ? `No expenses to report for ${tripName} yet.`
    : `${items.length} expense${items.length > 1 ? "s" : ""} totaling ${money(total)} for ${tripName}` +
      (topCategory ? `, mostly ${topCategory.category} (${money(topCategory.amount)}).` : ".");

  return { tripName, items, total, byCategory, count: items.length, issues, summary };
}

/** Every trip that currently has something worth reporting. */
export function reportableTrips(allExpenses: ReportExpense[]): string[] {
  const names = new Set<string>();
  allExpenses
    .filter((e) => e.status !== "approved")
    .forEach((e) => names.add(e.tripName || "Unassigned"));
  return Array.from(names);
}

/** Plain-text report body — what actually gets sent to the supervisor. */
export function formatReportForSupervisor(draft: ExpenseReportDraft): string {
  if (draft.count === 0) return draft.summary;

  const lines: string[] = [
    `Expense report — ${draft.tripName}`,
    "",
    draft.summary,
    "",
    "Breakdown:",
    ...draft.byCategory.map((c) => `  • ${c.category}: ${money(c.amount)} (${c.count})`),
    "",
    "Items:",
    ...draft.items.map((e) => `  • ${e.date} — ${e.merchant} — ${money(e.amount)} (${e.category})`),
    "",
    `Total: ${money(draft.total)}`,
  ];

  if (draft.issues.length > 0) {
    lines.push("", "Needs attention before approval:", ...draft.issues.map((i) => `  • ${i}`));
  }
  return lines.join("\n");
}
