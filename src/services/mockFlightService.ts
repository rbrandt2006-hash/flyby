import type { Flight } from "@/components/flights/FlightResults";
import { AIRPORTS } from "@/data/globalAirports";

// Domestic/short-haul carriers (used for same-country routes).
const domesticAirlines = [
  { name: "Delta Air Lines", logo: "🔺", code: "DL" },
  { name: "United Airlines", logo: "🌐", code: "UA" },
  { name: "American Airlines", logo: "🦅", code: "AA" },
  { name: "Southwest Airlines", logo: "❤️", code: "WN" },
  { name: "JetBlue Airways", logo: "💙", code: "B6" },
  { name: "Alaska Airlines", logo: "🏔️", code: "AS" },
];

// Long-haul / international carriers (used for intercontinental routes). Budget
// domestic carriers (Spirit, Frontier, Southwest) don't fly these, so they're
// intentionally excluded — a "Spirit nonstop to Tokyo" is exactly the kind of
// nonsense this fallback used to produce.
const internationalAirlines = [
  { name: "United Airlines", logo: "🌐", code: "UA" },
  { name: "Delta Air Lines", logo: "🔺", code: "DL" },
  { name: "American Airlines", logo: "🦅", code: "AA" },
  { name: "Japan Airlines", logo: "🇯🇵", code: "JL" },
  { name: "ANA", logo: "🗾", code: "NH" },
  { name: "Emirates", logo: "🇦🇪", code: "EK" },
  { name: "Qatar Airways", logo: "🇶🇦", code: "QR" },
  { name: "Singapore Airlines", logo: "🇸🇬", code: "SQ" },
  { name: "Lufthansa", logo: "🇩🇪", code: "LH" },
  { name: "British Airways", logo: "🇬🇧", code: "BA" },
  { name: "Air France", logo: "🇫🇷", code: "AF" },
  { name: "Cathay Pacific", logo: "🇭🇰", code: "CX" },
  { name: "Qantas", logo: "🇦🇺", code: "QF" },
  { name: "Turkish Airlines", logo: "🇹🇷", code: "TK" },
];

const stopCities = ["DEN", "ORD", "DFW", "ATL", "CLT", "PHX", "MSP", "DTW", "DXB", "DOH", "NRT", "ICN", "LHR", "FRA", "CDG"];

// Rough country → continent grouping, enough to tell a domestic hop from an
// intercontinental haul so the fallback picks sane durations, prices and
// carriers. Unknown countries fall back to a mid-range international estimate.
const CONTINENT_BY_COUNTRY: Record<string, string> = {
  "USA": "NA", "United States": "NA", "Canada": "NA", "Mexico": "NA",
  "Brazil": "SA", "Argentina": "SA", "Chile": "SA", "Peru": "SA", "Colombia": "SA",
  "UK": "EU", "United Kingdom": "EU", "Ireland": "EU", "France": "EU", "Germany": "EU",
  "Spain": "EU", "Portugal": "EU", "Italy": "EU", "Netherlands": "EU", "Belgium": "EU",
  "Switzerland": "EU", "Austria": "EU", "Sweden": "EU", "Norway": "EU", "Denmark": "EU",
  "Poland": "EU", "Greece": "EU", "Czech Republic": "EU", "Hungary": "EU",
  "UAE": "ME", "United Arab Emirates": "ME", "Qatar": "ME", "Saudi Arabia": "ME",
  "Israel": "ME", "Turkey": "ME", "Jordan": "ME",
  "Japan": "AS", "China": "AS", "South Korea": "AS", "Singapore": "AS", "Hong Kong": "AS",
  "Thailand": "AS", "India": "AS", "Malaysia": "AS", "Indonesia": "AS", "Vietnam": "AS",
  "Philippines": "AS", "Taiwan": "AS",
  "Australia": "OC", "New Zealand": "OC",
  "South Africa": "AF", "Egypt": "AF", "Morocco": "AF", "Kenya": "AF", "Nigeria": "AF",
};

const CODE_TO_AIRPORT = new Map(AIRPORTS.map((a) => [a.code, a]));

type Haul = "domestic" | "regional" | "longhaul";

