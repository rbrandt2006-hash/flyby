/**
 * Travel Search Endpoint
 * 
 * Searches for travel options based on user queries.
 * Generates realistic mock flight, hotel, and ground transport data.
 * 
 * Security features:
 * - Rate limiting (30 requests/minute per IP)
 * - Input validation and sanitization
 * - Query length limits
 * - No sensitive data exposure
 * 
 * @see SECURITY.md for configuration details
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import {
  getCorsHeaders,
  getResponseHeaders,
  checkRateLimit,
  getClientIP,
  rateLimitedResponse,
  errorResponse,
  successResponse,
  sanitizeString,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

// Maximum query length for security
const MAX_QUERY_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_CODE_LENGTH = 10;

// ============================================================================
// DATA GENERATION UTILITIES
// ============================================================================

const AIRLINES_DATABASE = [
  { code: "AA", name: "American Airlines", logo: "🦅" },
  { code: "DL", name: "Delta Air Lines", logo: "🔺" },
  { code: "UA", name: "United Airlines", logo: "🌐" },
  { code: "WN", name: "Southwest Airlines", logo: "❤️" },
  { code: "B6", name: "JetBlue Airways", logo: "💙" },
  { code: "AS", name: "Alaska Airlines", logo: "🏔️" },
  { code: "NK", name: "Spirit Airlines", logo: "💛" },
  { code: "F9", name: "Frontier Airlines", logo: "🦌" },
  { code: "HA", name: "Hawaiian Airlines", logo: "🌺" },
  { code: "BA", name: "British Airways", logo: "🇬🇧" },
  { code: "LH", name: "Lufthansa", logo: "🇩🇪" },
  { code: "AF", name: "Air France", logo: "🇫🇷" },
  { code: "KL", name: "KLM", logo: "🇳🇱" },
  { code: "EK", name: "Emirates", logo: "🇦🇪" },
  { code: "QR", name: "Qatar Airways", logo: "🇶🇦" },
  { code: "SQ", name: "Singapore Airlines", logo: "🇸🇬" },
  { code: "CX", name: "Cathay Pacific", logo: "🇭🇰" },
  { code: "JL", name: "Japan Airlines", logo: "🇯🇵" },
  { code: "NH", name: "All Nippon Airways", logo: "🇯🇵" },
  { code: "QF", name: "Qantas", logo: "🇦🇺" },
];

const HOTEL_CHAINS = [
  "Marriott", "Hilton", "Hyatt", "IHG", "Wyndham", "Best Western",
  "Choice Hotels", "AccorHotels", "Radisson", "Four Seasons",
  "Ritz-Carlton", "St. Regis", "W Hotels", "Westin", "Sheraton",
];

const HOTEL_SUFFIXES = ["Hotel", "Suites", "Resort", "Inn", "Lodge", "Plaza"];
const AREAS = ["Downtown", "Midtown", "Financial District", "Airport", "Convention Center"];
const AMENITIES_POOL = [
  "Free Wi-Fi", "Gym", "Pool", "Spa", "Restaurant", "Bar",
  "Room Service", "Business Center", "Free Breakfast", "Pet Friendly",
];

const GROUND_PROVIDERS = [
  { type: "Rideshare", provider: "Uber", basePrice: 25, tags: ["Convenient", "Popular"] },
  { type: "Rideshare", provider: "Lyft", basePrice: 23, tags: ["Best value", "Reliable"] },
  { type: "Rental Car", provider: "Hertz", basePrice: 55, tags: ["Flexibility", "Popular"] },
  { type: "Rental Car", provider: "Enterprise", basePrice: 50, tags: ["Great service"] },
  { type: "Public Transit", provider: "Metro", basePrice: 5, tags: ["Budget", "Eco-friendly"] },
  { type: "Taxi", provider: "Yellow Cab", basePrice: 35, tags: ["Traditional", "Metered"] },
];

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: number;
  stopCity?: string;
  price: number;
  priceDiff: number;
  tags: string[];
  origin: string;
  destination: string;
  flightNumber: string;
}

function generateFlights(query: string, origin: string, dest: string): Flight[] {
  const queryLower = query.toLowerCase();

  const matchingAirlines = AIRLINES_DATABASE.filter(airline =>
    airline.name.toLowerCase().includes(queryLower) ||
    airline.code.toLowerCase().includes(queryLower)
  );

  const airlines = matchingAirlines.length > 0 ? matchingAirlines : AIRLINES_DATABASE.slice(0, 15);

  const departureTimes = ["6:00 AM", "7:30 AM", "9:00 AM", "10:30 AM", "12:00 PM",
    "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM", "7:30 PM"];

  const flights: Flight[] = [];

  airlines.forEach((airline, i) => {
    const numFlights = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numFlights; j++) {
      const departIdx = (i * 2 + j) % departureTimes.length;
      const basePrice = 180 + Math.floor(Math.random() * 400);
      const stops = Math.random() < 0.6 ? 0 : Math.random() < 0.8 ? 1 : 2;
      const baseDuration = 120 + Math.floor(Math.random() * 180);
      const duration = baseDuration + stops * 90;

      const tags: string[] = [];
      if (stops === 0) tags.push("Nonstop");
      if (basePrice < 250) tags.push("Budget");
      if (basePrice > 450) tags.push("Premium");
      if (i === 0 && j === 0) tags.push("Recommended");

      const durationHours = Math.floor(duration / 60);
      const durationMins = duration % 60;

      flights.push({
        id: `fl-${airline.code}-${i}-${j}`,
        airline: airline.name,
        airlineLogo: airline.logo,
        departTime: departureTimes[departIdx],
        arriveTime: `${(parseInt(departureTimes[departIdx]) + durationHours) % 12 || 12}:${durationMins.toString().padStart(2, "0")} PM`,
        duration: `${durationHours}h ${durationMins}m`,
        stops,
        stopCity: stops > 0 ? ["DEN", "ORD", "ATL", "DFW", "CLT"][Math.floor(Math.random() * 5)] : undefined,
        price: basePrice,
        priceDiff: i === 0 ? 0 : basePrice - (flights[0]?.price || 0),
        tags,
        origin: origin || "SFO",
        destination: dest || "JFK",
        flightNumber: `${airline.code}${100 + Math.floor(Math.random() * 900)}`,
      });
    }
  });

  return flights.sort((a, b) => {
    if (a.tags.includes("Recommended")) return -1;
    if (b.tags.includes("Recommended")) return 1;
    return a.price - b.price;
  }).slice(0, 50);
}

interface Hotel {
  id: string;
  name: string;
  area: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  distanceToVenue: string;
  tags: string[];
  amenities: string[];
  reviewCount: number;
  city: string;
}

function generateHotels(query: string, city: string): Hotel[] {
  const queryLower = query.toLowerCase();

  const matchingChains = HOTEL_CHAINS.filter(chain =>
    chain.toLowerCase().includes(queryLower)
  );

  const chains = matchingChains.length > 0 ? matchingChains : HOTEL_CHAINS;

  const hotels: Hotel[] = [];
  let id = 0;

  chains.forEach((chain, chainIdx) => {
    const numProperties = Math.floor(Math.random() * 4) + 1;

    for (let j = 0; j < numProperties; j++) {
      const suffix = HOTEL_SUFFIXES[Math.floor(Math.random() * HOTEL_SUFFIXES.length)];
      const area = AREAS[Math.floor(Math.random() * AREAS.length)];
      const basePrice = 100 + Math.floor(Math.random() * 400);
      const rating = 3.5 + Math.random() * 1.5;
      const distance = (0.1 + Math.random() * 2).toFixed(1);

      const numAmenities = 4 + Math.floor(Math.random() * 6);
      const amenities = [...AMENITIES_POOL]
        .sort(() => Math.random() - 0.5)
        .slice(0, numAmenities);

      const tags: string[] = [];
      if (chainIdx === 0 && j === 0) tags.push("Recommended");
      if (basePrice < 150) tags.push("Budget friendly");
      if (basePrice > 350) tags.push("Luxury");
      if (parseFloat(distance) < 0.5) tags.push("Closest");
      if (rating > 4.5) tags.push("Top rated");

      hotels.push({
        id: `ht-${id++}`,
        name: `${chain} ${suffix}`,
        area,
        pricePerNight: basePrice,
        totalPrice: basePrice * 2,
        rating: parseFloat(rating.toFixed(1)),
        distanceToVenue: `${distance} mi`,
        tags,
        amenities,
        reviewCount: 500 + Math.floor(Math.random() * 3000),
        city: city || "San Francisco",
      });
    }
  });

  return hotels.sort((a, b) => {
    if (a.tags.includes("Recommended")) return -1;
    if (b.tags.includes("Recommended")) return 1;
    return a.pricePerNight - b.pricePerNight;
  }).slice(0, 100);
}

interface Ground {
  id: string;
  type: string;
  provider: string;
  price: number;
  description: string;
  tags: string[];
}

function generateGround(query: string, city: string): Ground[] {
  const queryLower = query.toLowerCase();

  let filtered = GROUND_PROVIDERS;
  if (queryLower.length > 0) {
    const matches = GROUND_PROVIDERS.filter(g =>
      g.provider.toLowerCase().includes(queryLower) ||
      g.type.toLowerCase().includes(queryLower)
    );
    if (matches.length > 0) filtered = matches;
  }

  return filtered.map((g, i) => ({
    id: `ground-${i}`,
    type: g.type,
    provider: g.provider,
    price: g.basePrice + Math.floor(Math.random() * 15) - 5,
    description: g.type === "Rental Car"
      ? "Per day rate, compact car"
      : `Estimated fare from airport to ${city || "city center"}`,
    tags: i === 0 ? ["Recommended", ...g.tags] : g.tags,
  }));
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const clientIP = getClientIP(req);

  try {
    // ========================================================================
    // RATE LIMITING
    // ========================================================================
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.SEARCH);
    if (!rateLimitResult.allowed) {
      logAudit(createAuditLog(req, "search_rate_limited", undefined, false, { ip: clientIP }));
      return rateLimitedResponse(req, rateLimitResult);
    }

    // ========================================================================
    // INPUT VALIDATION - Sanitize all query parameters
    // ========================================================================
    const url = new URL(req.url);
    const searchType = sanitizeString(url.searchParams.get("type"), 20) || "all";
    const query = sanitizeString(url.searchParams.get("q"), MAX_QUERY_LENGTH) || "";
    const city = sanitizeString(url.searchParams.get("city"), MAX_CITY_LENGTH) || "";
    const origin = sanitizeString(url.searchParams.get("origin"), MAX_CODE_LENGTH) || "";
    const dest = sanitizeString(url.searchParams.get("dest"), MAX_CODE_LENGTH) || "";
    const checkIn = sanitizeString(url.searchParams.get("checkIn"), 10) || "";
    const checkOut = sanitizeString(url.searchParams.get("checkOut"), 10) || "";
    const date = sanitizeString(url.searchParams.get("date"), 10) || "";

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (checkIn && !dateRegex.test(checkIn)) {
      return errorResponse(req, 400, "Invalid check-in date format. Use YYYY-MM-DD.");
    }
    if (checkOut && !dateRegex.test(checkOut)) {
      return errorResponse(req, 400, "Invalid check-out date format. Use YYYY-MM-DD.");
    }
    if (date && !dateRegex.test(date)) {
      return errorResponse(req, 400, "Invalid date format. Use YYYY-MM-DD.");
    }

    // Validate search type
    const validTypes = ["flights", "hotels", "ground", "all"];
    if (!validTypes.includes(searchType)) {
      return errorResponse(req, 400, "Invalid search type. Use: flights, hotels, ground, or all.");
    }

    console.log(`[Search] type=${searchType}, query=${query.slice(0, 30) || "(empty)"}, city=${city || "(any)"}`);

    // ========================================================================
    // GENERATE SEARCH RESULTS
    // ========================================================================
    let results: Record<string, unknown> = {};

    switch (searchType) {
      case "flights":
        results = {
          flights: generateFlights(query, origin, dest),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;

      case "hotels":
        results = {
          hotels: generateHotels(query, city),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;

      case "ground":
        results = {
          ground: generateGround(query, city),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;

      case "all":
      default:
        results = {
          flights: generateFlights(query, origin, dest).slice(0, 10),
          hotels: generateHotels(query, city).slice(0, 10),
          ground: generateGround(query, city),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;
    }

    logAudit(createAuditLog(req, "search_success", undefined, true));

    return successResponse(req, results);

  } catch (error) {
    console.error("[Search] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "search_error", undefined, false));
    return errorResponse(req, 500, "Search failed. Please try again.");
  }
});
