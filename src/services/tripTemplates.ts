// Destination aliases and mock itinerary templates

export interface DestinationTemplate {
  city: string;
  aliases: string[];
  airlines: string[];
  hotels: { name: string; locations: string[] }[];
  groundTransport: string;
  baseCost: number;
}

export const destinationTemplates: DestinationTemplate[] = [
  {
    city: "Washington, DC",
    aliases: ["washington dc", "washington d.c.", "washington", "dc", "d.c."],
    airlines: ["United Airlines", "American Airlines", "Delta Air Lines"],
    hotels: [
      { name: "The Willard InterContinental", locations: ["Near White House", "Downtown DC"] },
      { name: "Marriott Marquis Washington", locations: ["Near Convention Center", "Downtown"] },
      { name: "Hyatt Regency Capitol Hill", locations: ["Near Capitol", "Capitol Hill"] },
    ],
    groundTransport: "Metro/Uber recommended - $15-35 from DCA, $50-70 from IAD",
    baseCost: 1650,
  },
  {
    city: "New York City",
    aliases: ["new york city", "new york", "nyc", "manhattan", "brooklyn"],
    airlines: ["Delta Air Lines", "JetBlue Airways", "American Airlines"],
    hotels: [
      { name: "The Peninsula New York", locations: ["Near Times Square", "Midtown"] },
      { name: "Four Seasons Downtown", locations: ["Near Wall Street", "Financial District"] },
      { name: "The Langham Fifth Avenue", locations: ["Near Central Park", "Midtown East"] },
    ],
    groundTransport: "Taxi/Uber recommended - $50-70 from JFK, $30-45 from LGA",
    baseCost: 2100,
  },
  {
    city: "Chicago",
    aliases: ["chicago", "ord", "chi-town"],
    airlines: ["United Airlines", "American Airlines", "Southwest Airlines"],
    hotels: [
      { name: "The Langham Chicago", locations: ["Near Magnificent Mile", "River North"] },
      { name: "Four Seasons Chicago", locations: ["Near Navy Pier", "Streeterville"] },
      { name: "Hyatt Regency Chicago", locations: ["Near Millennium Park", "The Loop"] },
    ],
    groundTransport: "CTA Blue Line or Uber - $2.50 train / $35-50 rideshare from ORD",
    baseCost: 1450,
  },
  {
    city: "Seattle",
    aliases: ["seattle", "sea"],
    airlines: ["Alaska Airlines", "Delta Air Lines", "United Airlines"],
    hotels: [
      { name: "Four Seasons Seattle", locations: ["Near Pike Place", "Downtown"] },
      { name: "The Edgewater Hotel", locations: ["Near Space Needle", "Waterfront"] },
      { name: "Fairmont Olympic Hotel", locations: ["Near Amazon HQ", "Downtown"] },
    ],
    groundTransport: "Light Rail or Uber - $3 train / $40-55 rideshare from SEA",
    baseCost: 1550,
  },
  {
    city: "Austin",
    aliases: ["austin", "aus"],
    airlines: ["Southwest Airlines", "American Airlines", "Delta Air Lines"],
    hotels: [
      { name: "Hotel Van Zandt", locations: ["Near Convention Center", "Rainey Street"] },
      { name: "The Driskill", locations: ["Near Capitol", "6th Street"] },
      { name: "Fairmont Austin", locations: ["Near Downtown", "Lady Bird Lake"] },
    ],
    groundTransport: "Uber/Lyft recommended - $25-35 from AUS",
    baseCost: 1350,
  },
  {
    city: "San Francisco",
    aliases: ["san francisco", "sf", "sfo"],
    airlines: ["United Airlines", "Alaska Airlines", "Southwest Airlines"],
    hotels: [
      { name: "The Ritz-Carlton San Francisco", locations: ["Near Union Square", "Nob Hill"] },
      { name: "Four Seasons Embarcadero", locations: ["Near Financial District", "SOMA"] },
      { name: "Palace Hotel", locations: ["Near Moscone Center", "SOMA"] },
    ],
    groundTransport: "BART or Uber - $10 train / $45-65 rideshare from SFO",
    baseCost: 1950,
  },
  {
    city: "Los Angeles",
    aliases: ["los angeles", "la", "lax"],
    airlines: ["Delta Air Lines", "American Airlines", "Southwest Airlines"],
    hotels: [
      { name: "The Beverly Hilton", locations: ["Near Beverly Hills", "West LA"] },
      { name: "JW Marriott LA Live", locations: ["Near Convention Center", "Downtown"] },
      { name: "Shutters on the Beach", locations: ["Near Santa Monica", "Beach"] },
    ],
    groundTransport: "Uber/Lyft recommended - $40-70 from LAX depending on destination",
    baseCost: 1750,
  },
  {
    city: "Boston",
    aliases: ["boston", "bos"],
    airlines: ["JetBlue Airways", "Delta Air Lines", "American Airlines"],
    hotels: [
      { name: "Four Seasons Boston", locations: ["Near Public Garden", "Back Bay"] },
      { name: "The Liberty Hotel", locations: ["Near Beacon Hill", "Cambridge"] },
      { name: "Marriott Copley Place", locations: ["Near Convention Center", "Back Bay"] },
    ],
    groundTransport: "Blue Line or Uber - $2.90 train / $30-45 rideshare from BOS",
    baseCost: 1600,
  },
  {
    city: "Denver",
    aliases: ["denver", "den"],
    airlines: ["United Airlines", "Southwest Airlines", "Frontier Airlines"],
    hotels: [
      { name: "The Brown Palace", locations: ["Near Downtown", "Capitol Hill"] },
      { name: "Four Seasons Denver", locations: ["Near Cherry Creek", "Downtown"] },
      { name: "Grand Hyatt Denver", locations: ["Near Convention Center", "Downtown"] },
    ],
    groundTransport: "A Line or Uber - $10.50 train / $55-70 rideshare from DEN",
    baseCost: 1400,
  },
  {
    city: "Miami",
    aliases: ["miami", "mia"],
    airlines: ["American Airlines", "Delta Air Lines", "JetBlue Airways"],
    hotels: [
      { name: "Four Seasons Surf Club", locations: ["Near Surfside", "Beach"] },
      { name: "JW Marriott Brickell", locations: ["Near Brickell", "Downtown"] },
      { name: "Mandarin Oriental Miami", locations: ["Near Brickell Key", "Waterfront"] },
    ],
    groundTransport: "Uber/Lyft recommended - $25-40 from MIA",
    baseCost: 1700,
  },
];

