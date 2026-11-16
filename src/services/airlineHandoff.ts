/**
 * Flights on airlines Flyby can't sell.
 *
 * United isn't offered by our flight provider, so its flights never appear in
 * search. Rather than leave travelers thinking United doesn't fly the route,
 * Flyby hands them to united.com with their search filled in. They book and pay
 * there, with their own card, and then bring the booking back: Flyby saves it
 * to the trip with United's confirmation code and files the expense.
 *
 * Flyby does not see United's fares and never shows a United price of its own.
 */

import { authedFetch, backend } from "@/integrations/backend/client";

/** The search to carry over to the airline's site, and the trip it belongs to. */
export interface HandoffSearch {
  origin: string;        // IATA code
  destination: string;   // IATA code
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD; absent for a one-way
  passengers?: number;
  /** "Newark, United States" — what the trip is called once saved. */
  destinationLabel: string;
  purpose?: string;
}

/** A flight the traveler booked on the airline's own site. */
export interface ExternalBooking {
  confirmationCode: string;
  airline: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate: string; // YYYY-MM-DD
  departTime?: string;
  arrivalTime?: string;
  stops?: number;
  returnFlightNumber?: string;
  returnDate?: string;
  returnDepartTime?: string;
  returnArrivalTime?: string;
  totalPaid: number;
  currency: string;
}

export const UNITED = { name: "United Airlines", code: "UA", site: "united.com" } as const;

/** Where a booking made on the airline's site is recorded as having been paid. */
export const bookedOnSite = (site: string) => `Booked on ${site}`;

/** united.com's flight results for this search. */
export function unitedSearchUrl(search: HandoffSearch): string {
  const roundTrip = Boolean(search.returnDate);
  const params = new URLSearchParams({
    f: search.origin,
    t: search.destination,
    d: search.departureDate,
    ...(roundTrip ? { r: search.returnDate as string } : { tt: "1" }),
    sc: roundTrip ? "7,7" : "7",
    px: String(Math.max(1, search.passengers ?? 1)),
    taxng: "1",
    newHP: "True",
    clm: "7",
    st: "bestmatches",
    tqp: "R",
  });
  return `https://www.united.com/en/us/fsr/choose-flights?${params.toString()}`;
}

/**
 * Read a pasted confirmation email. Returns only the details found in the text
 * — an empty object when nothing could be read — or null when the reader
 * couldn't be reached, so the form can say which it was.
 */
export async function readConfirmation(text: string): Promise<Partial<ExternalBooking> | null> {
  if (!backend.getCurrentSession()) return null;
  try {
    const response = await authedFetch("/functions/v1/parse-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.booking && typeof body.booking === "object" ? body.booking : {};
  } catch {
    return null;
  }
}
