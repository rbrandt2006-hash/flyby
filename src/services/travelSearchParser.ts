// Natural Language Travel Search Parser
// Interprets user travel requests and converts them to structured parameters

import { findAirports, getMetroAreaAirports, resolveAmbiguousLocation, US_STATES, COUNTRY_ALIASES, type Airport } from "@/data/globalAirports";
import { getAirlinesForRoute, type Airline } from "@/data/globalAirlines";

export interface ParsedTravelRequest {
  origin?: {
    airports: Airport[];
    raw: string;
    inferred: boolean;
  };
  destination?: {
    airports: Airport[];
    raw: string;
    inferred: boolean;
  };
  dates?: {
    departure?: Date;
    return?: Date;
    flexible: boolean;
    raw: string;
    duration?: number; // in days
  };
  locationAnchor?: string; // e.g. "Chase Bank building"
  passengers?: number;
  tripType: "roundtrip" | "oneway" | "multicity" | "flexible";
  cabinClass?: "economy" | "premium" | "business" | "first";
  purpose?: "business" | "leisure" | "flexible";
  suggestedAirlines?: Airline[];
  clarificationsNeeded: ClarificationRequest[];
  confidence: number; // 0-100
  interpretation: string; // Human-readable summary
}

export interface ClarificationRequest {
  type: "origin" | "destination" | "dates" | "duration" | "ambiguous_location";
  question: string;
  options?: string[];
  context?: string;
}

// Month name patterns
const MONTHS = [
  { names: ["january", "jan"], index: 0 },
  { names: ["february", "feb"], index: 1 },
  { names: ["march", "mar"], index: 2 },
  { names: ["april", "apr"], index: 3 },
  { names: ["may"], index: 4 },
  { names: ["june", "jun"], index: 5 },
  { names: ["july", "jul"], index: 6 },
  { names: ["august", "aug"], index: 7 },
  { names: ["september", "sept", "sep"], index: 8 },
  { names: ["october", "oct"], index: 9 },
  { names: ["november", "nov"], index: 10 },
  { names: ["december", "dec"], index: 11 },
];

