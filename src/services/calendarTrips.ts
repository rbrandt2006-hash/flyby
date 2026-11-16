/**
 * From a calendar to the trips it implies.
 *
 * Three steps, each doing what it is suited to:
 *
 *  1. **Reading** — which events mean physically going somewhere, and where.
 *     Gemini does this on the backend (`/functions/v1/assess-calendar`): it can
 *     tell "Acme QBR — Chicago" from a Teams call that mentions Chicago, and a
 *     meeting from a "Flight to Denver" that is already a booking. When Gemini
 *     can't be asked, the built-in location rule answers instead.
 *
 *  2. **Checking** — every city is resolved against Flyby's own airport list,
 *     and anything in the traveler's home area is dropped. A city Gemini named
 *     that Flyby can't fly to never becomes a proposal.
 *
 *  3. **Planning** — ordinary code, from the calendar's own dates and times:
 *     meetings in the same city on neighbouring days become one trip, and the
 *     travel days follow the rule a travel manager uses. A meeting before noon
 *     means flying in the day before; one after noon means flying in that
 *     morning, with the meeting time passed to the flight ranking so only
 *     flights that land in time are picked. A meeting over by 4 PM means home
 *     the same evening; later than that, the next day.
 *
 * Nothing here books anything. A proposal is a suggestion with one button.
 */

import { authedFetch, backend } from "@/integrations/backend/client";
import { findAirports, type Airport } from "@/data/globalAirports";
import { timeZoneForAirport } from "@/data/airportTimeZones";
import { impliesTravel, travelDestination, type UnifiedCalendarEvent } from "@/services/calendarSync";

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export interface EventAssessment {
  id: string;
  /** The traveler has to physically go somewhere outside their home area. */
  travel: boolean;
  city: string | null;
  /** False when the city was inferred from a venue rather than written in the event. */
  cityStated: boolean;
  kind: string;
  /** What the event is, cleaned up — "Acme quarterly review". */
  purpose: string;
  confidence: number;
  why: string;
  engine: "gemini" | "rules";
}

const CACHE_KEY = "flyby.calendarAssessments.v1";
const CACHE_LIMIT = 300;
const CACHE_DAYS = 14;
const BATCH = 40;

/** Everything about an event that the reading depends on. Change any of it and it is read again. */
function fingerprint(event: UnifiedCalendarEvent, home: string): string {
  const text = [event.id, event.title, event.location, event.start ?? event.startDate, event.end ?? event.endDate,
    (event.description || "").slice(0, 300), home].join("\u0001");
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `${event.id.slice(-24)}:${(hash >>> 0).toString(36)}`;
}

type Cached = EventAssessment & { at: number };

function loadCache(): Record<string, Cached> {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, Cached>) {
  try {
    const cutoff = Date.now() - CACHE_DAYS * 86400000;
    const fresh = Object.entries(cache)
      .filter(([, value]) => value.at >= cutoff)
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, CACHE_LIMIT);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(fresh)));
  } catch {
    /* storage unavailable — events are simply read again next time */
  }
}

const resolvePlace = (text: string) => findAirports(text.trim()).length > 0;
const isCity = (text: string) => {
  const needle = text.trim().toLowerCase();
  return findAirports(needle).some((airport) => airport.city.toLowerCase() === needle);
};

/** Calendar entries that are themselves a booking — a flight, a hotel, a car — not a meeting to travel to. */
const BOOKING_ENTRY = /\b(flight (to|from)|hotel reservation|check[- ]?in|rental car|car rental|boarding pass|train to)\b|\bhotel\s*:|^[A-Z]{2}\s?\d{2,4}\b/i;

/**
 * The built-in rule: an event is travel when its Location names somewhere Flyby
 * can fly to. Used only for events Gemini couldn't be asked about.
 */
export function assessByRule(event: UnifiedCalendarEvent): EventAssessment {
  const travel = !BOOKING_ENTRY.test(event.title || "") && impliesTravel(event, resolvePlace);
  const city = travel ? travelDestination(event, resolvePlace, isCity) : null;
  return {
    id: event.id,
    travel: travel && Boolean(city),
    city,
    cityStated: true,
    kind: travel ? "meeting" : "other",
    purpose: event.title,
    confidence: travel ? 0.7 : 0.6,
    why: travel && city ? `Its location is in ${city}.` : "Its location doesn't name a place to travel to.",
    engine: "rules",
  };
}

/**
 * What is already known about these events, without asking anyone.
 *
 * Only Gemini's remembered readings — events it hasn't read are left out
 * rather than guessed at, so nothing is suggested and then taken back a second
 * later when the real reading arrives.
 */
