/**
 * Real flight search + booking via the backend's Duffel integration.
 *
 * `searchRealFlights` returns live airline offers mapped into the app's `Flight`
 * shape, or `null` when Duffel is unavailable (no token, backend down, no
 * results) so callers fall back to the local generator — search never breaks.
 *
 * Each returned flight's `id` is the Duffel **offer id**, which is what
 * `bookRealFlight` needs to create a real order. Offers expire, so book (or
 * re-search) reasonably soon after searching.
 */

import type { Flight, FlightRanking } from "@/components/flights/FlightResults";
import { authedFetch, backend } from "@/integrations/backend/client";

// Carrier code → emoji, matching the look of the local generator (the flight
// row renders the logo as text). Real Duffel logos are URLs; a stable emoji
// keeps the row rendering cleanly without a broken image.
const AIRLINE_EMOJI: Record<string, string> = {
  AA: "🦅", DL: "🔺", UA: "🌐", WN: "❤️", B6: "💙", AS: "🏔️", NK: "💛",
  F9: "🦌", HA: "🌺", BA: "🇬🇧", LH: "🇩🇪", AF: "🇫🇷", KL: "🇳🇱", EK: "🇦🇪",
  QR: "🇶🇦", SQ: "🇸🇬", CX: "🇭🇰", JL: "🇯🇵", NH: "🇯🇵", QF: "🇦🇺", AC: "🍁",
};

export interface DuffelOffer {
  id: string;
  passengerIds?: string[];
  expiresAt?: string;
  airline: string;
  airlineCode: string;
  airlineLogo?: string;
  flightNumber: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: number;
  stopCity?: string | null;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  cabinClass: string;
  arriveDayOffset?: number;
  stopCities?: string[];
  tripType?: "one_way" | "round_trip";
  returnFlightNumber?: string;
  returnDepartTime?: string;
  returnArriveTime?: string;
  returnArriveDayOffset?: number;
  returnDuration?: string;
  returnStops?: number;
  returnStopCities?: string[];
  returnOrigin?: string;
  returnDestination?: string;
  identityDocumentsRequired?: boolean;
  fareBrand?: string | null;
  changeable?: boolean | null;
  refundable?: boolean | null;
  ranking?: FlightRanking;
}

/**
 * What a search should take into account when ranking: what the traveler asked
 * for and what the trip requires. Their saved preferences, loyalty programs and
 * company policy are added by the backend from their account.
 */
export interface FlightSearchContext {
  /** Ask Gemini to make the final call among the top few, and explain it. */
  advise?: boolean;
  /** The request as typed, for the advisor to read. */
  requestText?: string;
  purpose?: string;
  /** What they're going for — "3 PM board meeting", "Acme QBR". */
  commitment?: string;
  maxBudget?: number;
  preferNonstop?: boolean;
  maxStops?: number;
  departWindow?: TimeWindow;
  returnWindow?: TimeWindow;
  /** Destination-local "YYYY-MM-DDTHH:MM" they must be there by. */
  arriveBy?: string;
  /** Destination-local time their commitment ends. */
  leaveAfter?: string;
  avoidRedEye?: boolean;
  airline?: string;
  /** Preferences Flyby has learned on this device, used when none are saved. */
  preferredAirlines?: string[];
  avoidLayovers?: boolean;
  /**
   * Other dates to price the same trip on, at the same time (two at most).
   * Sent when the traveler gave no dates and Flyby had to suggest some.
   */
  alsoCheck?: Array<{ departureDate: string; returnDate?: string }>;
}

/** The best real fare for the same trip on other dates. */
export interface DateOption {
  departureDate: string; // YYYY-MM-DD
  returnDate?: string | null;
  price: number;
  currency: string;
  airline?: string | null;
  stops: number;
  returnStops?: number | null;
}

/** Other dates on which the trip costs meaningfully less than the ones shown. */
export interface DateHint {
  option: DateOption;
  /** How many days later (or, negative, earlier) those dates are. */
  days: number;
  /** What the pick costs on the dates shown, minus what it costs on those. */
  saving: number;
  /** "Dec 6 – 9" */
  label: string;
}

export type TimeWindow = "early_morning" | "morning" | "afternoon" | "evening" | "night";

/** The search as a whole, as the ranking saw it. */
export interface RankingSummary {
  considered: number;
  shown: number;
  eligible: number;
  /** What was required — "Be there by 3:00 PM on Tue Dec 8". */
  requirements: string[];
  /** Things worth telling the traveler — "No flight on this date lands in time…". */
  notes: string[];
  /** Requirements that no flight at all could meet ("arriveBy", "maxBudget"…). */
  unmet: string[];
  bestId?: string | null;
  cheapestId?: string | null;
  fastestId?: string | null;
}

