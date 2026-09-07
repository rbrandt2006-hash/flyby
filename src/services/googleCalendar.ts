/**
 * Google Calendar sync.
 *
 * Reads the traveler's meetings so ones that imply travel can become trips, and
 * writes confirmed trips back onto their calendar. The traveler authenticates
 * with Google directly — Flyby never sees a password, and the client secret
 * stays on the backend.
 *
 * Credentials aren't in place yet. `getGoogleStatus()` reports
 * `configured: false` and the UI shows "Coming soon" rather than pretending to
 * connect. Nothing here changes once the keys land.
 */

import { authedFetch, backend } from "@/integrations/backend/client";

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  attendees: string[];
}

const TOKEN_KEY = "flyby.googleCalendar.v1";

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  email?: string | null;
  connectedAt: string;
}

export function getStoredGoogleTokens(): StoredTokens | null {
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

export function clearGoogleTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether Google Calendar sync is available yet (i.e. credentials are set). */
export async function getGoogleStatus(): Promise<{ configured: boolean }> {
  if (!backend.getCurrentSession()) return { configured: false };
  try {
    const response = await authedFetch("/api/google/status");
    if (!response.ok) return { configured: false };
    return await response.json();
  } catch {
    return { configured: false };
  }
}

/** The Google consent URL to send the traveler to. */
export async function getGoogleAuthUrl(): Promise<{ authUrl: string | null; error?: string }> {
  if (!backend.getCurrentSession()) return { authUrl: null, error: "not_signed_in" };
  try {
    const response = await authedFetch("/api/google/auth-url", {
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

/** Finish connecting with the code Google redirected back with. */
export async function completeGoogleConnect(code: string): Promise<{ ok: boolean; email?: string | null }> {
  try {
    const response = await authedFetch("/api/google/exchange", {
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
export async function fetchGoogleEvents(): Promise<GoogleCalendarEvent[]> {
  const tokens = getStoredGoogleTokens();
  if (!tokens?.accessToken) return [];
  try {
    const response = await authedFetch("/api/google/events", {
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
    // The backend transparently refreshes an expired access token; keep the new one.
    if (body?.accessToken && body.accessToken !== tokens.accessToken) {
      storeTokens({ ...tokens, accessToken: body.accessToken });
    }
    return Array.isArray(body?.events) ? (body.events as GoogleCalendarEvent[]) : [];
  } catch {
    return [];
  }
}

/** Put a confirmed trip on the traveler's calendar. */
export async function pushTripToGoogleCalendar(params: {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}): Promise<string | null> {
  const tokens = getStoredGoogleTokens();
  if (!tokens?.accessToken) return null;
  try {
    const response = await authedFetch("/api/google/event", {
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
