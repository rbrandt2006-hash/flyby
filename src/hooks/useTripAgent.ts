import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectedAccount, connectedProvider, fetchUpcomingEvents, impliesTravel,
  type CalendarProvider, type UnifiedCalendarEvent,
} from "@/services/calendarSync";
import {
  detectItineraryDrift, tripsAwaitingExpenseReport, canAutoResolve,
  type AgentTrip, type AgentExpense, type ItineraryDrift, type ReportDue,
} from "@/services/tripAgent";
import { findAirports } from "@/data/globalAirports";

/**
 * The agent that watches the calendar and keeps trips honest.
 *
 * Three jobs, all of which are otherwise manual operations work:
 *
 *  1. **Spot trips that need booking** — meetings somewhere Flyby can fly to
 *     that don't have a trip yet.
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
}

export interface TripAgentState {
  provider: CalendarProvider;
  account: string | null;
  connected: boolean;
  checking: boolean;
  lastCheckedAt: string | null;
  /** Meetings that look like travel but have no trip yet. */
  unbooked: UnbookedMeeting[];
  /** Booked trips that no longer match the calendar. */
  drifts: ItineraryDrift[];
  /** Finished trips with expenses ready to submit. */
  reportsDue: ReportDue[];
  refresh: () => Promise<void>;
}

/** A place name resolves to somewhere with an airport. */
const resolvePlace = (text: string) => findAirports(text.split(",")[0].trim()).length > 0;

export function useTripAgent(trips: AgentTrip[], expenses: AgentExpense[]): TripAgentState {
  const [provider, setProvider] = useState<CalendarProvider>(connectedProvider());
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>([]);

  // Kept in refs so the polling loop always sees current data without being
  // torn down and recreated every time a trip or expense changes.
  const tripsRef = useRef(trips);
  const expensesRef = useRef(expenses);
  tripsRef.current = trips;
  expensesRef.current = expenses;

  const refresh = useCallback(async () => {
    const current = connectedProvider();
    setProvider(current);
    if (!current) {
      setEvents([]);
      return;
    }
    setChecking(true);
    try {
      setEvents(await fetchUpcomingEvents());
      setLastCheckedAt(new Date().toISOString());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
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
  }, [refresh]);

  const connected = provider !== null;

  // Meetings that imply travel and have no trip covering them yet.
  const bookedEventIds = new Set(
    trips
      .filter((t) => t.status !== "cancelled" && t.status !== "archived")
      .map((t) => t.sourceCalendarEventId)
      .filter(Boolean) as string[],
  );
  const unbooked: UnbookedMeeting[] = connected
    ? events
        .filter((e) => !bookedEventIds.has(e.id))
        .filter((e) => impliesTravel(e, resolvePlace))
        .map((event) => ({
          event,
          summary: `"${event.title}" in ${event.location} on ${event.startDate} has no trip booked yet.`,
        }))
    : [];

  const drifts = connected ? detectItineraryDrift(trips, events) : [];
  const reportsDue = tripsAwaitingExpenseReport(trips, expenses);

  return {
    provider,
    account: connectedAccount(),
    connected,
    checking,
    lastCheckedAt,
    unbooked,
    drifts,
    reportsDue,
    refresh,
  };
}

export { canAutoResolve };
