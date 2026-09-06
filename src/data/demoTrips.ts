// SINGLE SOURCE OF TRUTH for demo trips.
//
// All four demo-data consumers read from this module so the same trip names,
// destinations, travelers, dates and costs show up consistently:
//   - getDemoTrips() in src/hooks/useTrips.ts (seeded LocalTrips)
//   - "Upcoming high-cost trips" widget on src/pages/Dashboard.tsx
//   - mockPendingApprovals & mockTopDestinations on src/pages/AdminDashboard.tsx
//   - getTripSpendData() in src/components/home/TripSpendSlideOver.tsx
//   - AI Expense Insights strings in src/components/expenses/AIExpenseInsights.tsx
//
// Trip *names* here also match the `tripName` values used in
// src/components/expenses/demoExpenseData.ts, so expense rows tie back to
// real demo trips.

import { demoExpenses } from "@/components/expenses/demoExpenseData";

function relDateISO(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function fmtDateRange(startOffset: number, endOffset: number): string {
  const fmt = (off: number) =>
    new Date(Date.now() + off * 86400000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return `${fmt(startOffset)}–${fmt(endOffset)}`;
}

export interface DemoTripSeed {
  id: string;
  /** Display name — also the `tripName` used in demoExpenseData rows. */
  name: string;
  destination: string;
  /** Origin → destination short route label, e.g. "SFO → SEA". */
  route: string;
  origin: string;
  originAirport: string;
  destinationAirport: string;
  purpose: string;
  /** Traveler name — matches `employee` names in demoExpenseData. */
  traveler: string;
  travelerInitials: string;
  startOffsetDays: number;
  endOffsetDays: number;
  estimatedCost: number;
  airline: string;
  flightNumber: string;
  departTime: string;
  returnTime: string;
  hotelName: string;
  hotelLocation: string;
  expenses: {
    airfare: number;
    hotel: number;
    meals: number;
    transport: number;
    misc: number;
  };
}

// A SINGLE sample trip, kept on purpose.
//
// Everything else fake has been removed from Flyby. This one booked trip exists
// so the rebooking flow can be exercised end-to-end — pick "Rebook" on it and a
// live flight search runs for this exact route and date — without having to pay
// for a real ticket first. It carries a full flight (airline, number, both
// airports, price) because that is what Rebook reads.
export const DEMO_TRIPS: DemoTripSeed[] = [
  {
    id: "demo_sample_booked_trip",
    name: "Sample Booked Trip",
    destination: "New York, NY",
    route: "SFO \u2192 JFK",
    origin: "San Francisco, CA",
    originAirport: "SFO",
    destinationAirport: "JFK",
    purpose: "Sample trip for testing rebooking",
    traveler: "You",
    travelerInitials: "YO",
    startOffsetDays: 18,
    endOffsetDays: 22,
    estimatedCost: 640,
    airline: "Delta Air Lines",
    flightNumber: "DL422",
    departTime: "7:30 AM",
    returnTime: "6:15 PM",
    hotelName: "The Standard High Line",
    hotelLocation: "Meatpacking, NYC",
    expenses: { airfare: 312, hotel: 328, meals: 0, transport: 0, misc: 0 },
  },
];

/** Lookup a seed trip by id. */
export function getDemoTripSeed(id: string): DemoTripSeed | undefined {
  return DEMO_TRIPS.find((t) => t.id === id);
}

/** Lookup a seed trip by its display name (used to bridge expense rows). */
export function getDemoTripSeedByName(name: string): DemoTripSeed | undefined {
  return DEMO_TRIPS.find((t) => t.name === name);
}

/** Top N most expensive demo trips, sorted desc. */
export function getTopHighCostDemoTrips(n = 2): DemoTripSeed[] {
  return [...DEMO_TRIPS].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, n);
}

/** Aggregate demo expenses (from demoExpenseData) by destination city. */
export function getDemoTopDestinations(): { city: string; count: number; spend: number }[] {
  const map = new Map<string, { count: number; spend: number }>();
  for (const t of DEMO_TRIPS) {
    map.set(t.destination, { count: 0, spend: 0 });
  }
  for (const t of DEMO_TRIPS) {
    const entry = map.get(t.destination)!;
    entry.count += 1;
    // Sum any matching expense rows for this trip name.
    const tripSpend = demoExpenses
      .filter((e) => e.tripName === t.name)
      .reduce((s, e) => s + e.amount, 0);
    entry.spend += tripSpend || t.estimatedCost;
  }
  return Array.from(map.entries())
    .map(([city, v]) => ({ city, ...v }))
    .sort((a, b) => b.spend - a.spend);
}

/** Total demo spend by trip name (sum of matching expense rows). */
export function getDemoSpendByTripName(name: string): number {
  return demoExpenses.filter((e) => e.tripName === name).reduce((s, e) => s + e.amount, 0);
}

/** Date helpers re-exported for consumers. */
export const demoDate = {
  iso: relDateISO,
  range: fmtDateRange,
};
