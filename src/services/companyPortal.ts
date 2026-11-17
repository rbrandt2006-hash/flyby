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