/** Why the first flight is the pick. */
export interface FlightAdvice {
  /** "gemini" when Flyby AI made and explained the call; "rules" for the ranking's own explanation. */
  engine: "gemini" | "rules";
  pickId: string;
  headline: string;
  why: string[];
  tradeoff?: string | null;
  tip?: string | null;
  notes?: string[];
}

export interface SearchFlightParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
  // Optional carrier filter (name or IATA code, e.g. "emirates" / "EK"). When
  // set, the backend re-queries live inventory and returns only that airline.
  airline?: string;
  /**
   * Rank the results for this traveler and trip instead of returning them
   * cheapest-first. An older backend ignores it and answers as before.
   */
  context?: FlightSearchContext;
}

function mapToFlight(o: DuffelOffer): Flight {
  return {
    id: o.id, // Duffel offer id — used to book
    airline: o.airline,
    airlineLogo: AIRLINE_EMOJI[o.airlineCode] || "✈️",
    flightNumber: o.flightNumber || o.airlineCode,
    departureTime: o.departTime,
    arrivalTime: o.arriveTime,
    duration: o.duration,
    stops: o.stops,
    stopCity: o.stopCity || undefined,
    price: Math.round(o.price),
    cabinClass: o.cabinClass || "economy",
    origin: o.origin,
    destination: o.destination,
    co2Emissions: "", // Duffel doesn't return this on the basic offer
    arriveDayOffset: o.arriveDayOffset || 0,
    stopCities: o.stopCities || (o.stopCity ? [o.stopCity] : []),
    tripType: o.tripType || "one_way",
    returnFlightNumber: o.returnFlightNumber,
    returnDepartureTime: o.returnDepartTime,
    returnArrivalTime: o.returnArriveTime,
    returnArriveDayOffset: o.returnArriveDayOffset,
    returnDuration: o.returnDuration,
    returnStops: o.returnStops,
    returnStopCities: o.returnStopCities,
    returnOrigin: o.returnOrigin,
    returnDestination: o.returnDestination,
    identityDocumentsRequired: Boolean(o.identityDocumentsRequired),
    fareBrand: o.fareBrand || undefined,
    changeable: typeof o.changeable === "boolean" ? o.changeable : undefined,
    refundable: typeof o.refundable === "boolean" ? o.refundable : undefined,
    ranking: o.ranking && typeof o.ranking === "object"
      ? {
          eligible: o.ranking.eligible !== false,
          badges: Array.isArray(o.ranking.badges) ? o.ranking.badges : [],
          issues: Array.isArray(o.ranking.issues) ? o.ranking.issues : [],
          notes: Array.isArray(o.ranking.notes) ? o.ranking.notes : [],
          pluses: Array.isArray(o.ranking.pluses) ? o.ranking.pluses : [],
        }
      : undefined,
  };
}

/** Why a live flight search produced nothing, so the UI can say what happened. */
export type FlightSearchFailure = "no_results" | "unreachable";

export interface FlightSearchOutcome {
  /** Live flights, or null when none could be returned. */
  flights: Flight[] | null;
  /** Set only when `flights` is null. */
  reason?: FlightSearchFailure;
  /**
   * True when a return date was asked for but the airlines sold nothing as a
   * round trip, so these are outbound-only fares and the return still needs
   * booking.
   */
  returnUnavailable?: boolean;
  /** Present when the backend ranked the results (see `SearchFlightParams.context`). */
  ranking?: RankingSummary;
  advice?: FlightAdvice;
  /** The same trip priced on the other dates asked about (`context.alsoCheck`). */
  dateOptions?: DateOption[];
}

/**
 * Search real flights and report WHY when nothing comes back.
 *
 * "no_results" means the provider answered but has no flights for this route or
 * date; "unreachable" means we couldn't get an answer at all. Conflating the two
 * made a genuinely empty route look like a network outage.
 */
