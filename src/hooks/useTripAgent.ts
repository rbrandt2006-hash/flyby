import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calendarSyncError, connectedAccount, connectedProvider, fetchUpcomingEvents,
  type CalendarProvider, type UnifiedCalendarEvent,
} from "@/services/calendarSync";
import {
  detectItineraryDrift, tripsAwaitingExpenseReport, canAutoResolve,
  type AgentTrip, type AgentExpense, type ItineraryDrift, type ReportDue,
} from "@/services/tripAgent";
import {
  assessEvents, knownAssessments, proposeTrips,
  type EventAssessment, type TripProposal,
} from "@/services/calendarTrips";
import { AIRPORTS } from "@/data/globalAirports";
import { useTravelPreferences } from "@/hooks/useTravelPreferences";

/**
 * The agent that watches the calendar and keeps trips honest.
 *
 * Three jobs, all of which are otherwise manual operations work:
 *
 *  1. **Spot trips that need booking** — meetings the traveler has to be
 *     somewhere else for, with no trip yet. Which meetings those are is read by
 *     Gemini; where to fly and on which days is worked out here from the
 *     calendar's own dates (see services/calendarTrips.ts).
 *  2. **Spot trips that drifted** — a meeting moved or was cancelled, so the
 *     booked trip no longer matches reality. This is the one that normally
 *     means cancelling and rebooking across several sites by hand.
 *  3. **Spot trips that ended** — with expenses still to submit, so a report
 *     can be drafted the moment the traveler is home.
 *
 * It only *reports* — it never books or cancels behind the traveler's back.
 * Acting on a finding is an explicit call, so an agent that misreads a calendar
 * can't quietly spend money.
 *
 * Does nothing at all until a calendar is connected, so the app behaves exactly
 * as before for anyone who hasn't linked one.
 */

const POLL_INTERVAL_MS = 5 * 60 * 1000; // five minutes

export interface UnbookedMeeting {
  event: UnifiedCalendarEvent;
  summary: string;
  /**
   * The bookable place from the meeting's location — the city, not the street.
   * Outlook rewrites a location into a full postal address, so the raw field is
   * not something to hand a trip parser.
   */
  destination: string;
  /** The trip Flyby would plan for it: travel days, meeting time, and why. */
  proposal: TripProposal;
}

export interface TripAgentState {
  provider: CalendarProvider;
  account: string | null;
  connected: boolean;
  checking: boolean;
  lastCheckedAt: string | null;
  /** Every upcoming meeting on the connected calendar, travel or not. */
  events: UnifiedCalendarEvent[];
  /** Set when the last calendar read failed, so empty never means "looked, found nothing". */
  syncError: string | null;
  /** Meetings that look like travel but have no trip yet. */
  unbooked: UnbookedMeeting[];
  /** Booked trips that no longer match the calendar. */
  drifts: ItineraryDrift[];
  /** For a trip whose meeting moved: the trip Flyby would plan for the new days, by trip id. */
  replans: Record<string, TripProposal>;
  /** Finished trips with expenses ready to submit. */
  reportsDue: ReportDue[];
  refresh: () => Promise<void>;
}

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart <= bEnd && bStart <= aEnd;

