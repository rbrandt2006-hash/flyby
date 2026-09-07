/**
 * The autonomous side of Flyby.
 *
 * Two jobs that are otherwise tedious operations work:
 *
 *  1. **Keeping trips true to the calendar.** When a meeting moves, someone
 *     normally has to cancel and rebook flights and hotels by hand across
 *     several sites. `detectItineraryDrift` spots the change by comparing each
 *     trip against the calendar event it came from, so the rebooking can be
 *     driven automatically.
 *
 *  2. **Closing out a trip.** `tripsAwaitingExpenseReport` finds trips that have
 *     ended and still have expenses nobody has submitted, so a report can be
 *     drafted the moment the traveler gets home.
 *
 * Everything here is a pure function over data the app already holds — no
 * network, no side effects — so it is testable on its own and behaves
 * identically whether the calendar is connected or not.
 */

/** The minimum a trip must expose for the agent to reason about it. */
export interface AgentTrip {
  id: string;
  destination: string;
  /** ISO date-time or date. */
  startDate: string;
  endDate: string;
  status: string;
  /** The calendar event this trip was created for, when it came from one. */
  sourceCalendarEventId?: string | null;
}

/** The minimum a calendar event must expose. */
export interface AgentCalendarEvent {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD) or date-time. */
  startDate: string;
  endDate: string;
  /** Set when the meeting was called off. */
  cancelled?: boolean;
}

export type DriftReason = "dates_changed" | "event_cancelled" | "event_deleted";

export interface ItineraryDrift {
  trip: AgentTrip;
  reason: DriftReason;
  /** The dates the trip is currently booked for. */
  bookedStart: string;
  bookedEnd: string;
  /** The dates the meeting now needs, when it still exists. */
  neededStart?: string;
  neededEnd?: string;
  /** Plain-language explanation, ready to show or log. */
  summary: string;
}

const day = (value: string) => (value || "").slice(0, 10);

/**
 * Compare booked trips against the calendar they came from.
 *
 * Only trips that originated from a calendar event are considered — a trip
 * someone booked by hand isn't "wrong" just because it has no meeting attached.
 * Cancelled and archived trips are ignored; there is nothing left to rebook.
 */
export function detectItineraryDrift(
  trips: AgentTrip[],
  events: AgentCalendarEvent[],
): ItineraryDrift[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const drifts: ItineraryDrift[] = [];

  for (const trip of trips) {
    if (!trip.sourceCalendarEventId) continue;
    if (trip.status === "cancelled" || trip.status === "archived") continue;

    const event = byId.get(trip.sourceCalendarEventId);
    const bookedStart = day(trip.startDate);
    const bookedEnd = day(trip.endDate);

    if (!event) {
      drifts.push({
        trip, reason: "event_deleted", bookedStart, bookedEnd,
        summary: `The meeting behind the ${trip.destination} trip was removed from the calendar.`,
      });
      continue;
    }

    if (event.cancelled) {
      drifts.push({
        trip, reason: "event_cancelled", bookedStart, bookedEnd,
        summary: `"${event.title}" was cancelled — the ${trip.destination} trip is no longer needed.`,
      });
      continue;
    }

    const neededStart = day(event.startDate);
    const neededEnd = day(event.endDate);
    if (neededStart && neededStart !== bookedStart) {
      drifts.push({
        trip, reason: "dates_changed", bookedStart, bookedEnd, neededStart, neededEnd,
        summary: `"${event.title}" moved from ${bookedStart} to ${neededStart} — the ${trip.destination} trip needs rebooking.`,
      });
    }
  }

  return drifts;
}

/** The minimum an expense must expose. */
export interface AgentExpense {
  id: string;
  amount: number;
  status: string;
  tripId?: string | null;
  tripName?: string | null;
}

export interface ReportDue {
  trip: AgentTrip;
  expenseCount: number;
  total: number;
  summary: string;
}

/**
 * Trips that have finished and still have expenses nobody has submitted.
 *
 * "Unsubmitted" means anything not yet approved — those are exactly the lines a
 * report needs to cover. A trip with no expenses produces no report, so nothing
 * empty is ever put in front of the traveler.
 */
export function tripsAwaitingExpenseReport(
  trips: AgentTrip[],
  expenses: AgentExpense[],
  today: Date = new Date(),
): ReportDue[] {
  const cutoff = day(today.toISOString());
  const due: ReportDue[] = [];

  for (const trip of trips) {
    if (trip.status === "cancelled" || trip.status === "archived") continue;
    const ended = day(trip.endDate);
    if (!ended || ended > cutoff) continue; // still travelling

    const rows = expenses.filter(
      (e) =>
        e.status !== "approved" &&
        (e.tripId ? e.tripId === trip.id : e.tripName === trip.destination),
    );
    if (rows.length === 0) continue;

    const total = rows.reduce((sum, e) => sum + (e.amount || 0), 0);
    due.push({
      trip,
      expenseCount: rows.length,
      total,
      summary: `${trip.destination} ended ${ended} with ${rows.length} expense${rows.length > 1 ? "s" : ""} totaling $${total.toFixed(2)} ready to submit.`,
    });
  }

  return due;
}

/**
 * Whether a drifted trip can be rebooked automatically, or needs a human.
 *
 * A cancelled or deleted meeting means the trip should probably be dropped, not
 * silently moved — that is a decision for a person. A date change is exactly the
 * case worth automating.
 */
export function canAutoResolve(drift: ItineraryDrift): boolean {
  return drift.reason === "dates_changed" && Boolean(drift.neededStart);
}