// Day of week patterns
const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Parse natural language travel request
export function parseTravelRequest(input: string): ParsedTravelRequest {
  const lowered = input.toLowerCase().trim();
  const clarifications: ClarificationRequest[] = [];
  let confidence = 100;
  
  // Extract destination
  const destination = extractDestination(lowered, input);
  if (!destination.airports.length) {
    clarifications.push({
      type: "destination",
      question: "Where would you like to travel to?",
    });
    confidence -= 30;
  }
  
  // Extract origin
  const origin = extractOrigin(lowered, input);
  if (!origin.airports.length) {
    clarifications.push({
      type: "origin", 
      question: "Where will you be departing from?",
    });
    confidence -= 20;
  }
  
  // Check for ambiguous locations
  if (destination.airports.length > 3) {
    clarifications.push({
      type: "ambiguous_location",
      question: `Which ${destination.raw} did you mean?`,
      options: destination.airports.slice(0, 5).map(a => `${a.city}, ${a.country} (${a.code})`),
    });
    confidence -= 15;
  }
  
  // Extract dates
  const dates = extractDates(lowered, input);
  if (!dates.departure && !dates.flexible) {
    clarifications.push({
      type: "dates",
      question: "When would you like to travel?",
    });
    confidence -= 15;
  }
  
  // Extract passengers
  const passengers = extractPassengers(lowered);
  
  // Extract trip type
  const tripType = extractTripType(lowered);
  
  // Extract cabin class
  const cabinClass = extractCabinClass(lowered);
  
  // Extract purpose
  const purpose = extractPurpose(lowered);
  
  // Get suggested airlines if we have origin and destination
  let suggestedAirlines: Airline[] = [];
  if (origin.airports.length && destination.airports.length) {
    suggestedAirlines = getAirlinesForRoute(
      origin.airports[0].code,
      destination.airports[0].code
    ).slice(0, 8);
  }
  
  // Build interpretation
  const interpretation = buildInterpretation({
    origin,
    destination,
    dates,
    passengers,
    tripType,
    cabinClass,
    purpose,
  });
  
  // Extract location anchor (e.g. "near the Chase Bank building")
  const anchorMatch = input.match(/\bnear\s+(?:the\s+)?([a-zA-Z0-9'’&.\s]+?)(?:[.,!?]|$)/i);
  const locationAnchor = anchorMatch ? anchorMatch[1].trim().replace(/\s+(building|tower|office|hq|headquarters)$/i, " $1") : undefined;

  return {
    origin: origin.airports.length ? origin : undefined,
    destination: destination.airports.length ? destination : undefined,
    dates: dates.departure || dates.flexible ? dates : undefined,
    locationAnchor,
    passengers,
    tripType,
    cabinClass,
    purpose,
    suggestedAirlines,
    clarificationsNeeded: clarifications,
    confidence: Math.max(0, confidence),
    interpretation,
  };
}

function extractDestination(lowered: string, original: string): { airports: Airport[]; raw: string; inferred: boolean } {
  // Common patterns for destination
  const patterns = [
    /(?:to|going to|fly(?:ing)? to|travel(?:ing)? to|headed to|heading to|visit(?:ing)?)\s+([a-zA-Z\s,]+?)(?:\s+(?:from|on|in|for|next|this|around|sometime|near|tomorrow|tonight)|$)/i,
    /(?:trip to|flight to|flights? to|book(?:ing)?\s+(?:a\s+)?(?:flight|trip)\s+to)\s+([a-zA-Z\s,]+?)(?:\s+(?:from|on|in|for|next|this|near|tomorrow|tonight)|$)/i,
    /(?:need to go to|want to go to|planning to go to)\s+([a-zA-Z\s,]+?)(?:\s+(?:from|on|in|for|near|tomorrow|tonight)|$)/i,
    /(?:anywhere warm|somewhere warm|beach|tropical)/i,
  ];
  
  for (const pattern of patterns) {
    const match = original.match(pattern);
    if (match && match[1]) {
      const locationStr = match[1].trim().replace(/[.,!?]$/, "");
      const airports = findAirports(locationStr);
      
      // Try metro area lookup
      if (airports.length === 0) {
        const metroAirports = getMetroAreaAirports(locationStr);
        if (metroAirports.length) {
          return { airports: metroAirports, raw: locationStr, inferred: false };
        }
      }
      
      // Try resolving ambiguous locations
      if (airports.length === 0) {
        const resolved = resolveAmbiguousLocation(locationStr);
        if (resolved.length) {
          return { airports: resolved, raw: locationStr, inferred: false };
        }
      }
      
      if (airports.length) {
        return { airports, raw: locationStr, inferred: false };
      }
    }
  }
  
  // Check for 3-letter airport codes directly
  const codeMatch = original.match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    const airports = findAirports(codeMatch[1]);
    if (airports.length) {
      return { airports, raw: codeMatch[1], inferred: false };
    }
  }
  
  // Look for city names anywhere in the text
  const cityPatterns = [
    /\b(new york|nyc|los angeles|la|chicago|san francisco|sf|london|paris|tokyo|singapore|dubai|sydney|melbourne|hong kong|bangkok|amsterdam|barcelona|rome|berlin|munich|madrid|lisbon|prague|vienna|budapest|miami|vegas|las vegas|seattle|boston|denver|atlanta|dallas|houston|phoenix|orlando|honolulu|maui|cancun|cabo|toronto|vancouver|montreal)\b/i,
  ];
  
  for (const pattern of cityPatterns) {
    const match = lowered.match(pattern);
    if (match) {
      const airports = findAirports(match[1]);
      if (airports.length) {
        return { airports, raw: match[1], inferred: true };
      }
    }
  }
  
  return { airports: [], raw: "", inferred: false };
}

function extractOrigin(lowered: string, original: string): { airports: Airport[]; raw: string; inferred: boolean } {
  // Common patterns for origin
  const patterns = [
    /(?:from|leaving from|departing from|out of|flying from)\s+([a-zA-Z\s,]+?)(?:\s+(?:to|on|in|for|next|this)|$)/i,
    /(?:starting in|based in|located in|i'm in|im in|currently in)\s+([a-zA-Z\s,]+?)(?:\s+(?:and|to|,)|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = original.match(pattern);
    if (match && match[1]) {
      const locationStr = match[1].trim().replace(/[.,!?]$/, "");
      const airports = findAirports(locationStr);
      
      if (airports.length === 0) {
        const metroAirports = getMetroAreaAirports(locationStr);
        if (metroAirports.length) {
          return { airports: metroAirports, raw: locationStr, inferred: false };
        }
      }
      
      if (airports.length) {
        return { airports, raw: locationStr, inferred: false };
      }
    }
  }
  
  return { airports: [], raw: "", inferred: false };
}

function extractDates(lowered: string, original: string): { departure?: Date; return?: Date; flexible: boolean; raw: string; duration?: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  let departure: Date | undefined;
  let returnDate: Date | undefined;
  let flexible = false;
  let duration: number | undefined;
  let raw = "";
  
  // Check for flexibility markers
  if (/(?:flexible|anytime|whenever|sometime|around|approximately)/i.test(lowered)) {
    flexible = true;
  }
  
  // Duration patterns
  const durationMatch = lowered.match(/(?:for|about|around)\s+(\d+)\s*(day|night|week)s?/i);
  if (durationMatch) {
    const num = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit === "week") {
      duration = num * 7;
    } else {
      duration = num;
    }
  }
  
  // Specific date patterns: "Jan 15", "January 15th", "1/15", "2025-01-15"
  const specificDatePattern = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/;
  const specificMatch = original.match(specificDatePattern);
  if (specificMatch) {
    const month = parseInt(specificMatch[1]) - 1;
    const day = parseInt(specificMatch[2]);
    let year = specificMatch[3] ? parseInt(specificMatch[3]) : currentYear;
    if (year < 100) year += 2000;
    
    departure = new Date(year, month, day);
    raw = specificMatch[0];
    
    // Look for return date
    const remaining = original.slice(original.indexOf(specificMatch[0]) + specificMatch[0].length);
    const returnMatch = remaining.match(specificDatePattern);
    if (returnMatch) {
      const rMonth = parseInt(returnMatch[1]) - 1;
      const rDay = parseInt(returnMatch[2]);
      let rYear = returnMatch[3] ? parseInt(returnMatch[3]) : year;
      if (rYear < 100) rYear += 2000;
      returnDate = new Date(rYear, rMonth, rDay);
    }
    
    return { departure, return: returnDate, flexible, raw, duration };
  }
  
  // Month patterns: "in March", "first week of August", "mid-January"
  for (const month of MONTHS) {
    const monthPattern = new RegExp(`(?:in|for|during|around)?\\s*(?:(early|mid|late|first week of|second week of|last week of|end of|beginning of)\\s+)?(${month.names.join("|")})`, "i");
    const monthMatch = lowered.match(monthPattern);
    
    if (monthMatch) {
      const modifier = monthMatch[1]?.toLowerCase();
      let year = currentYear;
      
      // If the month has passed, assume next year
      const testDate = new Date(year, month.index, 15);
      if (testDate < now) {
        year++;
      }
      
      // Determine day based on modifier
      let startDay = 15; // Default to mid-month
      if (modifier) {
        if (modifier.includes("early") || modifier.includes("beginning") || modifier.includes("first")) {
          startDay = 5;
        } else if (modifier.includes("late") || modifier.includes("end") || modifier.includes("last")) {
          startDay = 23;
        } else if (modifier.includes("mid") || modifier.includes("second")) {
          startDay = 15;
        }
      }
      
      departure = new Date(year, month.index, startDay);
      raw = monthMatch[0].trim();
      
      if (duration) {
        returnDate = new Date(departure);
        returnDate.setDate(returnDate.getDate() + duration);
      }
      
      return { departure, return: returnDate, flexible: true, raw, duration };
    }
  }
  
  // Relative patterns: "next week", "next Tuesday", "this weekend"
  const nextWeekMatch = lowered.match(/next\s+week/i);
  if (nextWeekMatch) {
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (8 - now.getDay()));
    departure = nextMonday;
    raw = nextWeekMatch[0];
    
    if (duration) {
      returnDate = new Date(departure);
      returnDate.setDate(returnDate.getDate() + duration);
    }
    
    return { departure, return: returnDate, flexible: true, raw, duration };
  }
  
  // Day of week pattern
  for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
    const dayPattern = new RegExp(`next\\s+${DAYS_OF_WEEK[i]}`, "i");
    if (dayPattern.test(lowered)) {
      const daysUntil = (i + 7 - now.getDay()) % 7 || 7;
      departure = new Date(now);
      departure.setDate(now.getDate() + daysUntil + 7); // "next" means the week after
      raw = `next ${DAYS_OF_WEEK[i]}`;
      
      if (duration) {
        returnDate = new Date(departure);
        returnDate.setDate(returnDate.getDate() + duration);
      }
      
      return { departure, return: returnDate, flexible: true, raw, duration };
    }
  }
  
  // "This weekend"
  if (/this\s+weekend/i.test(lowered)) {
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    departure = new Date(now);
    departure.setDate(now.getDate() + daysUntilSaturday);
    returnDate = new Date(departure);
    returnDate.setDate(returnDate.getDate() + 2);
    raw = "this weekend";
    duration = 2;
    
    return { departure, return: returnDate, flexible, raw, duration };
  }
  
  // Season patterns
  const seasonPatterns: Record<string, { start: number; end: number }> = {
    "spring": { start: 2, end: 4 },
    "summer": { start: 5, end: 7 },
    "fall|autumn": { start: 8, end: 10 },
    "winter": { start: 11, end: 1 },
  };
  
  for (const [season, months] of Object.entries(seasonPatterns)) {
    const seasonPattern = new RegExp(`(?:this|next)?\\s*${season}`, "i");
    if (seasonPattern.test(lowered)) {
      let year = currentYear;
      if (new Date(year, months.start, 15) < now) {
        year++;
      }
      departure = new Date(year, months.start, 15);
      raw = season.replace("|autumn", "");
      flexible = true;
      
      return { departure, return: returnDate, flexible, raw, duration };
    }
  }
  
  return { departure, return: returnDate, flexible, raw: "", duration };
}

