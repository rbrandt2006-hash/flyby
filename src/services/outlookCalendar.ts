/**
 * Outlook / Microsoft 365 calendar sync.
 *
 * Reads the traveler's meetings so ones that imply travel can become trips, and
 * writes confirmed trips back onto their calendar. The traveler signs in with
 * Microsoft directly — Flyby never sees a password, and the client secret stays
 * on the backend.
 *
 * Mirrors the Google service so the app can treat the two providers
 * interchangeably.
 */

import { authedFetch, backend } from "@/integrations/backend/client";

export interface OutlookCalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  attendees: string[];
  /** Set when the meeting was called off — drives automatic trip cleanup. */
  cancelled?: boolean;
}

const TOKEN_KEY = "flyby.outlookCalendar.v1";

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  email?: string | null;
  connectedAt: string;
}

export function getStoredOutlookTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: StoredTokens) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch {
    /* storage unavailable — the connection still works for this session */
  }
}

export function clearOutlookTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether the traveler currently has Outlook connected. */
export function isOutlookConnected(): boolean {
  return Boolean(getStoredOutlookTokens()?.accessToken);
}

export function getOutlookEmail(): string | null {
  return getStoredOutlookTokens()?.email ?? null;
}

/** Whether Outlook sync is available (i.e. credentials are configured). */
export async function getOutlookStatus(): Promise<{ configured: boolean }> {
  if (!backend.getCurrentSession()) return { configured: false };
  try {
    const response = await authedFetch("/api/outlook/status");
    if (!response.ok) return { configured: false };
    return await response.json();
  } catch {
    return { configured: false };
  }
}

/** The Microsoft consent URL to send the traveler to. */
export async function getOutlookAuthUrl(): Promise<{ authUrl: string | null; error?: string }> {
  if (!backend.getCurrentSession()) return { authUrl: null, error: "not_signed_in" };
  try {
    const response = await authedFetch("/api/outlook/auth-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) return { authUrl: null, error: "request_failed" };
    return await response.json();
  } catch {
    return { authUrl: null, error: "network_error" };
  }
}

/** Finish connecting with the code Microsoft redirected back with. */
export async function completeOutlookConnect(
  code: string,
): Promise<{ ok: boolean; email?: string | null }> {
  try {
    const response = await authedFetch("/api/outlook/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) return { ok: false };
    const body = await response.json();
    if (!body?.accessToken) return { ok: false };
    storeTokens({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      email: body.email ?? null,
      connectedAt: new Date().toISOString(),
    });
    return { ok: true, email: body.email ?? null };
  } catch {
    return { ok: false };
  }
}

/** Upcoming events from the connected calendar. Empty when not connected. */
export async function fetchOutlookEvents(): Promise<OutlookCalendarEvent[]> {
  const tokens = getStoredOutlookTokens();
  if (!tokens?.accessToken) return [];
  try {
    const response = await authedFetch("/api/outlook/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        timeMin: new Date().toISOString(),
      }),
    });
    if (!response.ok) return [];
    const body = await response.json();
    // The backend renews an expired access token transparently; keep the new one.
    if (body?.accessToken && body.accessToken !== tokens.accessToken) {
      storeTokens({
        ...tokens,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken || tokens.refreshToken,
      });
    }
    return Array.isArray(body?.events) ? (body.events as OutlookCalendarEvent[]) : [];
  } catch {
    return [];
  }
}

/** Put a confirmed trip on the traveler's Outlook calendar. */
export async function pushTripToOutlook(params: {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}): Promise<string | null> {
  const tokens = getStoredOutlookTokens();
  if (!tokens?.accessToken) return null;
  try {
    const response = await authedFetch("/api/outlook/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: tokens.accessToken, ...params }),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.event?.id ?? null;
  } catch {
    return null;
  }
}
