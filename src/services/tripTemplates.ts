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

export function parseDates(input: string): { dates: string; assumed: boolean } {
  const lowered = input.toLowerCase();
  
  // Match patterns like "Jan 15-17", "January 15", "next Tuesday", etc.
  const monthDayRange = input.match(/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?/i);
  if (monthDayRange) {
    return { dates: `${monthDayRange[0]}, 2025`, assumed: false };
  }
  
  // Match "next week", "next Tuesday", etc.
  const nextMatch = lowered.match(/next\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (nextMatch) {
    const now = new Date();
    const daysUntilNext = nextMatch[1].toLowerCase() === "week" ? 7 : getDaysUntilDay(nextMatch[1]);
    const start = new Date(now.getTime() + daysUntilNext * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
    return { 
      dates: `${formatShortDate(start)}-${formatShortDate(end)}`, 
      assumed: false 
    };
  }
  
  // Match date ranges like "1/15-1/17" or "15-17"
  const numericRange = input.match(/(\d{1,2})\/(\d{1,2})\s*[-–]\s*(?:\d{1,2}\/)?(\d{1,2})/);
  if (numericRange) {
    return { dates: `${numericRange[1]}/${numericRange[2]}-${numericRange[3]}, 2025`, assumed: false };
  }
  
  // Default: upcoming dates
  const now = new Date();
  const start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
  return { 
    dates: `${formatShortDate(start)}-${formatShortDate(end)}`, 
    assumed: true 
  };
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

function formatShortDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
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
