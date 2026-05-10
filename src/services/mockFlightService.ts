import type { Flight } from "@/components/flights/FlightResults";

const airlines = [
  { name: "Delta Air Lines", logo: "🔺", code: "DL" },
  { name: "United Airlines", logo: "🌐", code: "UA" },
  { name: "American Airlines", logo: "🦅", code: "AA" },
  { name: "Southwest Airlines", logo: "❤️", code: "WN" },
  { name: "JetBlue Airways", logo: "💙", code: "B6" },
  { name: "Alaska Airlines", logo: "🏔️", code: "AS" },
  { name: "Spirit Airlines", logo: "💛", code: "NK" },
  { name: "Frontier Airlines", logo: "🦌", code: "F9" },
];

const stopCities = ["DEN", "ORD", "DFW", "ATL", "CLT", "PHX", "MSP", "DTW"];

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
  
  // Base price varies by "distance" - use string length as a fun proxy
  const basePrice = 110 + (origin.length + destination.length) * 9;

  for (let i = 0; i < numFlights; i++) {
    const airline = airlines[randomBetween(0, airlines.length - 1)];
    const flightNumber = `${airline.code}${randomBetween(100, 9999)}`;
    
    // Generate departure time (5 AM to 10 PM)
    const depHour = randomBetween(5, 22);
    const depMinute = randomBetween(0, 11) * 5;
    
    // Duration based on stops
    const stops = randomBetween(0, 2);
    let baseDuration = randomBetween(120, 240); // 2-4 hours base
    if (stops === 1) baseDuration += randomBetween(60, 120);
    if (stops === 2) baseDuration += randomBetween(120, 180);
    
    // Calculate arrival time
    const totalMinutes = depHour * 60 + depMinute + baseDuration;
    const arrHour = Math.floor(totalMinutes / 60) % 24;
    const arrMinute = totalMinutes % 60;
    
    // Price varies based on time of day, stops, and cabin (per traveler)
    let price = basePrice * cabinMultiplier;
    if (depHour >= 6 && depHour <= 9) price *= 1.15; // Morning premium
    if (depHour >= 17 && depHour <= 19) price *= 1.1; // Evening premium
    if (stops === 0) price *= 1.2; // Nonstop premium
    if (stops === 2) price *= 0.75; // Discount for 2 stops
    
    // Add some randomness
    price *= 0.9 + Math.random() * 0.2;
    price = Math.round(price);
    
    // CO2 emissions (rough estimate)
    const co2Base = baseDuration * 0.15;
    const co2 = `${Math.round(co2Base)} kg CO₂`;

    flights.push({
      id: `flight-${i}-${Date.now()}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber,
      departureTime: formatTime(depHour, depMinute),
      arrivalTime: formatTime(arrHour, arrMinute),
      duration: formatDuration(baseDuration),
      stops,
      stopCity: stops > 0 ? stopCities[randomBetween(0, stopCities.length - 1)] : undefined,
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
