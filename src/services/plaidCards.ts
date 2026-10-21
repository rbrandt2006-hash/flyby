/**
 * Connected-card expense capture (Plaid).
 *
 * The traveler links a corporate or personal card once. After that, the
 * backend pulls the card's charges, keeps the travel spend (flights, hotels,
 * rides, fuel, parking, meals), matches each charge to the trip that was running
 * when it happened, and offers those here to be filed as expenses — so the
 * expense report drafts itself.
 *
 * Flyby never sees a card number: the traveler signs in to their bank inside
 * Plaid Link. The bank access token that comes back stays on the server — it is
 * never sent to the browser.
 *
 * Every function degrades quietly: until Plaid keys are configured the backend
 * reports `configured: false` and the UI explains that card linking isn't live.
 */

import { authedFetch, backend } from "@/integrations/backend/client";

/** An expense the backend built from a card charge. */
export interface CapturedExpense {
  /** Plaid's transaction id — the same charge always has the same id. */
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

/** A linked bank or card account. */
export interface LinkedCard {
  id: string;
  institution: string;
  linkedAt: string | null;
  lastSyncedAt: string | null;
  /** Plaid's error code from the last sync, e.g. ITEM_LOGIN_REQUIRED. */
  lastError: string | null;
}

export interface CardStatus {
  configured: boolean;
  connected: boolean;
  cards: LinkedCard[];
}

export interface CardSync {
  /** Charges to file as expenses. */
  expenses: CapturedExpense[];
  /** Ids of filed charges the bank has since withdrawn. */
  removed: string[];
  cards: LinkedCard[];
}

// An earlier version kept the bank token in localStorage under this key. No
// card was ever linked that way (Plaid wasn't configured), but make sure
// nothing lingers.
try {
  localStorage.removeItem("flyby.cardLink.v1");
} catch {
  /* storage unavailable */
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body ?? {}),
});

/** Whether card linking is available, and which cards are linked. Null if Flyby couldn't be reached. */
export async function getCardStatus(): Promise<CardStatus | null> {
  if (!backend.getCurrentSession()) return null;
  try {
    const response = await authedFetch("/api/plaid/status");
    if (!response.ok) return null;
    const body = await response.json();
    return { configured: Boolean(body?.configured), connected: Boolean(body?.connected), cards: body?.cards ?? [] };
  } catch {
    return null;
  }
}

/** Start Plaid Link — returns the short-lived token that opens the widget. */
export async function createLinkToken(): Promise<{ linkToken: string | null; error?: string }> {
  if (!backend.getCurrentSession()) return { linkToken: null, error: "not_signed_in" };
  try {
    const response = await authedFetch("/api/plaid/link-token", json({}));
    if (!response.ok) return { linkToken: null, error: "request_failed" };
    return await response.json();
  } catch {
    return { linkToken: null, error: "network_error" };
  }
}

/**
 * Finish linking. `publicToken` comes from Plaid Link; the backend swaps it for
 * the bank access token, keeps that, and starts pulling charges.
 */
export async function completeLink(
  publicToken: string,
  institutionName?: string | null,
): Promise<{ ok: boolean; error?: string; card?: LinkedCard }> {
  try {
    const response = await authedFetch("/api/plaid/exchange", json({ publicToken, institutionName }));
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.connected) {
      return { ok: false, error: body?.error || "Couldn't finish connecting that account." };
    }
    return { ok: true, card: body.card };
  } catch {
    return { ok: false, error: "Couldn't reach Flyby to finish connecting." };
  }
}

/**
 * Bring the linked cards up to date and get the travel charges not yet filed.
 *
 * The same charges keep coming back until `ackCardExpenses` confirms they were
 * filed, so a save that fails part-way can't lose any. Null if Flyby couldn't
 * be reached.
 */
export async function syncCardExpenses(): Promise<CardSync | null> {
  if (!backend.getCurrentSession()) return null;
  try {
    const response = await authedFetch("/api/plaid/sync", json({}));
    if (!response.ok) return null;
    const body = await response.json();
    if (!body?.configured) return { expenses: [], removed: [], cards: [] };
    return {
      expenses: Array.isArray(body.expenses) ? body.expenses : [],
      removed: Array.isArray(body.removed) ? body.removed : [],
      cards: Array.isArray(body.cards) ? body.cards : [],
    };
  } catch {
    return null;
  }
}

/** Confirm these charges were filed (and these withdrawn ones dealt with). */
export async function ackCardExpenses(filed: string[], removed: string[] = []): Promise<boolean> {
  if (filed.length === 0 && removed.length === 0) return true;
  try {
    const response = await authedFetch("/api/plaid/ack", json({ filed, removed }));
    return response.ok;
  } catch {
    return false;
  }
}

/** Unlink a card. Flyby's access is revoked at Plaid; filed expenses stay. */
export async function disconnectCard(id: string): Promise<{ ok: boolean; cards?: LinkedCard[] }> {
  try {
    const response = await authedFetch("/api/plaid/disconnect", json({ id }));
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok && Boolean(body?.ok), cards: body?.cards };
  } catch {
    return { ok: false };
  }
}

/** Plain-language explanation of a sync problem on a linked card. */
export function describeCardError(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === "ITEM_LOGIN_REQUIRED" || code === "PENDING_EXPIRATION" || code === "ACCESS_NOT_GRANTED") {
    return "Your bank needs you to sign in again. Disconnect this card and connect it again.";
  }
  if (code === "PRODUCT_NOT_READY") return "Your bank is still sending your history. Charges appear shortly.";
  if (code === "INSTITUTION_DOWN" || code === "INSTITUTION_NOT_RESPONDING") {
    return "Your bank isn't responding right now. Flyby will keep trying.";
  }
  return "The last update from your bank didn't go through. Flyby will keep trying.";
}