export function useTripAgent(trips: AgentTrip[], expenses: AgentExpense[]): TripAgentState {
  const [provider, setProvider] = useState<CalendarProvider>(connectedProvider());
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>([]);
  const [assessments, setAssessments] = useState<Map<string, EventAssessment>>(new Map());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Where the traveler is based: a meeting there is not a trip.
  const { preferences, isLoading: preferencesLoading } = useTravelPreferences();
  const home = useMemo(
    () => AIRPORTS.find((a) => a.code === (preferences.homeAirport || "").toUpperCase()) ?? null,
    [preferences.homeAirport],
  );
  const homeRef = useRef(home);
  homeRef.current = home;

  // Kept in refs so the polling loop always sees current data without being
  // torn down and recreated every time a trip or expense changes.
  const tripsRef = useRef(trips);
  const expensesRef = useRef(expenses);
  tripsRef.current = trips;
  expensesRef.current = expenses;

  // What is on screen, as text — so a re-check that finds the same calendar
  // changes nothing. The check runs every time the window regains focus, which
  // includes the click that brings it back; rebuilding the list under that
  // click would make it miss the button.
  const shownEvents = useRef("[]");
  const shownAssessments = useRef("[]");
  const showEvents = useCallback((next: UnifiedCalendarEvent[]) => {
    const text = JSON.stringify(next);
    if (text === shownEvents.current) return;
    shownEvents.current = text;
    setEvents(next);
  }, []);
  const showAssessments = useCallback((next: Map<string, EventAssessment>) => {
    const text = JSON.stringify([...next.entries()].sort(([a], [b]) => a.localeCompare(b)));
    if (text === shownAssessments.current) return;
    shownAssessments.current = text;
    setAssessments(next);
  }, []);

  const refresh = useCallback(async () => {
    const current = connectedProvider();
    setProvider(current);
    if (!current) {
      showEvents([]);
      showAssessments(new Map());
      return;
    }
    setChecking(true);
    try {
      const upcoming = await fetchUpcomingEvents();
      const base = homeRef.current ? { code: homeRef.current.code, city: homeRef.current.city } : null;
      // Straight away: everything already read. Then the full reading, which
      // adds whatever is new on the calendar.
      showEvents(upcoming);
      // Not while a fuller reading is already on screen: the remembered one
      // can only be a subset of it.
      if (shownAssessments.current === "[]") showAssessments(knownAssessments(upcoming, base));
      setSyncError(calendarSyncError());
      setLastCheckedAt(new Date().toISOString());
      showAssessments(await assessEvents(upcoming, base));
    } finally {
      setChecking(false);
    }
  }, [showEvents, showAssessments]);

  useEffect(() => {
    // Wait to know where the traveler is based: reading the calendar without
    // it would send every event once now and again when it loads.
    if (preferencesLoading) return;
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    // Re-check when the traveler comes back to the tab, so a meeting moved on
    // their phone is noticed without waiting out the interval.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // A new home airport changes which meetings are trips, so read again.
  }, [refresh, preferencesLoading, home?.code]);

  const connected = provider !== null;

  const unbooked = useMemo<UnbookedMeeting[]>(() => {
    if (!connected) return [];
    const active = trips.filter((t) => t.status !== "cancelled" && t.status !== "archived");
    // Meetings a trip was already planned for.
    const covered = new Set<string>();
    for (const trip of active) {
      if (trip.sourceCalendarEventId) covered.add(trip.sourceCalendarEventId);
      for (const id of trip.sourceCalendarEventIds ?? []) covered.add(id);
    }
    return proposeTrips(events.filter((e) => !covered.has(e.id)), assessments, { home })
      // ...and meetings the traveler booked for by hand: a trip to the same
      // city over the same days means there is nothing left to suggest.
      .filter((proposal) => !active.some((trip) =>
        trip.destination.toLowerCase().includes(proposal.destinationCity.toLowerCase())
        && overlaps((trip.startDate || "").slice(0, 10), (trip.endDate || "").slice(0, 10),
          proposal.departDate, proposal.returnDate)))
      .map((proposal) => ({
        event: proposal.events[0],
        destination: proposal.destinationCity,
        proposal,
        summary: `${proposal.meetingLabel} in ${proposal.destinationCity} has no trip booked yet.`,
      }));
  }, [connected, events, assessments, trips, home]);

  const drifts = connected ? detectItineraryDrift(trips, events) : [];
  const reportsDue = tripsAwaitingExpenseReport(trips, expenses);

  // A moved meeting can be planned again for its new days.
  const replans = useMemo(() => {
    const out: Record<string, TripProposal> = {};
    for (const drift of drifts) {
      if (drift.reason !== "dates_changed") continue;
      const ids = new Set(drift.trip.sourceCalendarEventIds?.length
        ? drift.trip.sourceCalendarEventIds
        : drift.trip.sourceCalendarEventId ? [drift.trip.sourceCalendarEventId] : []);
      const [proposal] = proposeTrips(events.filter((e) => ids.has(e.id)), assessments, { home });
      if (proposal) out[drift.trip.id] = proposal;
    }
    return out;
    // `drifts` is rebuilt every render from the same inputs listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, events, assessments, trips, home]);

  return {
    provider,
    account: connectedAccount(),
    connected,
    checking,
    lastCheckedAt,
    events: connected ? events : [],
    syncError: connected ? syncError : null,
    unbooked,
    drifts,
    replans,
    reportsDue,
    refresh,
  };
}

export { canAutoResolve };
