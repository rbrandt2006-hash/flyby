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

export const DEMO_TRIPS: DemoTripSeed[] = [
  {
    id: "demo_nyc_q1_planning",
    name: "NYC Q1 Planning",
    destination: "New York, NY",
    route: "SFO → JFK",
    origin: "San Francisco, CA",
    originAirport: "SFO",
    destinationAirport: "JFK",
    purpose: "Quarterly planning offsite",
    traveler: "Priya Patel",
    travelerInitials: "PP",
    startOffsetDays: 18,
    endOffsetDays: 22,
    estimatedCost: 2180,
    airline: "Delta Air Lines",
    flightNumber: "DL422",
    departTime: "7:30 AM",
    returnTime: "6:15 PM",
    hotelName: "The Standard High Line",
    hotelLocation: "Meatpacking, NYC",
    expenses: { airfare: 312, hotel: 1280, meals: 380, transport: 158, misc: 50 },
  },
  {
    id: "demo_sf_tech_summit",
    name: "SF Tech Summit",
    destination: "San Francisco, CA",
    route: "SEA → SFO",
    origin: "Seattle, WA",
    originAirport: "SEA",
    destinationAirport: "SFO",
    purpose: "Annual tech conference",
    traveler: "Sarah Kim",
    travelerInitials: "SK",
    startOffsetDays: 10,
    endOffsetDays: 13,
    estimatedCost: 1850,
    airline: "Alaska Airlines",
    flightNumber: "AS344",
    departTime: "8:15 AM",
    returnTime: "5:30 PM",
    hotelName: "Hotel Zetta",
    hotelLocation: "SoMa, San Francisco",
    expenses: { airfare: 348, hotel: 980, meals: 280, transport: 142, misc: 100 },
  },
  {
    id: "demo_boston_investor",
    name: "Boston Investor Meeting",
    destination: "Boston, MA",
    route: "JFK → BOS",
    origin: "New York, NY",
    originAirport: "JFK",
    destinationAirport: "BOS",
    purpose: "Investor meeting",
    traveler: "Alex Rivera",
    travelerInitials: "AR",
    startOffsetDays: 28,
    endOffsetDays: 30,
    estimatedCost: 1720,
    airline: "JetBlue Airways",
    flightNumber: "B6612",
    departTime: "9:00 AM",
    returnTime: "7:45 PM",
    hotelName: "The Liberty Hotel",
    hotelLocation: "Beacon Hill, Boston",
    expenses: { airfare: 247, hotel: 820, meals: 410, transport: 168, misc: 75 },
  },
  {
    id: "demo_chicago_client",
    name: "Chicago Client Visit",
    destination: "Chicago, IL",
    route: "LGA → ORD",
    origin: "New York, NY",
    originAirport: "LGA",
    destinationAirport: "ORD",
    purpose: "Client visit",
    traveler: "Julia Chen",
    travelerInitials: "JC",
    startOffsetDays: 35,
    endOffsetDays: 38,
    estimatedCost: 1560,
    airline: "American Airlines",
    flightNumber: "AA1812",
    departTime: "10:20 AM",
    returnTime: "4:50 PM",
    hotelName: "Hilton Chicago",
    hotelLocation: "South Loop, Chicago",
    expenses: { airfare: 268, hotel: 744, meals: 320, transport: 138, misc: 90 },
  },
  {
    id: "demo_seattle_partnership",
    name: "Seattle Partnership",
    destination: "Seattle, WA",
    route: "SFO → SEA",
    origin: "San Francisco, CA",
    originAirport: "SFO",
    destinationAirport: "SEA",
    purpose: "Partner meeting",
    traveler: "Marcus Johnson",
    travelerInitials: "MJ",
    startOffsetDays: 45,
    endOffsetDays: 48,
    estimatedCost: 1420,
    airline: "Alaska Airlines",
    flightNumber: "AS1423",
    departTime: "8:15 AM",
    returnTime: "5:30 PM",
    hotelName: "The Edgewater Hotel",
    hotelLocation: "Downtown, Seattle",
    expenses: { airfare: 264, hotel: 720, meals: 250, transport: 116, misc: 70 },
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
