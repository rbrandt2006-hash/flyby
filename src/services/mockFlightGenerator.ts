import type { FlightOption } from "@/components/trips/FlightSelectionPage";

const airlines = [
  { name: "Delta", logo: "🔷", code: "DL" },
  { name: "United", logo: "🌐", code: "UA" },
  { name: "American", logo: "🦅", code: "AA" },
  { name: "Southwest", logo: "❤️", code: "WN" },
  { name: "JetBlue", logo: "💙", code: "B6" },
  { name: "Alaska", logo: "🏔️", code: "AS" },
  { name: "Spirit", logo: "💛", code: "NK" },
  { name: "Frontier", logo: "🦌", code: "F9" },
];

const stopCities = ["DEN", "ORD", "DFW", "ATL", "CLT", "PHX", "MSP", "DTW", "SEA", "LAX"];

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

export interface GenerateFlightsOptions {
  origin?: string;
  destination?: string;
  isRoundTrip?: boolean;
  numFlights?: number;
  basePrice?: number;
}

/**
 * Generate a robust list of mock flight options with multiple airlines,
 * varied times, prices, and stops for a realistic flight selection experience.
 */
export function generateFlightOptions(options: GenerateFlightsOptions = {}): FlightOption[] {
  const {
    origin = "ORD",
    destination = "SFO",
    isRoundTrip = true,
    numFlights = 20,
    basePrice = 260,
  } = options;

  const flights: FlightOption[] = [];
  const usedTimes = new Set<string>();

  // Ensure at least one flight from each airline
  for (let i = 0; i < numFlights; i++) {
    // Cycle through airlines to ensure variety
    const airlineIndex = i < airlines.length ? i : randomBetween(0, airlines.length - 1);
    const airline = airlines[airlineIndex];
    const flightNumber = `${airline.code}${randomBetween(100, 9999)}`;

    // Generate departure time (5 AM to 10 PM) avoiding duplicates
    let depHour: number;
    let depMinute: number;
    let timeKey: string;
    let attempts = 0;
    do {
      depHour = randomBetween(5, 22);
      depMinute = randomBetween(0, 11) * 5;
      timeKey = `${airline.name}-${depHour}-${depMinute}`;
      attempts++;
    } while (usedTimes.has(timeKey) && attempts < 10);
    usedTimes.add(timeKey);

    // Stops - bias towards nonstop for major carriers
    const isLowCost = ["Spirit", "Frontier"].includes(airline.name);
    const stops = isLowCost
      ? randomBetween(0, 2)
      : Math.random() > 0.6
      ? 0
      : randomBetween(1, 2);

    // Duration based on stops
    let baseDuration = randomBetween(140, 280);
    if (stops === 1) baseDuration += randomBetween(45, 90);
    if (stops === 2) baseDuration += randomBetween(90, 150);

    // Calculate arrival time
    const totalMinutes = depHour * 60 + depMinute + baseDuration;
    const arrHour = Math.floor(totalMinutes / 60) % 24;
    const arrMinute = totalMinutes % 60;

    // Price calculation
    let price = basePrice;

    // Time of day premiums
    if (depHour >= 6 && depHour <= 9) price *= 1.15; // Morning premium
    if (depHour >= 17 && depHour <= 19) price *= 1.1; // Evening premium
    if (depHour >= 5 && depHour <= 6) price *= 0.85; // Red-eye discount
    if (depHour >= 21) price *= 0.9; // Late night discount

    // Stops adjustments
    if (stops === 0) price *= 1.2; // Nonstop premium
    if (stops === 1) price *= 1.0;
    if (stops === 2) price *= 0.78; // Discount for 2 stops

    // Airline adjustments
    if (isLowCost) price *= 0.7; // Budget carrier discount
    if (["Delta", "United", "American"].includes(airline.name)) price *= 1.05; // Premium carrier

    // Add randomness
    price *= 0.9 + Math.random() * 0.2;
    price = Math.round(price);

    // Return flight times (if round trip)
    let returnDepartTime: string | undefined;
    let returnArriveTime: string | undefined;
    if (isRoundTrip) {
      const returnDepHour = randomBetween(14, 21);
      const returnDepMinute = randomBetween(0, 11) * 5;
      const returnDuration = baseDuration + randomBetween(-30, 30);
      const returnArrTotalMinutes = returnDepHour * 60 + returnDepMinute + returnDuration;
      const returnArrHour = Math.floor(returnArrTotalMinutes / 60) % 24;
      const returnArrMinute = returnArrTotalMinutes % 60;
      returnDepartTime = formatTime(returnDepHour, returnDepMinute);
      returnArriveTime = formatTime(returnArrHour, returnArrMinute);
    }

    // CO2 emissions estimate
    const co2 = `${Math.round(baseDuration * 0.12)} kg`;

    // Tags
    const tags: string[] = [];

    flights.push({
      id: `fl-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber,
      departTime: formatTime(depHour, depMinute),
      arriveTime: formatTime(arrHour, arrMinute),
      returnDepartTime,
      returnArriveTime,
      duration: formatDuration(baseDuration),
      stops,
      stopCity: stops > 0 ? stopCities[randomBetween(0, stopCities.length - 1)] : undefined,
      price,
      tags,
      origin,
      destination,
      co2Emissions: co2,
    });
  }

  // Sort by price to identify special flights
  flights.sort((a, b) => a.price - b.price);

  // Mark cheapest
  if (flights.length > 0) {
    flights[0].tags.push("Cheapest");
  }

  // Mark fastest (nonstop with shortest duration)
  const nonstopFlights = flights.filter((f) => f.stops === 0);
  if (nonstopFlights.length > 0) {
    const fastest = nonstopFlights.reduce((prev, curr) => {
      const prevDur = parseDuration(prev.duration);
      const currDur = parseDuration(curr.duration);
      return currDur < prevDur ? curr : prev;
    });
    if (!fastest.tags.includes("Cheapest")) {
      fastest.tags.push("Fastest");
    }
  }

  // Mark recommended (good balance of price and convenience)
  const midPriceFlights = flights.filter(
    (f) => f.stops === 0 && !f.tags.includes("Cheapest") && !f.tags.includes("Fastest")
  );
  if (midPriceFlights.length > 0) {
    // Pick one with a reasonable morning/afternoon time
    const recommended = midPriceFlights.find((f) => {
      const hour = parseTimeHour(f.departTime);
      return hour >= 7 && hour <= 11;
    }) || midPriceFlights[0];
    recommended.tags.unshift("Recommended");
  } else if (flights.length > 0 && !flights[0].tags.includes("Recommended")) {
    // Fallback: mark cheapest as recommended too
    if (flights[0].stops === 0) {
      flights[0].tags.unshift("Recommended");
    }
  }

  // Add additional descriptive tags
  flights.forEach((flight) => {
    if (flight.stops === 0 && !flight.tags.includes("Nonstop")) {
      flight.tags.push("Nonstop");
    }
    const hour = parseTimeHour(flight.departTime);
    if (hour >= 5 && hour < 7 && !flight.tags.some((t) => t.includes("Early"))) {
      flight.tags.push("Early departure");
    }
    if (hour >= 12 && hour < 17 && !flight.tags.some((t) => t.includes("Afternoon"))) {
      flight.tags.push("Afternoon");
    }
  });

  return flights;
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)h\s*(\d+)?m?/);
  if (match) {
    return (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
  }
  return 999;
}

function parseTimeHour(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const period = match[3]?.toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours;
  }
  return 12;
}

/**
 * Pre-built static flight options for demos and quick loading.
 * These are curated to show a good variety.
 */
export const staticFlightOptions: FlightOption[] = [
  {
    id: "fl-static-1",
    airline: "United",
    airlineLogo: "🌐",
    flightNumber: "UA1234",
    departTime: "8:00 AM",
    arriveTime: "10:30 AM",
    returnDepartTime: "5:30 PM",
    returnArriveTime: "10:00 PM",
    duration: "2h 30m",
    stops: 0,
    price: 420,
    tags: ["Recommended", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "18 kg",
  },
  {
    id: "fl-static-2",
    airline: "Delta",
    airlineLogo: "🔷",
    flightNumber: "DL567",
    departTime: "6:30 AM",
    arriveTime: "9:45 AM",
    returnDepartTime: "6:00 PM",
    returnArriveTime: "11:15 PM",
    duration: "3h 15m",
    stops: 0,
    price: 380,
    tags: ["Cheapest", "Early departure", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "23 kg",
  },
  {
    id: "fl-static-3",
    airline: "American",
    airlineLogo: "🦅",
    flightNumber: "AA890",
    departTime: "10:15 AM",
    arriveTime: "1:00 PM",
    returnDepartTime: "4:30 PM",
    returnArriveTime: "9:45 PM",
    duration: "2h 45m",
    stops: 0,
    price: 455,
    tags: ["Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "20 kg",
  },
  {
    id: "fl-static-4",
    airline: "Southwest",
    airlineLogo: "❤️",
    flightNumber: "WN1122",
    departTime: "7:00 AM",
    arriveTime: "11:30 AM",
    returnDepartTime: "3:00 PM",
    returnArriveTime: "9:30 PM",
    duration: "4h 30m",
    stops: 1,
    stopCity: "DEN",
    price: 290,
    tags: ["Budget"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "32 kg",
  },
  {
    id: "fl-static-5",
    airline: "Alaska",
    airlineLogo: "🏔️",
    flightNumber: "AS334",
    departTime: "2:00 PM",
    arriveTime: "4:30 PM",
    returnDepartTime: "7:00 PM",
    returnArriveTime: "11:30 PM",
    duration: "2h 30m",
    stops: 0,
    price: 410,
    tags: ["Afternoon", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "18 kg",
  },
  {
    id: "fl-static-6",
    airline: "JetBlue",
    airlineLogo: "💙",
    flightNumber: "B6789",
    departTime: "12:30 PM",
    arriveTime: "5:45 PM",
    returnDepartTime: "8:00 PM",
    returnArriveTime: "1:15 AM",
    duration: "5h 15m",
    stops: 1,
    stopCity: "BOS",
    price: 315,
    tags: ["Extra legroom available"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "38 kg",
  },
  {
    id: "fl-static-7",
    airline: "Spirit",
    airlineLogo: "💛",
    flightNumber: "NK456",
    departTime: "5:45 AM",
    arriveTime: "11:00 AM",
    returnDepartTime: "2:00 PM",
    returnArriveTime: "9:15 PM",
    duration: "5h 15m",
    stops: 1,
    stopCity: "ATL",
    price: 189,
    tags: ["Budget", "Early departure"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "38 kg",
  },
  {
    id: "fl-static-8",
    airline: "Frontier",
    airlineLogo: "🦌",
    flightNumber: "F9123",
    departTime: "9:00 PM",
    arriveTime: "2:30 AM",
    returnDepartTime: "11:00 AM",
    returnArriveTime: "6:30 PM",
    duration: "5h 30m",
    stops: 1,
    stopCity: "DEN",
    price: 175,
    tags: ["Budget"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "40 kg",
  },
  {
    id: "fl-static-9",
    airline: "Delta",
    airlineLogo: "🔷",
    flightNumber: "DL2345",
    departTime: "11:00 AM",
    arriveTime: "1:35 PM",
    returnDepartTime: "5:00 PM",
    returnArriveTime: "9:35 PM",
    duration: "2h 35m",
    stops: 0,
    price: 445,
    tags: ["Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "19 kg",
  },
  {
    id: "fl-static-10",
    airline: "United",
    airlineLogo: "🌐",
    flightNumber: "UA5678",
    departTime: "3:30 PM",
    arriveTime: "6:15 PM",
    returnDepartTime: "8:30 PM",
    returnArriveTime: "1:15 AM",
    duration: "2h 45m",
    stops: 0,
    price: 398,
    tags: ["Afternoon", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "20 kg",
  },
  {
    id: "fl-static-11",
    airline: "American",
    airlineLogo: "🦅",
    flightNumber: "AA1111",
    departTime: "7:30 AM",
    arriveTime: "12:45 PM",
    returnDepartTime: "4:00 PM",
    returnArriveTime: "11:15 PM",
    duration: "5h 15m",
    stops: 1,
    stopCity: "DFW",
    price: 325,
    tags: [],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "38 kg",
  },
  {
    id: "fl-static-12",
    airline: "Southwest",
    airlineLogo: "❤️",
    flightNumber: "WN2233",
    departTime: "1:00 PM",
    arriveTime: "3:30 PM",
    returnDepartTime: "6:30 PM",
    returnArriveTime: "11:00 PM",
    duration: "2h 30m",
    stops: 0,
    price: 365,
    tags: ["Afternoon", "Nonstop"],
    origin: "ORD",
    destination: "SFO",
    co2Emissions: "18 kg",
  },
];
