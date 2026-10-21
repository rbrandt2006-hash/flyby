/**
 * Real hotels, through the backend's Duffel Stays integration.
 *
 * Search, rates and quotes are read-only. `bookHotel` creates a real
 * reservation and charges real money on a live token; the backend guards it the
 * same way it guards a flight order.
 *
 * Nothing here invents a hotel. When hotels can't be searched the result is
 * `null` with a reason, and the app shows none — a property that was never
 * searched for is a property nobody can check in to.
 */

import { authedFetch, backend } from "@/integrations/backend/client";
import type { HotelOption } from "@/components/chats/booking/types";

/** Why a hotel search produced nothing to show. */
export type HotelSearchFailure =
  /** The backend, or the hotel supplier, couldn't be reached. */
  | "unreachable"
  /** Hotel booking isn't switched on for this Duffel account. */
  | "not_enabled"
  /** The supplier answered and has nothing for these dates. */
  | "no_results"
  /** The destination couldn't be placed on a map to search around. */
  | "location_unknown"
  /** Same-day trip — no night to book. */
  | "day_trip";

export interface HotelSearchOutcome {
  hotels: HotelOption[] | null;
  reason?: HotelSearchFailure;
}

interface BackendHotel {
  id: string;
  name: string;
  area: string;
  address: string;
  chain: string | null;
  brand: string | null;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  dueAtAccommodation: number;
  nights: number;
  checkInDate: string;
  checkOutDate: string;
  starRating: number | null;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  description: string;
  distanceKm: number | null;
  distanceFrom: "city" | "airport" | null;
}

function toHotelOption(h: BackendHotel): HotelOption {
  const tags: string[] = [];
  if (h.starRating) tags.push(`${h.starRating}-star`);
  if (h.dueAtAccommodation > 0) tags.push("Fees at hotel");
  return {
    id: h.id,
    name: h.name,
    area: h.address || h.area,
    pricePerNight: Math.round(h.pricePerNight),
    totalPrice: h.totalPrice,
    rating: h.rating,
    // Says what it is measured from. It is never the distance to a meeting —
    // the supplier doesn't know where the meeting is.
    distanceToVenue: h.distanceKm != null
      ? `${(h.distanceKm * 0.621371).toFixed(1)} mi from the ${h.distanceFrom === "airport" ? "airport" : "city centre"}`
      : "",
    tags,
    images: h.images || [],
    amenities: h.amenities || [],
    reviewCount: h.reviewCount || 0,
    description: h.description || "",
    cancellationPolicy: "Cancellation terms depend on the room rate — you'll see them before you pay.",
    roomTypes: [],
    live: true,
    chain: h.chain,
    brand: h.brand,
    address: h.address,
    currency: h.currency,
    starRating: h.starRating,
    nights: h.nights,
    checkInDate: h.checkInDate,
    checkOutDate: h.checkOutDate,
    dueAtAccommodation: h.dueAtAccommodation,
  };
}

const REASONS: Record<string, HotelSearchFailure> = {
  not_enabled: "not_enabled",
  location_unknown: "location_unknown",
  invalid_dates: "day_trip",
};

