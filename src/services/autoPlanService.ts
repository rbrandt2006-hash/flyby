// Auto-plan service: given a calendar event + user preferences, builds a complete
// proposed trip draft (flight + hotel + total cost + "why I picked this" rationale)
// using the same data sources as the manual TripPlanningModal flow.

import type { CalendarEvent } from "@/services/mockCalendarService";
import type { TravelPreferences } from "@/hooks/usePreferences";
import { generateFlightOptions } from "@/services/mockFlightGenerator";
import { getHotelsForDestination } from "@/services/mockHotelService";
import type { FlightOption } from "@/components/trips/FlightSelectionPage";
import type { HotelOption } from "@/components/chats/booking/types";

export interface AutoPlanDraft {
  destination: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  purpose: string;
  flight: {
    airline: string;
    departTime: string;
    returnTime: string;
    flightNumber?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    arrivalTime?: string;
    duration?: string;
    stops?: number;
    price?: number;
    emissions?: string;
  };
  hotel: { name: string; location: string } | null;
  estimatedCost: number;
  rationale: string;
  sourceCalendarEventId: string;
  sourceCalendarEventTitle: string;
  selectedFlightRaw: FlightOption;
  selectedHotelRaw: HotelOption | null;
}

function nightsBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

/**
 * Sort flights respecting user preferences:
 *  - Preferred airlines first
 *  - If avoidsLayovers: nonstop first
 *  - If costSensitive: cheaper first
 *  - If prefersEarlyFlights: earlier depart first
 */
function rankFlights(flights: FlightOption[], prefs: TravelPreferences): FlightOption[] {
  const parseTime = (t: string): number => {
    // "8:15 AM" -> minutes since midnight
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const pm = m[3].toUpperCase() === "PM";
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    return h * 60 + min;
  };
  return [...flights].sort((a, b) => {
    const aPref = prefs.preferredAirlines.some(p => a.airline.toLowerCase().includes(p.toLowerCase())) ? 1 : 0;
    const bPref = prefs.preferredAirlines.some(p => b.airline.toLowerCase().includes(p.toLowerCase())) ? 1 : 0;
    if (aPref !== bPref) return bPref - aPref;
    if (prefs.avoidsLayovers && a.stops !== b.stops) return a.stops - b.stops;
    if (prefs.costSensitive && a.price !== b.price) return a.price - b.price;
    if (prefs.prefersEarlyFlights) return parseTime(a.departTime) - parseTime(b.departTime);
    return a.price - b.price;
  });
}

function rankHotels(hotels: HotelOption[], prefs: TravelPreferences): HotelOption[] {
  return [...hotels].sort((a, b) => {
    const aPref = prefs.preferredHotelBrands.some(p => a.name.toLowerCase().includes(p.toLowerCase())) ? 1 : 0;
    const bPref = prefs.preferredHotelBrands.some(p => b.name.toLowerCase().includes(p.toLowerCase())) ? 1 : 0;
    if (aPref !== bPref) return bPref - aPref;
    if (prefs.costSensitive && a.pricePerNight !== b.pricePerNight) return a.pricePerNight - b.pricePerNight;
    return b.rating - a.rating;
  });
}

function buildRationale(
  event: CalendarEvent,
  flight: FlightOption,
  hotel: HotelOption | null,
  prefs: TravelPreferences,
  total: number,
  nights: number
): string {
  const lines: string[] = [];

  // Flight rationale
  const flightReasons: string[] = [];
  if (prefs.preferredAirlines.some(p => flight.airline.toLowerCase().includes(p.toLowerCase()))) {
    flightReasons.push(`${flight.airline} is one of your preferred airlines`);
  }
  if (flight.stops === 0) flightReasons.push("nonstop");
  else flightReasons.push(`${flight.stops} stop${flight.stops > 1 ? "s" : ""}`);
  flightReasons.push(`departs ${flight.departTime}`);
  flightReasons.push(`$${flight.price}`);
  lines.push(`Flight: picked ${flight.airline}${flight.flightNumber ? ` ${flight.flightNumber}` : ""} — ${flightReasons.join(", ")}.`);

  // Hotel rationale
  if (hotel) {
    const hotelReasons: string[] = [];
    if (prefs.preferredHotelBrands.some(p => hotel.name.toLowerCase().includes(p.toLowerCase()))) {
      hotelReasons.push(`${hotel.name.split(" ")[0]} is one of your preferred brands`);
    }
    hotelReasons.push(`${hotel.distanceToVenue} to venue`);
    hotelReasons.push(`${hotel.rating}★`);
    hotelReasons.push(`$${hotel.pricePerNight}/night × ${nights}`);
    lines.push(`Hotel: picked ${hotel.name} — ${hotelReasons.join(", ")}.`);
  }

  // Policy / budget
  const budget = prefs.budgetPerDay * nights;
  if (budget > 0) {
    const verdict = total <= budget ? "within" : "above";
    lines.push(`Total ~$${total.toLocaleString()} for ${nights} day${nights !== 1 ? "s" : ""} — ${verdict} your $${prefs.budgetPerDay}/day budget.`);
  }

  lines.push(`Generated automatically from your calendar event "${event.title}".`);
  return lines.join(" ");
}

export function buildAutoDraftFromEvent(
  event: CalendarEvent,
  preferences: TravelPreferences
): AutoPlanDraft {
  const nights = nightsBetween(event.startDate, event.endDate);
  const destination = event.location || event.title;

  // Flights
  const flights = generateFlightOptions({ destination, numFlights: 20 });
  const ranked = rankFlights(flights, preferences);
  const flight = ranked[0];

  // Hotels
  const hotels = getHotelsForDestination({ destination, nights });
  const rankedHotels = rankHotels(hotels, preferences);
  const hotel = rankedHotels[0] || null;

  const flightPrice = flight?.price ?? 0;
  const hotelPrice = hotel?.totalPrice ?? 0;
  const estimatedCost = flightPrice + hotelPrice;

  const rationale = buildRationale(event, flight, hotel, preferences, estimatedCost, nights);

  // Convert event dates (YYYY-MM-DD) to ISO
  const startISO = new Date(event.startDate).toISOString();
  const endISO = new Date(event.endDate).toISOString();

  return {
    destination,
    startDate: startISO,
    endDate: endISO,
    purpose: event.title,
    flight: {
      airline: flight.airline,
      departTime: flight.departTime,
      returnTime: flight.returnDepartTime || flight.arriveTime,
      flightNumber: flight.flightNumber,
      departureAirport: flight.origin,
      arrivalAirport: flight.destination,
      arrivalTime: flight.arriveTime,
      duration: flight.duration,
      stops: flight.stops,
      price: flight.price,
      emissions: flight.co2Emissions,
    },
    hotel: hotel ? { name: hotel.name, location: hotel.area } : null,
    estimatedCost,
    rationale,
    sourceCalendarEventId: event.id,
    sourceCalendarEventTitle: event.title,
    selectedFlightRaw: flight,
    selectedHotelRaw: hotel,
  };
}
