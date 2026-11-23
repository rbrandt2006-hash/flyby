/**
 * Company portals: the company a traveler belongs to, and how they get into one.
 *
 * Someone asks for a portal for their company; Flyby verifies it; it then has
 * a join code, and the person who asked is its first admin. Travelers join
 * with the code. A company's admins see their members' trips and expenses.
 *
 * "Admin" here is a role inside one company. It is not Flyby's own platform
 * admin, which runs the back office and can see every company.
 *
 * Every call goes to `/api/company` on the backend, which decides everything —
 * who is in which company, and who may see what.
 */

import { authedFetch, backend } from "@/integrations/backend/client";

export type CompanyRole = "admin" | "member";

export interface Portal {
  id: string;
  name: string;
  domain: string | null;
  status: "active";
  memberCount: number;
  verifiedAt: string | null;
  /** Only given to the company's admins. */
  joinCode?: string;
}

export interface PortalRequest {
  id: string;
  name: string;
  domain: string | null;
  status: "pending" | "rejected";
  requestedAt: string | null;
  /** Why Flyby couldn't verify it, when it was rejected. */
  reviewNote: string | null;
  website?: string | null;
  teamSize?: string | null;
}

export interface CompanyState {
  portal: Portal | null;
  role: CompanyRole | null;
  request: PortalRequest | null;
}

export interface MemberTrip {
  id: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  purpose?: string;
  estimatedCost?: number;
  flight: { airline?: string; flightNumber?: string; bookingReference?: string; bookedVia?: string; price?: number } | null;
  hotel: { name?: string; reserved?: boolean } | null;
}

export interface MemberExpense {
  id: string;
  merchant?: string;
  description?: string;
  amount: number;
  currency?: string;
  category?: string;
  status?: string;
  date?: string;
  tripId?: string | null;
  tripName?: string | null;
  reimbursable?: boolean;
  paymentMethod?: string;
}

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  role: CompanyRole;
  joinedAt: string | null;
  isSelf: boolean;
  tripCount: number;
  upcomingTrip: MemberTrip | null;
  travelingNow: boolean;
  spend: number;
  pendingExpenses: number;
  expenseCount: number;
}

/** A failed call, in words fit to show the traveler. */
export class CompanyError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await authedFetch(`/api/company${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new CompanyError("Couldn't reach Flyby. Check your connection and try again.", "network");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CompanyError(body?.error || "Something went wrong. Please try again.", body?.code || String(response.status));
  }
  return body as T;
}

export async function getCompany(): Promise<CompanyState | null> {
  if (!backend.getCurrentSession()) return null;
  try {
    return await call<CompanyState>("");
  } catch {
    // An older backend without portals, or offline: no company to show.
    return null;
  }
}

export const joinCompany = (code: string) =>
  call<{ portal: Portal; role: CompanyRole }>("/join", { method: "POST", body: JSON.stringify({ code }) });

export const leaveCompany = () => call<{ portal: null }>("/leave", { method: "POST", body: "{}" });

export interface PortalRequestInput {
  name: string;
  website: string;
  jobTitle?: string;
  teamSize?: string;
  note?: string;
}

export const requestPortal = (input: PortalRequestInput) =>
  call<{ request: PortalRequest }>("/request", { method: "POST", body: JSON.stringify(input) });

export const withdrawRequest = () => call<{ request: null }>("/request", { method: "DELETE" });

export const listMembers = () => call<{ portal: Portal; members: CompanyMember[] }>("/members");

export const getMember = (id: string) =>
  call<{ member: Pick<CompanyMember, "id" | "name" | "email" | "jobTitle" | "role">; trips: MemberTrip[]; expenses: MemberExpense[] }>(
    `/members/${encodeURIComponent(id)}`,
  );

export const setMemberRole = (id: string, role: CompanyRole) =>
  call<{ id: string; role: CompanyRole }>(`/members/${encodeURIComponent(id)}/role`, { method: "POST", body: JSON.stringify({ role }) });

export const removeMember = (id: string) =>
  call<{ removed: string }>(`/members/${encodeURIComponent(id)}`, { method: "DELETE" });

export const rotateJoinCode = () => call<{ portal: Portal }>("/code", { method: "POST", body: "{}" });

// ---------------------------------------------------------------------------
// Expense approval
// ---------------------------------------------------------------------------
// A member sends an expense to one of their company's admins; any admin of the
// company can approve it or send it back with a note. The request is kept on
// the expense by the backend, which alone can change it.

/** An admin of the caller's company, who expenses can be sent to. */
export interface Approver {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
}

export interface ApproversResult {
  /** Null when the caller isn't in a company portal. */
  portal: { id: string; name: string } | null;
  role: CompanyRole | null;
  /** The company's admins, not including the caller. */
  approvers: Approver[];
}

/** The approval request on an expense, as the backend records it. */
export interface ExpenseApproval {
  approverId: string;
  approverName: string;
  companyId: string;
  sentAt: string;
  note: string | null;
  includeReceipt?: boolean;
  decision: "approved" | "returned" | null;
  decidedAt: string | null;
  decidedById: string | null;
  decidedByName: string | null;
  decisionNote: string | null;
}

/** An expense as the backend returns it after a send or unsend. */
export interface SentExpense {
  id: string;
  status: string;
  supervisorSentAt?: string;
  supervisorName?: string;
  supervisorId?: string;
  approval?: ExpenseApproval;
}

/** One request in a company admin's approvals queue. */
export interface ApprovalItem {
  /** The backend's id for the expense, used to decide on it. */
  id: string;
  expense: MemberExpense;
  member: { id: string; name: string; email: string | null } | null;
  approverId: string;
  approverName: string;
  sentToYou: boolean;
  sentAt: string | null;
  note: string | null;
  includeReceipt: boolean;
  decision: "approved" | "returned" | null;
  decidedAt: string | null;
  decidedByName: string | null;
  decisionNote: string | null;
}

export const listApprovers = () => call<ApproversResult>("/approvers");

export const sendExpenseForApproval = (expenseId: string, approverId: string, note: string, includeReceipt: boolean) =>
  call<{ expense: SentExpense }>(`/expenses/${encodeURIComponent(expenseId)}/send`, {
    method: "POST",
    body: JSON.stringify({ approverId, note, includeReceipt }),
  });

export const unsendExpense = (expenseId: string) =>
  call<{ expense: SentExpense }>(`/expenses/${encodeURIComponent(expenseId)}/unsend`, { method: "POST", body: "{}" });

export const listApprovals = () => call<{ waiting: ApprovalItem[]; decided: ApprovalItem[] }>("/approvals");

export const decideApproval = (id: string, decision: "approve" | "return", note = "") =>
  call<{ approval: ApprovalItem }>(`/approvals/${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  });