/** Real hotels for a destination and dates, and WHY when there are none. */
export async function searchLiveHotels(params: {
  destinationCode: string;
  destinationCity?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests?: number;
}): Promise<HotelSearchOutcome> {
  if (!backend.getCurrentSession()) return { hotels: null, reason: "unreachable" };
  if (!params.destinationCode || !params.checkIn || !params.checkOut) {
    return { hotels: null, reason: "unreachable" };
  }
  if (params.checkOut <= params.checkIn) return { hotels: null, reason: "day_trip" };

  try {
    const response = await authedFetch("/api/stays/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) return { hotels: null, reason: "unreachable" };
    const body = await response.json();
    if (body?.source !== "duffel") {
      return { hotels: null, reason: REASONS[body?.reason] ?? "unreachable" };
    }
    if (!Array.isArray(body.hotels) || body.hotels.length === 0) {
      return { hotels: null, reason: "no_results" };
    }
    return { hotels: (body.hotels as BackendHotel[]).map(toHotelOption) };
  } catch {
    return { hotels: null, reason: "unreachable" };
  }
}

/** A sentence for the traveler explaining why no hotel is on the trip. */
export function hotelUnavailableMessage(reason?: HotelSearchFailure): string {
  switch (reason) {
    case "day_trip":
      return "Same-day trip, so there's no hotel night to book.";
    case "not_enabled":
      // Not one of the traveler's settings — the hotel supplier hasn't enabled
      // hotel booking for Flyby yet. The old wording ("for this account")
      // read as if the traveler had a switch to flip.
      return "Hotel booking isn't available in Flyby yet, so no hotel is included.";
    case "no_results":
      return "No hotels are available to book for these dates.";
    case "location_unknown":
      return "We couldn't locate this destination to search hotels around it.";
    default:
      return "Can't reach live hotel search right now, so no hotel is included.";
  }
}

// ---------------------------------------------------------------------------
// Rates, quote, booking
// ---------------------------------------------------------------------------

export interface HotelRate {
  id: string;
  roomName: string;
  boardType: string;
  totalPrice: number;
  currency: string;
  taxAmount: number | null;
  feeAmount: number | null;
  dueAtAccommodation: number;
  paymentType: string | null;
  /** ISO datetime until which a full refund is available; null = non-refundable. */
  refundableUntil: string | null;
  conditions: Array<{ title: string; description: string }>;
  quantityAvailable: number | null;
}

export interface HotelQuote {
  id: string;
  hotelName: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPrice: number;
  currency: string;
  taxAmount: number | null;
  feeAmount: number | null;
  dueAtAccommodation: number;
}

export interface HotelBooking {
  id: string;
  reference: string | null;
  status: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  totalPrice: number;
  currency: string;
  keyCollection?: string | null;
}

export interface HotelBookingResult {
  ok: boolean;
  booking?: HotelBooking;
  error?: string;
  code?: string;
}

async function post<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; body: T | null }> {
  try {
    const response = await authedFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = (await response.json().catch(() => null)) as T | null;
    return { ok: response.ok, status: response.status, body: parsed };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

/** The rooms and rates a hotel can actually be booked at, cheapest first. */
export async function fetchHotelRates(searchResultId: string): Promise<{ rates: HotelRate[]; error?: string }> {
  const res = await post<{ rates?: HotelRate[]; error?: string }>("/api/stays/rates", { searchResultId });
  if (!res.ok || !res.body) return { rates: [], error: "unreachable" };
  return { rates: res.body.rates || [], error: res.body.error };
}

/** Lock a rate and get its final price. Reserves nothing, charges nothing. */
export async function createHotelQuote(rateId: string): Promise<{ quote: HotelQuote | null; error?: string }> {
  const res = await post<{ quote?: HotelQuote | null; error?: string }>("/api/stays/quote", { rateId });
  if (!res.ok || !res.body) return { quote: null, error: "unreachable" };
  return { quote: res.body.quote ?? null, error: res.body.error };
}

/**
 * Reserve a quoted stay. **Charges real money on a live token.**
 *
 * Only call after the traveler has seen the final price and confirmed. Returns
 * a structured result; never throws.
 */
export async function bookHotel(params: {
  quoteId: string;
  guests: Array<{ given_name: string; family_name: string }>;
  email: string;
  phoneNumber: string;
  threeDSecureSessionId?: string;
}): Promise<HotelBookingResult> {
  const res = await post<{ booking?: HotelBooking; error?: string; code?: string }>(
    "/api/stays/book",
    { ...params, confirm: true },
  );
  if (res.status === 0) {
    return {
      ok: false,
      code: "network_error",
      error: "The connection dropped while reserving, so it's unclear whether the hotel accepted it. Check with the hotel before trying again.",
    };
  }
  if (!res.ok || !res.body?.booking) {
    return { ok: false, error: res.body?.error || "The reservation wasn't completed.", code: res.body?.code };
  }
  return { ok: true, booking: res.body.booking };
}