export function findDestination(input: string): DestinationTemplate | null {
  const lowered = input.toLowerCase();
  
  for (const template of destinationTemplates) {
    for (const alias of template.aliases) {
      if (lowered.includes(alias)) {
        return template;
      }
    }
  }
  
  return null;
}

export function findLandmark(input: string, template: DestinationTemplate): string {
  const lowered = input.toLowerCase();
  
  // Check for specific landmarks mentioned in input
  for (const hotel of template.hotels) {
    for (const location of hotel.locations) {
      const locationLower = location.toLowerCase();
      // Extract key words from location
      const keywords = locationLower.replace(/near /g, "").split(/[\s,]+/);
      for (const keyword of keywords) {
        if (keyword.length > 3 && lowered.includes(keyword)) {
          return location;
        }
      }
    }
  }
  
  // Return a random location from the first hotel
  return template.hotels[0].locations[0];
}

export interface ParsedDateResult {
  dates: string;
  startDate: Date;
  endDate: Date;
  assumed: boolean;
  needsClarification?: boolean;
  monthIntent?: {
    month: number;
    year: number;
    timing?: "early" | "mid" | "late";
  };
}

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_ABBREVS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function getMonthIndex(monthStr: string): number {
  const lower = monthStr.toLowerCase();
  // Check full names first
  const fullIdx = MONTH_NAMES.findIndex(m => lower.startsWith(m) || m.startsWith(lower));
  if (fullIdx !== -1) return fullIdx;
  // Check abbreviations
  const abbrevIdx = MONTH_ABBREVS.findIndex(m => lower.startsWith(m));
  return abbrevIdx;
}

function formatShortDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getDaysUntilDay(dayName: string): number {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = new Date().getDay();
  const target = days.indexOf(dayName.toLowerCase());
  if (target === -1) return 7;
  let diff = target - today;
  if (diff <= 0) diff += 7;
  return diff;
}

function getNextTuesdayThursday(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Find next Tuesday (day 2)
  let daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
  if (daysUntilTuesday === 0) daysUntilTuesday = 7; // If today is Tuesday, go to next week
  
  const start = new Date(now);
  start.setDate(now.getDate() + daysUntilTuesday);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 2); // Thursday
  
  return { start, end };
}

function findTuesdayInMonth(year: number, month: number, timing?: "early" | "mid" | "late"): { start: Date; end: Date } {
  // Determine date range based on timing
  let dayRangeStart = 8;
  let dayRangeEnd = 14;
  
  if (timing === "early") {
    dayRangeStart = 2;
    dayRangeEnd = 10;
  } else if (timing === "mid") {
    dayRangeStart = 11;
    dayRangeEnd = 20;
  } else if (timing === "late") {
    dayRangeStart = 18;
    dayRangeEnd = 28;
  }
  
  // Find a Tuesday in that range
  for (let day = dayRangeStart; day <= dayRangeEnd; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 2) { // Tuesday
      const start = date;
      const end = new Date(start);
      end.setDate(start.getDate() + 2); // Thursday
      return { start, end };
    }
  }
  
  // Fallback: just pick the middle of the range
  const start = new Date(year, month, dayRangeStart + 5);
  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  return { start, end };
}

function parseTripDuration(input: string): number {
  const lowered = input.toLowerCase();
  
  // Match "X nights" or "X days"
  const nightsMatch = lowered.match(/(\d+)\s*nights?/);
  if (nightsMatch) return parseInt(nightsMatch[1]);
  
  const daysMatch = lowered.match(/(\d+)\s*days?/);
  if (daysMatch) return parseInt(daysMatch[1]) - 1; // days to nights
  
  // Match "week"
  if (lowered.includes("week")) return 6;
  
  // Match "weekend"
  if (lowered.includes("weekend")) return 2;
  
  return 2; // Default: 2 nights (3 days)
}