export async function searchRealFlightsDetailed(
  params: SearchFlightParams,
): Promise<FlightSearchOutcome> {
  if (!backend.getCurrentSession()) return { flights: null, reason: "unreachable" };
  if (!params.origin || !params.destination || !params.departureDate) {
    return { flights: null, reason: "unreachable" };
  }

  try {
    const response = await authedFetch("/api/duffel/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) return { flights: null, reason: "unreachable" };

    const body = await response.json();
    // The backend reports source "unavailable" when it couldn't reach the
    // provider, and "duffel" with an empty list when the route/date is simply
    // empty — two different things worth telling the traveler apart.
    if (body?.source !== "duffel") return { flights: null, reason: "unreachable" };
    if (!Array.isArray(body.offers) || body.offers.length === 0) {
      return { flights: null, reason: "no_results" };
    }
    const ranked = body.ranking && typeof body.ranking === "object";
    return {
      flights: (body.offers as DuffelOffer[]).map(mapToFlight),
      returnUnavailable: Boolean(body.returnUnavailable),
      ranking: ranked ? {
        considered: Number(body.ranking.considered) || 0,
        shown: Number(body.ranking.shown) || 0,
        eligible: Number(body.ranking.eligible) || 0,
        requirements: Array.isArray(body.ranking.requirements) ? body.ranking.requirements : [],
        notes: Array.isArray(body.ranking.notes) ? body.ranking.notes : [],
        unmet: Array.isArray(body.ranking.unmet) ? body.ranking.unmet : [],
        bestId: body.ranking.bestId, cheapestId: body.ranking.cheapestId, fastestId: body.ranking.fastestId,
      } : undefined,
      advice: ranked && body.advice?.pickId && body.advice?.headline ? {
        engine: body.advice.engine === "gemini" ? "gemini" : "rules",
        pickId: String(body.advice.pickId),
        headline: String(body.advice.headline),
        why: Array.isArray(body.advice.why) ? body.advice.why.map(String) : [],
        tradeoff: body.advice.tradeoff || null,
        tip: body.advice.tip || null,
        notes: Array.isArray(body.advice.notes) ? body.advice.notes.map(String) : [],
      } : undefined,
      dateOptions: Array.isArray(body.dateOptions)
        ? (body.dateOptions as DateOption[]).filter((o) => o && typeof o.price === "number" && o.price > 0 && /^\d{4}-\d{2}-\d{2}$/.test(o.departureDate))
        : undefined,
    };
  } catch {
    return { flights: null, reason: "unreachable" };
  }
}

/** Search real flights; null means none could be returned (nothing is generated instead). */
export async function searchRealFlights(params: SearchFlightParams): Promise<Flight[] | null> {
  return (await searchRealFlightsDetailed(params)).flights;
}

/** Re-fetch a single offer to confirm its live price + traveler count before booking. */
export async function authedOffer(offerId: string): Promise<DuffelOffer | null> {
  if (!backend.getCurrentSession() || !offerId) return null;
  try {
    const response = await authedFetch("/api/duffel/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId }),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.offer as DuffelOffer) ?? null;
  } catch {
    return null;
  }
}

export interface DuffelStatus {
  configured: boolean;
  live: boolean;
  bookingEnabled: boolean;
  maxBookingUsd: number;
}

/** Whether real search/booking are available, so the UI can label flights. */
export async function getDuffelStatus(): Promise<DuffelStatus | null> {
  if (!backend.getCurrentSession()) return null;
  try {
    const response = await authedFetch("/api/duffel/status");
    if (!response.ok) return null;
    return (await response.json()) as DuffelStatus;
  } catch {
    return null;
  }
}

/**
 * Get a Duffel component client key for the card form.
 *
 * Returns the key, or an error string when Duffel Payments isn't ready on the
 * account so the UI can explain why card entry is unavailable.
 */
export async function getComponentKey(): Promise<{ clientKey: string | null; error?: string }> {
  if (!backend.getCurrentSession()) return { clientKey: null, error: "not_signed_in" };
  try {
    const response = await authedFetch("/api/duffel/component-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) return { clientKey: null, error: "request_failed" };
    return await response.json();
  } catch {
    return { clientKey: null, error: "network_error" };
  }
}

export interface Passenger {
  given_name: string;
  family_name: string;
  born_on: string; // YYYY-MM-DD
  gender: "m" | "f";
  title: "mr" | "ms" | "mrs" | "miss" | "dr";
  email: string;
  phone_number: string;
  /** Sent only when the airline requires it for this fare. */
  identity_documents?: Array<{
    type: "passport";
    unique_identifier: string;
    issuing_country_code: string; // ISO 3166-1 alpha-2, e.g. "US"
    expires_on: string; // YYYY-MM-DD
  }>;
}

export interface BookingResult {
  ok: boolean;
  order?: {
    id: string;
    bookingReference: string;
    totalAmount: string;
    totalCurrency: string;
    /** The travelers on the ticket, as the airline recorded them. */
    passengers?: Array<{
      given_name?: string;
      family_name?: string;
      email?: string;
      phone_number?: string;
    }>;
  };
  error?: string;
  code?: string;
}

/**
 * Create a real flight order. **Charges real money on a live token.**
 *
 * The backend gates this: booking is off unless explicitly enabled, capped by a
 * max amount, and it re-prices the offer server-side. `confirm` must be true —
 * this should only be called after the traveler has reviewed the fare and
 * agreed. Returns a structured result; never throws.
 */
export async function bookRealFlight(
  offerId: string,
  passengers: Passenger[],
  threeDSecureSessionId?: string,
): Promise<BookingResult> {
  try {
    const response = await authedFetch("/api/duffel/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId, passengers, confirm: true, threeDSecureSessionId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: body?.error || "Booking failed.", code: body?.code };
    }
    return { ok: true, order: body.order };
  } catch {
    return { ok: false, error: "Couldn't reach the booking service." };
  }
}