function extractPassengers(lowered: string): number {
  // Look for explicit passenger count
  const passengerPatterns = [
    /(\d+)\s*(?:passenger|people|person|adult|traveler)s?/i,
    /for\s+(\d+)\s*(?:of us)?/i,
    /(?:party of|group of)\s+(\d+)/i,
    /(\d+)\s+(?:of us|tickets?)/i,
  ];
  
  for (const pattern of passengerPatterns) {
    const match = lowered.match(pattern);
    if (match) {
      return Math.min(parseInt(match[1]), 9);
    }
  }
  
  // Check for group indicators
  if (/(?:us|we|our\s+team|my\s+team|with\s+colleagues)/i.test(lowered)) {
    return 2; // Assume at least 2 for group travel
  }
  
  return 1; // Default
}

function extractTripType(lowered: string): "roundtrip" | "oneway" | "multicity" | "flexible" {
  if (/one[\s-]?way|single/i.test(lowered)) {
    return "oneway";
  }
  if (/multi[\s-]?city|multiple destinations|several cities/i.test(lowered)) {
    return "multicity";
  }
  if (/round[\s-]?trip|return/i.test(lowered)) {
    return "roundtrip";
  }
  return "roundtrip"; // Default
}

function extractCabinClass(lowered: string): "economy" | "premium" | "business" | "first" | undefined {
  if (/first\s*class|first\s*cabin/i.test(lowered)) {
    return "first";
  }
  if (/business\s*class|business\s*cabin/i.test(lowered)) {
    return "business";
  }
  if (/premium\s*economy|premium\s*cabin|extra\s*legroom/i.test(lowered)) {
    return "premium";
  }
  if (/economy|coach/i.test(lowered)) {
    return "economy";
  }
  return undefined; // No preference specified
}