export function parseDates(input: string): ParsedDateResult {
  const lowered = input.toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Try to get trip duration from input
  const tripNights = parseTripDuration(input);
  
  // Pattern 1: Explicit date range like "Jan 15-17", "January 15-17"
  const monthDayRange = input.match(/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?/i);
  if (monthDayRange) {
    const monthStr = monthDayRange[0].match(/[a-z]+/i)?.[0] || "";
    const monthIdx = getMonthIndex(monthStr);
    const startDay = parseInt(monthDayRange[1]);
    const endDay = monthDayRange[2] ? parseInt(monthDayRange[2]) : startDay + tripNights;
    
    // Determine year (current or next)
    let year = currentYear;
    const testDate = new Date(year, monthIdx, startDay);
    if (testDate < now) {
      year = currentYear + 1;
    }
    
    const startDate = new Date(year, monthIdx, startDay);
    const endDate = new Date(year, monthIdx, endDay);
    
    return {
      dates: `${formatShortDate(startDate)}-${formatShortDate(endDate)}, ${year}`,
      startDate,
      endDate,
      assumed: false,
    };
  }
  
  // Pattern 2: Month only - "in March", "for March", "March trip"
  const monthOnlyPatterns = [
    /(?:in|for|during)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i,
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(?:trip|flight|travel)/i,
    /(?:^|\s)(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s|$)/i,
  ];
  
  for (const pattern of monthOnlyPatterns) {
    const monthOnlyMatch = lowered.match(pattern);
    if (monthOnlyMatch) {
      const monthStr = monthOnlyMatch[1];
      const monthIdx = getMonthIndex(monthStr);
      
      if (monthIdx !== -1) {
        // Check for early/mid/late modifier
        let timing: "early" | "mid" | "late" | undefined;
        if (lowered.includes("early " + monthStr) || lowered.includes("beginning of " + monthStr)) {
          timing = "early";
        } else if (lowered.includes("mid " + monthStr) || lowered.includes("middle of " + monthStr)) {
          timing = "mid";
        } else if (lowered.includes("late " + monthStr) || lowered.includes("end of " + monthStr)) {
          timing = "late";
        }
        
        // Determine year
        let year = currentYear;
        const testDate = new Date(year, monthIdx, 15);
        if (testDate < now) {
          year = currentYear + 1;
        }
        
        // Find appropriate dates in that month
        const { start, end } = findTuesdayInMonth(year, monthIdx, timing);
        
        // Adjust end date based on trip duration
        const adjustedEnd = new Date(start);
        adjustedEnd.setDate(start.getDate() + tripNights);
        
        // Log for debugging
        console.log("[DateParser]", {
          input,
          destination: "parsed",
          startDate: start.toISOString(),
          endDate: adjustedEnd.toISOString(),
          inferred: true,
          monthIntent: { month: monthIdx, year, timing },
        });
        
        return {
          dates: `${formatShortDate(start)}-${formatShortDate(adjustedEnd)}, ${year}`,
          startDate: start,
          endDate: adjustedEnd,
          assumed: true,
          needsClarification: true,
          monthIntent: { month: monthIdx, year, timing },
        };
      }
    }
  }
  
  // Pattern 3: "next week", "next Tuesday", etc.
  const nextMatch = lowered.match(/next\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (nextMatch) {
    const daysUntilNext = nextMatch[1].toLowerCase() === "week" ? 7 : getDaysUntilDay(nextMatch[1]);
    const start = new Date(now.getTime() + daysUntilNext * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + tripNights * 24 * 60 * 60 * 1000);
    
    return { 
      dates: `${formatShortDate(start)}-${formatShortDate(end)}, ${start.getFullYear()}`, 
      startDate: start,
      endDate: end,
      assumed: false 
    };
  }
  
  // Pattern 4: Numeric date ranges like "1/15-1/17"
  const numericRange = input.match(/(\d{1,2})\/(\d{1,2})\s*[-–]\s*(?:\d{1,2}\/)?(\d{1,2})/);
  if (numericRange) {
    const month = parseInt(numericRange[1]) - 1;
    const startDay = parseInt(numericRange[2]);
    const endDay = parseInt(numericRange[3]);
    
    let year = currentYear;
    const testDate = new Date(year, month, startDay);
    if (testDate < now) {
      year = currentYear + 1;
    }
    
    const startDate = new Date(year, month, startDay);
    const endDate = new Date(year, month, endDay);
    
    return { 
      dates: `${numericRange[1]}/${numericRange[2]}-${numericRange[3]}, ${year}`, 
      startDate,
      endDate,
      assumed: false 
    };
  }
  
  // Default: next available Tue-Thu
  const { start, end } = getNextTuesdayThursday();
  
  console.log("[DateParser]", {
    input,
    destination: "default",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    inferred: true,
  });
  
  return { 
    dates: `${formatShortDate(start)}-${formatShortDate(end)}, ${start.getFullYear()}`, 
    startDate: start,
    endDate: end,
    assumed: true 
  };
}

export function parsePurpose(input: string): string {
  const lowered = input.toLowerCase();
  
  const purposePatterns = [
    { pattern: /(?:client|customer)\s*(?:meeting|pitch|presentation)/i, purpose: "client meeting" },
    { pattern: /(?:team|company)\s*(?:offsite|retreat|meeting)/i, purpose: "team offsite" },
    { pattern: /(?:conference|summit|convention)/i, purpose: "conference" },
    { pattern: /(?:interview|recruiting)/i, purpose: "interview" },
    { pattern: /(?:training|workshop)/i, purpose: "training session" },
    { pattern: /(?:board|investor)\s*meeting/i, purpose: "board meeting" },
    { pattern: /(?:sales|demo)/i, purpose: "sales meeting" },
  ];
  
  for (const { pattern, purpose } of purposePatterns) {
    if (pattern.test(lowered)) {
      return purpose;
    }
  }
  
  // Extract "for X" pattern
  const forMatch = input.match(/for\s+(?:a\s+)?([a-z\s]+?)(?:\s+(?:near|in|at|on|$))/i);
  if (forMatch) {
    return forMatch[1].trim();
  }
  
  return "business meeting";
}
