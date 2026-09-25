/**
 * One calendar, whichever provider it happens to be.
 *
 * Flyby connects to Outlook or Google; everything downstream — trip detection,
 * rebooking when a meeting moves, closing out expenses — should not care which.
 * This is the single place that knows the difference.
 */

import {
  fetchOutlookEvents, isOutlookConnected, getOutlookEmail,
  type OutlookCalendarEvent,
} from "@/services/outlookCalendar";
import { fetchGoogleEvents, getStoredGoogleTokens } from "@/services/googleCalendar";

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

/** Which calendar the traveler has connected, if any. */
export function connectedProvider(): CalendarProvider {
  if (isOutlookConnected()) return "outlook";
  if (getStoredGoogleTokens()?.accessToken) return "google";
  return null;
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