export function knownAssessments(
  events: UnifiedCalendarEvent[],
  home: { code: string; city: string } | null,
): Map<string, EventAssessment> {
  const homeLabel = home ? `${home.city} (${home.code})` : "";
  const cache = loadCache();
  const known = new Map<string, EventAssessment>();
  for (const event of events) {
    const hit = event.cancelled ? undefined : cache[fingerprint(event, homeLabel)];
    if (hit) known.set(event.id, { ...hit, id: event.id });
  }
  return known;
}

/**
 * Decide which events need a trip.
 *
 * Gemini's reading is used where there is one (remembered between visits, so a
 * calendar is only sent once per change); the rule covers the rest. Always
 * resolves — with nothing but the rule when signed out or offline.
 */
export async function assessEvents(
  events: UnifiedCalendarEvent[],
  home: { code: string; city: string } | null,
): Promise<Map<string, EventAssessment>> {
  const homeLabel = home ? `${home.city} (${home.code})` : "";
  const result = new Map<string, EventAssessment>();
  const cache = loadCache();
  const unread: UnifiedCalendarEvent[] = [];
  const keys = new Map<string, string>();

  for (const event of events) {
    if (event.cancelled) continue;
    const key = fingerprint(event, homeLabel);
    keys.set(event.id, key);
    const known = cache[key];
    if (known) result.set(event.id, { ...known, id: event.id });
    else {
      result.set(event.id, assessByRule(event));
      unread.push(event);
    }
  }

  if (unread.length === 0 || !backend.getCurrentSession()) return result;

  let learned = false;
  for (let start = 0; start < unread.length; start += BATCH) {
    const batch = unread.slice(start, start + BATCH);
    try {
      const response = await authedFetch("/functions/v1/assess-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home: homeLabel,
          // Only what the reading needs. Attendee addresses stay here.
          events: batch.map((event) => ({
            id: event.id,
            title: event.title,
            location: event.location,
            description: (event.description || "").slice(0, 300),
            start: event.start ?? event.startDate,
            end: event.end ?? event.endDate,
            allDay: Boolean(event.allDay),
            attendeeCount: event.attendees?.length || undefined,
          })),
        }),
      });
      if (!response.ok) break; // an older backend, or it is down: keep the rule's answers
      const body = await response.json();
      if (!Array.isArray(body?.assessments)) break;
      for (const row of body.assessments as Array<Omit<EventAssessment, "engine">>) {
        const key = keys.get(row.id);
        if (!key || typeof row.travel !== "boolean") continue;
        const assessment: EventAssessment = {
          id: row.id,
          travel: row.travel,
          city: row.city || null,
          cityStated: Boolean(row.cityStated),
          kind: row.kind || "other",
          purpose: row.purpose || "",
          confidence: typeof row.confidence === "number" ? row.confidence : 0.5,
          why: row.why || "",
          engine: "gemini",
        };
        result.set(row.id, assessment);
        cache[key] = { ...assessment, at: Date.now() };
        learned = true;
      }
    } catch {
      break;
    }
  }
  if (learned) saveCache(cache);
  return result;
}

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

/** What the planner needs to know about the meeting a trip is for. */
export interface CalendarTripContext {
  eventIds: string[];
  /** "Acme QBR" */
  title: string;
  /** "Acme QBR, Tue Dec 9 at 9:00 AM" */
  meetingLabel: string;
  destinationCity: string;
  airportCode: string;
  departDate: string; // YYYY-MM-DD
  returnDate: string;
  /** Destination-local "YYYY-MM-DDTHH:MM" the traveler must be there by. Only when flying in that day. */
  arriveBy?: string;
  /** Destination-local time the last meeting ends, when flying home that day. */
  leaveAfter?: string;
  /** Asked for when the end time isn't known: the evening, to be safe. */
  returnWindow?: "evening";
  /** The meeting days this trip was planned around, to notice when they move. */
  snapshot: Array<{ id: string; start: string; end: string }>;
}

export interface TripProposal extends CalendarTripContext {
  key: string;
  events: UnifiedCalendarEvent[];
  /** "Fly out Mon, Dec 8 · back Tue, Dec 9" */
  plan: string;
  /** Why Flyby thinks this needs a trip, in a sentence. */
  why: string;
  engine: "gemini" | "rules";
  /** The city came from a venue name, not from the event's own words. */
  cityInferred: boolean;
  personal: boolean;
  /** Set when the calendar already shows a flight or hotel for this trip. */
  existingTravel?: string;
}

