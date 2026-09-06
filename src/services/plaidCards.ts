/**
 * Connected-card expense capture (Plaid).
 *
 * The traveler links a corporate or personal card once. After that, charges are
 * pulled in, matched to whichever trip was running when they happened, and
 * filed as expenses automatically — so the expense report drafts itself.
 *
 * Flyby never sees a card number: the traveler authenticates with their bank
 * inside Plaid Link, and the backend holds only an opaque access token.
 *
 * Plaid keys aren't in place yet. Every function here degrades quietly —
 * `getPlaidStatus()` reports `configured: false` and the UI explains that card
 * linking isn't live. Nothing needs to change here once the keys land.
 */

import { authedFetch, backend } from "@/integrations/backend/client";

/** An expense the backend built from a card charge. */
export interface CapturedExpense {
  externalId: string;
  merchant: string;
  description: string;
  date: string;
  amount: number;
  currency: string;
  category: "flight" | "hotel" | "meals" | "transportation" | "entertainment" | "office";
  status: "pending";
  location: string;
  paymentMethod: string;
  reimbursable: boolean;
  tripId: string | null;
  tripName: string | null;
  source: "plaid";
}

/** Trip window used to attribute a charge to a trip. */
export interface TripWindow {
  id: string;
  name: string;
  /** ISO date */
  start: string;
  /** ISO date */
  end: string;
}

const LINK_STORAGE_KEY = "flyby.cardLink.v1";

interface StoredLink {
  accessToken: string;
  itemId?: string;
  cursor?: string | null;
  linkedAt: string;
}

/** The linked card for this browser, if any. */
export function getStoredLink(): StoredLink | null {
  try {
    const raw = localStorage.getItem(LINK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredLink) : null;
  } catch {
    return null;
  }
}

function storeLink(link: StoredLink) {
  try {
    localStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(link));
  } catch {
    /* storage unavailable — linking still works for this session */
  }
}

export function clearStoredLink() {
  try {
    localStorage.removeItem(LINK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether card linking is available (i.e. Plaid keys are configured). */
export async function getPlaidStatus(): Promise<{ configured: boolean }> {
  if (!backend.getCurrentSession()) return { configured: false };
  try {
    const response = await authedFetch("/api/plaid/status");
    if (!response.ok) return { configured: false };
    return await response.json();
  } catch {
    return { configured: false };
  }
}

/** Start Plaid Link — returns the short-lived token that opens the widget. */
export async function createLinkToken(): Promise<{ linkToken: string | null; error?: string }> {
  if (!backend.getCurrentSession()) return { linkToken: null, error: "not_signed_in" };
  try {
    const response = await authedFetch("/api/plaid/link-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) return { linkToken: null, error: "request_failed" };
    return await response.json();
  } catch {
    return { linkToken: null, error: "network_error" };
  }
}

/**
 * Finish linking. `publicToken` comes from Plaid Link on success; the durable
 * access token it returns is stored so syncing can run later.
 */
export async function completeLink(publicToken: string): Promise<boolean> {
  try {
    const response = await authedFetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken }),
    });
    if (!response.ok) return false;
    const body = await response.json();
    if (!body?.accessToken) return false;
    storeLink({ accessToken: body.accessToken, itemId: body.itemId, cursor: null, linkedAt: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull charges since the last sync and return them already shaped as expenses,
 * attributed to whichever trip was running when each charge happened.
 *
 * Safe to call repeatedly — Plaid's cursor means only new activity comes back,
 * so the same charge is never imported twice.
 */
export async function syncCardExpenses(trips: TripWindow[]): Promise<CapturedExpense[]> {
  const link = getStoredLink();
  if (!link?.accessToken) return [];
  try {
    const response = await authedFetch("/api/plaid/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: link.accessToken, cursor: link.cursor, trips }),
    });
    if (!response.ok) return [];
    const body = await response.json();
    // Advance the cursor so the next sync only fetches what's new.
    storeLink({ ...link, cursor: body?.cursor ?? link.cursor });
    return Array.isArray(body?.expenses) ? (body.expenses as CapturedExpense[]) : [];
  } catch {
    return [];
  }
}