// Classify a route so the generator can produce realistic numbers.
function classifyRoute(origin: string, destination: string): Haul {
  const o = CODE_TO_AIRPORT.get(origin);
  const d = CODE_TO_AIRPORT.get(destination);
  if (!o || !d) return "regional"; // unknown airport → safe middle estimate
  if (o.country === d.country) return "domestic";
  const co = CONTINENT_BY_COUNTRY[o.country];
  const cd = CONTINENT_BY_COUNTRY[d.country];
  if (co && cd && co === cd) return "regional";
  return "longhaul";
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getCabinClassName(cabin: string): string {
  const cabinMap: Record<string, string> = {
    economy: "Economy",
    premium: "Premium Economy",
    business: "Business Class",
    first: "First Class",
  };
  return cabinMap[cabin] || "Economy";
}

function getBasePriceMultiplier(cabin: string): number {
  const multipliers: Record<string, number> = {
    economy: 1,
    premium: 1.4,
    business: 2.2,
    first: 3.2,
  };
  return multipliers[cabin] || 1;
}

export function generateMockFlights(
  origin: string,
  destination: string,
  cabinClass: string,
  passengers: number
): Flight[] {
  const numFlights = randomBetween(6, 10);
  const flights: Flight[] = [];
  const cabinMultiplier = getBasePriceMultiplier(cabinClass);

  // Route-aware model so the fallback is plausible instead of "3h nonstop to
  // Tokyo": pick the carrier pool, flight-time range, stop likelihood and base
  // price from whether this is a domestic hop, a same-continent regional flight,
  // or an intercontinental haul.
  const haul = classifyRoute(origin, destination);
  const pool = haul === "domestic" ? domesticAirlines : internationalAirlines;
  const profile = {
    domestic: { min: 75, max: 360, base: 180, maxStops: 1, longThreshold: 300 },
    regional: { min: 90, max: 300, base: 260, maxStops: 1, longThreshold: 240 },
    longhaul: { min: 480, max: 960, base: 850, maxStops: 2, longThreshold: 720 },
  }[haul];

  for (let i = 0; i < numFlights; i++) {
    const airline = pool[randomBetween(0, pool.length - 1)];
    const flightNumber = `${airline.code}${randomBetween(100, 9999)}`;

    // Generate departure time (5 AM to 10 PM)
    const depHour = randomBetween(5, 22);
    const depMinute = randomBetween(0, 11) * 5;

    // Nonstop flight time for this route, then add time for each connection.
    const nonstopMinutes = randomBetween(profile.min, profile.max);
    // Longer routes are more likely to connect; short ones are usually nonstop.
    const stopRoll = Math.random();
    const stops =
      nonstopMinutes > profile.longThreshold
        ? (stopRoll < 0.5 ? 1 : stopRoll < 0.5 + 0.3 ? 2 : 0)
        : (stopRoll < 0.7 ? 0 : 1);
    const cappedStops = Math.min(stops, profile.maxStops);
    let baseDuration = nonstopMinutes;
    if (cappedStops === 1) baseDuration += randomBetween(70, 150);
    if (cappedStops === 2) baseDuration += randomBetween(160, 300);

    // Calculate arrival time (may roll past midnight on long hauls)
    const totalMinutes = depHour * 60 + depMinute + baseDuration;
    const arrHour = Math.floor(totalMinutes / 60) % 24;
    const arrMinute = totalMinutes % 60;

    // Price scales with the route's base fare, cabin, stops and time of day.
    let price = profile.base * cabinMultiplier;
    if (depHour >= 6 && depHour <= 9) price *= 1.1; // Morning premium
    if (depHour >= 17 && depHour <= 19) price *= 1.08; // Evening premium
    if (cappedStops === 0) price *= 1.15; // Nonstop premium
    if (cappedStops === 2) price *= 0.8; // Discount for 2 stops
    price *= 0.85 + Math.random() * 0.4; // spread
    price = Math.round(price);

    // CO2 emissions (rough estimate)
    const co2 = `${Math.round(baseDuration * 0.15)} kg CO₂`;

    flights.push({
      id: `flight-${i}-${Date.now()}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber,
      departureTime: formatTime(depHour, depMinute),
      arrivalTime: formatTime(arrHour, arrMinute),
      duration: formatDuration(baseDuration),
      stops: cappedStops,
      stopCity: cappedStops > 0 ? stopCities[randomBetween(0, stopCities.length - 1)] : undefined,
      price,
      cabinClass: getCabinClassName(cabinClass),
      origin,
      destination,
      co2Emissions: co2,
    });
  }

  // Sort and mark special flights
  flights.sort((a, b) => a.price - b.price);
  if (flights.length > 0) {
    flights[0].isLowest = true;
  }
  
  // Find fastest flight
  const fastest = flights.reduce((prev, curr) => {
    const prevDuration = parseInt(prev.duration);
    const currDuration = parseInt(curr.duration);
    return currDuration < prevDuration ? curr : prev;
  });
  fastest.isFastest = true;

  return flights;
}
