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
import { adoptGoogleTokens, fetchGoogleEvents, getStoredGoogleTokens, clearGoogleTokens } from "@/services/googleCalendar";
import { adoptOutlookTokens, clearOutlookTokens } from "@/services/outlookCalendar";

/** The calendar access a Google or Microsoft sign-in granted, as the backend hands it over. */
export interface SignInCalendar {
  provider: "google" | "outlook";
  accessToken: string;
  refreshToken?: string | null;
  email?: string | null;
}

/**
 * Connect the calendar of the account the traveler just signed in with.
 *
 * Signing in with Google or Microsoft asks for calendar access in the same
 * step, so there is no separate "Connect calendar" to remember. It takes the
 * single calendar slot (see `connectCalendar`), replacing whichever calendar
 * this browser had before.
 */
export function connectCalendarFromSignIn(calendar: SignInCalendar | null | undefined): boolean {
  if (!calendar?.accessToken || (calendar.provider !== "google" && calendar.provider !== "outlook")) return false;
  connectCalendar(calendar.provider);
  if (calendar.provider === "google") adoptGoogleTokens(calendar);
  else adoptOutlookTokens(calendar);
  return true;
}
import { disconnectCalendar as clearLegacyCalendarState } from "@/services/mockCalendarService";

export type CalendarProvider = "outlook" | "google" | null;

export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  /**
   * YYYY-MM-DD, the days the event is on as the traveler sees them: in their
   * own time zone, and with an all-day event ending on its last day rather than
   * the day after.
   */
  startDate: string;
  endDate: string;
  /** The exact start and end instants of a timed meeting (ISO), when known. */
  start?: string;
  end?: string;
  /** True for an all-day event — it has days, not times. */
  allDay?: boolean;
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
      ...eventDays(e),
      location: e.location,
      description: e.description,
      attendees: e.attendees,
      cancelled: false, // Google drops cancelled events from the list entirely
    }));
  }
  return [];
}

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * The days an event is on, from its exact times when the backend sends them.
 *
 * Two things the plain date fields get wrong. Both providers give an all-day
 * event an end date of the day *after* it finishes, so a one-day offsite read
 * as two days. And Outlook's times arrive in UTC, where a 6 PM meeting in
 * California is already tomorrow. Reading the instants in the traveler's own
 * zone fixes both; without them (an older backend) the dates are used as sent.
 */
export function eventDays(e: { startDate: string; endDate: string; start?: string; end?: string; allDay?: boolean }) {
  if (e.allDay && e.start) {
    const first = e.start.slice(0, 10);
    let last = (e.end || e.start).slice(0, 10);
    if (last > first) {
      const [y, m, d] = last.split("-").map(Number);
      last = localDay(new Date(y, m - 1, d - 1));
    }
    return { startDate: first, endDate: last < first ? first : last, start: e.start, end: e.end, allDay: true };
  }
  const begins = e.start ? new Date(e.start) : null;
  const finishes = e.end ? new Date(e.end) : null;
  if (begins && !Number.isNaN(begins.getTime())) {
    const ends = finishes && !Number.isNaN(finishes.getTime()) ? finishes : begins;
    // A meeting that ends at midnight ends on the day it was on.
    const lastMoment = ends.getTime() > begins.getTime() ? new Date(ends.getTime() - 1) : ends;
    return { startDate: localDay(begins), endDate: localDay(lastMoment), start: e.start, end: e.end, allDay: false };
  }
  return { startDate: e.startDate, endDate: e.endDate };
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
    ...eventDays(e),
    location: e.location,
    description: e.description,
    attendees: e.attendees,
    cancelled: Boolean(e.cancelled),
  };
}

/** Locations that carry a "place" that isn't one. */
const VIRTUAL_LOCATION = /zoom|teams|meet\.google|webex|http|virtual|online|phone|call/i;

/**
 * The pieces of a location string worth testing against the airport list.
 *
 * Calendars disagree about what goes in this field. Google stores whatever the
 * organizer typed, so "Chicago, IL" arrives intact. Outlook runs the Location
 * box through Bing Places, so picking a suggestion rewrites it as a full postal
 * address — "233 S Wacker Dr, Chicago, IL 60606". Reading only the first
 * segment therefore worked on Google and silently failed on Outlook, where the
 * first segment is a street.
 *
 * Returned last segment first, because postal formats put city, region and
 * country at the end. Segments are matched whole rather than by substring,
 * which is what keeps "Lincoln Building" from resolving to Lincoln.
 */
export function locationCandidates(location: string): string[] {
  // Parentheses too: Outlook shows a picked place as
  // "San Diego International Airport (2412 N Harbor Dr, San Diego, CA, …)".
  const parts = location.split(/[,()]/).map((part) => part.trim()).filter(Boolean);
  const candidates: string[] = [];
  const add = (text: string) => {
    if (text && !candidates.includes(text)) candidates.push(text);
  };
  for (const part of parts.reverse()) {
    add(part);
    // "IL 60606" / "TX 78701" — drop the postcode so the region still resolves.
    add(part.replace(/\s+\d[\d\s-]*$/, "").trim());
    // "San Diego International Airport" / "JFK Airport" — a venue that is
    // itself the destination. Strip the suffix and the city is what's left.
    add(part.replace(/\s+(international\s+)?airport$/i, "").trim());
  }
  return candidates;
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
  if (VIRTUAL_LOCATION.test(location)) return false;
  return locationCandidates(location).some(resolvePlace);
}

/**
 * The part of a location to actually book travel to.
 *
 * A booking query built from the raw field would read "Trip to 233 S Wacker Dr,
 * Chicago, IL 60606" and hand the trip parser a street address to find an
 * airport in. This hands it the city instead.
 */
export function travelDestination(
  event: UnifiedCalendarEvent,
  resolvePlace: (text: string) => boolean,
  isCity?: (text: string) => boolean,
): string | null {
  const location = (event.location || "").trim();
  if (!location || VIRTUAL_LOCATION.test(location)) return null;
  const candidates = locationCandidates(location);
  // Prefer an actual city. Candidates run last-segment-first, and the tail of a
  // postal address is the country or state — so "London, United Kingdom" would
  // otherwise book a trip to the United Kingdom, and "…, Chicago, IL 60606" to
  // Illinois. Both resolve to airports; neither is a destination.
  if (isCity) {
    const city = candidates.find(isCity);
    if (city) return city;
  }
  return candidates.find(resolvePlace) ?? null;
}
