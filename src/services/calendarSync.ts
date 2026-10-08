/**
 * One calendar, whichever provider it happens to be.
 *
 * Flyby connects to Outlook or Google; everything downstream — trip detection,
 * rebooking when a meeting moves, closing out expenses — should not care which.
 * This is the single place that knows the difference.
 */

import {
  fetchOutlookEvents, isOutlookConnected, getOutlookEmail, getOutlookSyncError,
  type OutlookCalendarEvent,
} from "@/services/outlookCalendar";
import { fetchGoogleEvents, getStoredGoogleTokens, clearGoogleTokens } from "@/services/googleCalendar";
import { clearOutlookTokens } from "@/services/outlookCalendar";
import { disconnectCalendar as clearLegacyCalendarState } from "@/services/mockCalendarService";

export type CalendarProvider = "outlook" | "google" | null;

export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  attendees: string[];
  /** True when the meeting was called off — a trip for it should be dropped. */
  cancelled?: boolean;
}

/**
 * Which calendar the traveler has connected, if any.
 *
 * Exactly one at a time — see `connectCalendar`. Outlook is checked first only
 * to break a tie left over from an older build that could store both; the slot
 * is exclusive from here on.
 */
export function connectedProvider(): CalendarProvider {
  if (isOutlookConnected()) return "outlook";
  if (getStoredGoogleTokens()?.accessToken) return "google";
  return null;
}

/**
 * Claim the calendar slot for `provider`, releasing whatever held it.
 *
 * Call this immediately before sending the traveler to a provider's consent
 * screen. Flyby syncs one calendar, not two: two calendars means the same
 * meeting arrives twice under different ids, which reads as two trips to book
 * and two itineraries to keep in step. Holding tokens for both also left the
 * UI contradicting itself — Outlook connected, yet still asking for Google.
 */
export function connectCalendar(provider: Exclude<CalendarProvider, null>) {
  if (provider === "outlook") clearGoogleTokens();
  if (provider === "google") clearOutlookTokens();
  // The pre-OAuth build tracked a Google connection separately; clear it too so
  // it can't keep claiming a slot that now belongs to the other provider.
  void clearLegacyCalendarState();
}

/**
 * One-time cleanup for anyone who connected both before the slot was exclusive.
 *
 * Outlook wins the tie, matching connectedProvider(). Without this an existing
 * install keeps both tokens until the traveler happens to reconnect, and the UI
 * keeps contradicting itself in the meantime.
 */
(function releaseStaleSecondCalendar() {
  try {
    if (isOutlookConnected() && getStoredGoogleTokens()?.accessToken) {
      clearGoogleTokens();
    }
  } catch {
    /* storage unavailable — nothing stored, so nothing to reconcile */
  }
})();

/** Release the calendar slot entirely, whichever provider held it. */
export function disconnectCalendar() {
  clearGoogleTokens();
  clearOutlookTokens();
  void clearLegacyCalendarState();
}

export function isCalendarLinked(): boolean {
  return connectedProvider() !== null;
}

/** The connected account's address, for display. */
export function connectedAccount(): string | null {
  const provider = connectedProvider();
  if (provider === "outlook") return getOutlookEmail();
  if (provider === "google") return getStoredGoogleTokens()?.email ?? null;
  return null;
}

/**
 * Upcoming events from whichever calendar is connected.
 *
 * Returns an empty list when nothing is connected — callers can treat "no
 * calendar" and "no meetings" the same way, because in both cases there is
 * nothing to act on.
 */
export async function fetchUpcomingEvents(): Promise<UnifiedCalendarEvent[]> {
  const provider = connectedProvider();
  if (provider === "outlook") {
    const rows = await fetchOutlookEvents();
    return rows.map(normalizeOutlook);
  }
  if (provider === "google") {
    const rows = await fetchGoogleEvents();
    return rows.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      description: e.description,
      attendees: e.attendees,
      cancelled: false, // Google drops cancelled events from the list entirely
    }));
  }
  return [];
}

/**
 * Why the last calendar read failed, if it did — so an empty calendar can be
 * explained rather than silently looking like "no meetings".
 */
export function calendarSyncError(): string | null {
  return connectedProvider() === "outlook" ? getOutlookSyncError() : null;
}

function normalizeOutlook(e: OutlookCalendarEvent): UnifiedCalendarEvent {
  return {
    id: e.id,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location,
    description: e.description,
    attendees: e.attendees,
    cancelled: Boolean(e.cancelled),
  };
}

/**
 * Whether a meeting implies travel.
 *
 * Deliberately conservative: a meeting only counts when it names a place
 * somewhere Flyby can actually fly to. Guessing loosely here would mean booking
 * trips for meetings that were only ever going to be a video call.
 */
export function impliesTravel(
  event: UnifiedCalendarEvent,
  resolvePlace: (text: string) => boolean,
): boolean {
  if (event.cancelled) return false;
  const location = (event.location || "").trim();
  if (!location) return false;
  // Virtual meetings carry a "location" too — it just isn't a place.
  if (/zoom|teams|meet\.google|webex|http|virtual|online|phone|call/i.test(location)) {
    return false;
  }
  return resolvePlace(location);
}