interface Meeting {
  event: UnifiedCalendarEvent;
  assessment: EventAssessment;
  airport: Airport;
  date: string;
  time?: string;
  endDate: string;
  endTime?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function addDays(day: string, count: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return isoDay(new Date(y, m - 1, d + count));
}

function dayGap(from: string, to: string): number {
  const parse = (day: string) => { const [y, m, d] = day.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((parse(to) - parse(from)) / 86400000);
}

/** An instant as the date and clock time shown in `timeZone`. */
function wallClock(instant: string | undefined, timeZone: string): { date: string; time: string } | null {
  if (!instant) return null;
  const moment = new Date(instant);
  if (Number.isNaN(moment.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(moment);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
  } catch {
    return null;
  }
}

/** The airport for a city name, preferring an exact city match over a loose one. */
function airportFor(city: string): Airport | null {
  const matches = findAirports(city.trim());
  if (matches.length === 0) return null;
  const needle = city.trim().toLowerCase();
  return matches.find((a) => a.city.toLowerCase() === needle) ?? matches[0];
}

function sameArea(a: Airport, b: Airport): boolean {
  if (a.code === b.code) return true;
  if (a.metroArea && b.metroArea && a.metroArea === b.metroArea) return true;
  return a.city.toLowerCase() === b.city.toLowerCase() && a.country === b.country;
}

function friendlyDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function friendlyTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

export interface ProposeOptions {
  /** Where the traveler is based, when they've said. */
  home: Airport | null;
  today?: Date;
  /** How sure the reading has to be before an event is proposed. */
  minConfidence?: number;
}

/**
 * Turn assessed events into trip proposals.
 *
 * Pure: the same events, assessments and options always give the same
 * proposals, so it can be tested without a calendar or a network.
 */
export function proposeTrips(
  events: UnifiedCalendarEvent[],
  assessments: Map<string, EventAssessment>,
  options: ProposeOptions,
): TripProposal[] {
  const today = isoDay(options.today ?? new Date());
  const minConfidence = options.minConfidence ?? 0.6;

  const meetings: Meeting[] = [];
  for (const event of events) {
    const assessment = assessments.get(event.id);
    if (!assessment || event.cancelled) continue;
    if (!assessment.travel || !assessment.city || assessment.confidence < minConfidence) continue;
    const airport = airportFor(assessment.city);
    if (!airport) continue; // somewhere Flyby can't fly to is not a proposal
    if (options.home && sameArea(airport, options.home)) continue;

    // Times are read on the destination's clock, because that is what a
    // flight's arrival time is on. Without a known zone the meeting is planned
    // around its day alone — never around a time that might be hours off.
    const zone = timeZoneForAirport(airport);
    const begins = !event.allDay && zone ? wallClock(event.start, zone) : null;
    let finishes = !event.allDay && zone ? wallClock(event.end, zone) : null;
    if (begins && finishes && finishes.time === "00:00" && finishes.date > begins.date) {
      finishes = { date: addDays(finishes.date, -1), time: "23:59" };
    }
    const meeting: Meeting = {
      event, assessment, airport,
      date: begins?.date ?? event.startDate,
      time: begins?.time,
      endDate: finishes?.date ?? event.endDate,
      endTime: begins ? finishes?.time : undefined,
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meeting.date) || !/^\d{4}-\d{2}-\d{2}$/.test(meeting.endDate)) continue;
    if (meeting.endDate < meeting.date) meeting.endDate = meeting.date;
    if (meeting.date < today) continue; // already started or over
    meetings.push(meeting);
  }

  meetings.sort((a, b) => `${a.date}T${a.time ?? "00:00"}`.localeCompare(`${b.date}T${b.time ?? "00:00"}`));

  // Meetings in the same city on the same or neighbouring days are one trip.
  const groups: Meeting[][] = [];
  for (const meeting of meetings) {
    const group = groups.find((g) =>
      sameArea(g[0].airport, meeting.airport)
      && dayGap(g.reduce((latest, m) => (m.endDate > latest ? m.endDate : latest), g[0].endDate), meeting.date) <= 1);
    if (group) group.push(meeting);
    else groups.push([meeting]);
  }

  const bookings = events
    .map((event) => ({ event, assessment: assessments.get(event.id) }))
    .filter((row) => row.assessment?.kind === "travel_booking" && row.assessment.city);

  const proposals: TripProposal[] = [];
  for (const group of groups) {
    const first = group[0];
    const last = group.reduce((latest, m) =>
      `${m.endDate}T${m.endTime ?? "23:59"}` > `${latest.endDate}T${latest.endTime ?? "23:59"}` ? m : latest, group[0]);

    // In: an afternoon start can be reached that morning; anything earlier, or
    // an unknown time, means arriving the night before.
    const sameDayIn = Boolean(first.time && first.time >= "12:00");
    let departDate = sameDayIn ? first.date : addDays(first.date, -1);
    if (departDate < today) departDate = today;
    const arriveBy = first.time && departDate === first.date ? `${first.date}T${first.time}` : undefined;

    // Out: done by 4 PM means home that evening. Later means the next day. With
    // no end time, the last day — in the evening, to be safe.
    const sameDayOut = Boolean(last.endTime && last.endTime <= "16:00");
    let returnDate = last.endTime ? (sameDayOut ? last.endDate : addDays(last.endDate, 1)) : last.endDate;
    if (returnDate < departDate) returnDate = departDate;
    const leaveAfter = sameDayOut ? `${last.endDate}T${last.endTime}` : undefined;
    const returnWindow = last.endTime ? undefined : "evening" as const;

    // The traveler's own name for the meeting, unless it is mail clutter
    // ("FW: RE: …") or too long to show — then the cleaned-up reading of it.
    const own = (first.event.title || "").trim();
    const cluttered = !own || own.length > 70 || /^(fw|fwd|re)\s*:/i.test(own);
    const title = cluttered ? (first.assessment.purpose || own || "Meeting") : own;
    const meetingLabel = `${title}, ${friendlyDay(first.date)}${first.time ? ` at ${friendlyTime(first.time)}` : ""}`;
    const city = first.airport.city;
    const plan = departDate === returnDate
      ? `Fly out and back ${friendlyDay(departDate)}`
      : `Fly out ${friendlyDay(departDate)} · back ${friendlyDay(returnDate)}${returnWindow ? " (evening)" : ""}`;

    const already = bookings.find((row) => {
      const where = airportFor(row.assessment!.city!);
      return where && sameArea(where, first.airport)
        && row.event.startDate >= addDays(departDate, -1) && row.event.startDate <= addDays(returnDate, 1);
    });

    proposals.push({
      key: group.map((m) => m.event.id).sort().join("|"),
      eventIds: group.map((m) => m.event.id),
      events: group.map((m) => m.event),
      title: group.length > 1 ? `${title} + ${group.length - 1} more` : title,
      meetingLabel,
      destinationCity: city,
      airportCode: first.airport.code,
      departDate,
      returnDate,
      arriveBy,
      leaveAfter,
      returnWindow,
      snapshot: group.map((m) => ({ id: m.event.id, start: m.event.startDate, end: m.event.endDate })),
      plan,
      why: first.assessment.why,
      engine: group.every((m) => m.assessment.engine === "gemini") ? "gemini" : "rules",
      cityInferred: group.some((m) => !m.assessment.cityStated),
      personal: group.every((m) => m.assessment.kind === "personal"),
      existingTravel: already
        ? `Your calendar already shows "${already.event.title}" on ${friendlyDay(already.event.startDate)}.`
        : undefined,
    });
  }

  return proposals.sort((a, b) => a.departDate.localeCompare(b.departDate));
}

// ---------------------------------------------------------------------------
// Handing a proposal to the planner
// ---------------------------------------------------------------------------

const QUERY_KEY = "flyby_prefill_query";
const PLAN_KEY = "flyby_prefill_plan";

const usDate = (day: string) => {
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : day;
};

/**
 * The request the planner runs for a proposal.
 *
 * Written the way a traveler would type it, with dates in a form both the AI
 * parser and the built-in fallback read the same way.
 */
export function proposalQuery(proposal: CalendarTripContext): string {
  return `Trip to ${proposal.destinationCity} from ${usDate(proposal.departDate)} to ${usDate(proposal.returnDate)}`;
}

/** Leave a request for the Home page to pick up and plan, with its meeting attached. */
export function stashPlannerPrefill(query: string, calendar?: CalendarTripContext) {
  try {
    sessionStorage.setItem(QUERY_KEY, query);
    if (calendar) {
      const { eventIds, title, meetingLabel, destinationCity, airportCode, departDate, returnDate,
        arriveBy, leaveAfter, returnWindow, snapshot } = calendar;
      sessionStorage.setItem(PLAN_KEY, JSON.stringify({
        query,
        calendar: { eventIds, title, meetingLabel, destinationCity, airportCode, departDate, returnDate,
          arriveBy, leaveAfter, returnWindow, snapshot },
      }));
    } else {
      sessionStorage.removeItem(PLAN_KEY);
    }
  } catch {
    /* storage unavailable — the traveler can type the request instead */
  }
}

/** Take the waiting request, if there is one. It is removed so it runs once. */
export function takePlannerPrefill(): { query: string; calendar?: CalendarTripContext } | null {
  try {
    const query = sessionStorage.getItem(QUERY_KEY);
    const stored = sessionStorage.getItem(PLAN_KEY);
    sessionStorage.removeItem(QUERY_KEY);
    sessionStorage.removeItem(PLAN_KEY);
    if (!query) return null;
    const plan = stored ? JSON.parse(stored) : null;
    const calendar = plan?.query === query && plan?.calendar?.eventIds?.length ? plan.calendar as CalendarTripContext : undefined;
    return { query, calendar };
  } catch {
    return null;
  }
}