function extractPurpose(lowered: string): "business" | "leisure" | "flexible" {
  if (/(?:business|work|meeting|conference|client|corporate)/i.test(lowered)) {
    return "business";
  }
  if (/(?:vacation|holiday|honeymoon|leisure|getaway|relax|beach|fun)/i.test(lowered)) {
    return "leisure";
  }
  return "flexible";
}

function buildInterpretation(params: {
  origin: { airports: Airport[]; raw: string; inferred: boolean };
  destination: { airports: Airport[]; raw: string; inferred: boolean };
  dates: { departure?: Date; return?: Date; flexible: boolean; raw: string; duration?: number };
  passengers: number;
  tripType: string;
  cabinClass?: string;
  purpose?: string;
}): string {
  const parts: string[] = [];
  
  // Origin
  if (params.origin.airports.length) {
    const originAirport = params.origin.airports[0];
    parts.push(`From ${originAirport.city} (${originAirport.code})`);
  }
  
  // Destination
  if (params.destination.airports.length) {
    const destAirport = params.destination.airports[0];
    const destStr = params.destination.airports.length > 1
      ? `${destAirport.city} area (${params.destination.airports.map(a => a.code).join(", ")})`
      : `${destAirport.city} (${destAirport.code})`;
    parts.push(`to ${destStr}`);
  }
  
  // Dates
  if (params.dates.departure) {
    const format = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const depStr = format.format(params.dates.departure);
    if (params.dates.return) {
      const retStr = format.format(params.dates.return);
      parts.push(`${depStr} – ${retStr}`);
    } else if (params.dates.duration) {
      parts.push(`${depStr} for ${params.dates.duration} days`);
    } else {
      parts.push(`around ${depStr}`);
    }
    if (params.dates.flexible) {
      parts.push("(flexible dates)");
    }
  }
  
  // Passengers
  if (params.passengers > 1) {
    parts.push(`for ${params.passengers} travelers`);
  }
  
  // Class
  if (params.cabinClass) {
    parts.push(`in ${params.cabinClass}`);
  }
  
  // Trip type
  if (params.tripType !== "roundtrip") {
    parts.push(`(${params.tripType})`);
  }
  
  return parts.join(" ") || "Tell me more about your trip";
}

// Smart defaults for missing information
export function applySmartDefaults(request: ParsedTravelRequest): ParsedTravelRequest {
  // If no date specified, suggest next available Tuesday-Thursday window (business travel default)
  if (!request.dates?.departure) {
    const now = new Date();
    const daysUntilTuesday = (2 - now.getDay() + 7) % 7 || 7;
    const departure = new Date(now);
    departure.setDate(now.getDate() + daysUntilTuesday + 7); // Next week's Tuesday
    
    const returnDate = new Date(departure);
    returnDate.setDate(departure.getDate() + 2); // Thursday
    
    request.dates = {
      departure,
      return: returnDate,
      flexible: true,
      raw: "next available week",
      duration: 2,
    };
  }
  
  // Default to economy if not specified
  if (!request.cabinClass) {
    request.cabinClass = "economy";
  }
  
  return request;
}
