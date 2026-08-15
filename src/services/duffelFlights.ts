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

import type { Flight } from "@/components/flights/FlightResults";
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
  };
}

/** Search real flights; returns null to signal "fall back to the generator". */
export async function searchRealFlights(params: SearchFlightParams): Promise<Flight[] | null> {
  if (!backend.getCurrentSession()) return null;
  if (!params.origin || !params.destination || !params.departureDate) return null;

  try {
    const response = await authedFetch("/api/duffel/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) return null;

    const body = await response.json();
    if (body?.source !== "duffel" || !Array.isArray(body.offers) || body.offers.length === 0) {
      return null;
    }
    return (body.offers as DuffelOffer[]).map(mapToFlight);
  } catch {
    return null;
  }
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
}

export interface BookingResult {
  ok: boolean;
  order?: {
    id: string;
    bookingReference: string;
    totalAmount: string;
    totalCurrency: string;
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
