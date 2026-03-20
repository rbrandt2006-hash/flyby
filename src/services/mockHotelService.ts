import type { HotelOption } from "@/components/chats/booking/types";

// ── Brand catalog ──────────────────────────────────────────────────
const hotelBrands = [
  { name: "Marriott", tier: "upscale", basePrice: 220, rating: 4.3 },
  { name: "Hilton", tier: "upscale", basePrice: 210, rating: 4.2 },
  { name: "Hyatt", tier: "upscale", basePrice: 230, rating: 4.4 },
  { name: "Westin", tier: "upscale", basePrice: 245, rating: 4.5 },
  { name: "Sheraton", tier: "upscale", basePrice: 195, rating: 4.1 },
  { name: "Doubletree", tier: "upper-midscale", basePrice: 165, rating: 4.0 },
  { name: "Courtyard by Marriott", tier: "upper-midscale", basePrice: 155, rating: 4.0 },
  { name: "Hampton Inn", tier: "midscale", basePrice: 135, rating: 4.1 },
  { name: "Holiday Inn", tier: "midscale", basePrice: 140, rating: 3.9 },
  { name: "Holiday Inn Express", tier: "midscale", basePrice: 120, rating: 3.8 },
  { name: "Residence Inn", tier: "extended-stay", basePrice: 175, rating: 4.2 },
  { name: "Fairfield Inn", tier: "midscale", basePrice: 125, rating: 3.8 },
  { name: "Aloft", tier: "select", basePrice: 160, rating: 4.0 },
  { name: "AC Hotel", tier: "select", basePrice: 185, rating: 4.2 },
  { name: "Four Seasons", tier: "luxury", basePrice: 550, rating: 4.8 },
  { name: "Ritz-Carlton", tier: "luxury", basePrice: 520, rating: 4.7 },
  { name: "W Hotel", tier: "luxury", basePrice: 380, rating: 4.5 },
  { name: "JW Marriott", tier: "luxury", basePrice: 350, rating: 4.6 },
  { name: "InterContinental", tier: "upscale", basePrice: 280, rating: 4.4 },
  { name: "Kimpton", tier: "boutique", basePrice: 260, rating: 4.4 },
  { name: "Omni", tier: "upscale", basePrice: 240, rating: 4.3 },
  { name: "Radisson", tier: "upper-midscale", basePrice: 150, rating: 3.9 },
  { name: "Best Western Plus", tier: "midscale", basePrice: 110, rating: 3.7 },
  { name: "Crowne Plaza", tier: "upscale", basePrice: 200, rating: 4.1 },
  { name: "Embassy Suites", tier: "upper-midscale", basePrice: 180, rating: 4.2 },
  { name: "SpringHill Suites", tier: "upper-midscale", basePrice: 145, rating: 4.0 },
  { name: "Homewood Suites", tier: "extended-stay", basePrice: 165, rating: 4.1 },
  { name: "Conrad", tier: "luxury", basePrice: 400, rating: 4.6 },
  { name: "Andaz", tier: "boutique", basePrice: 300, rating: 4.5 },
  { name: "Canopy by Hilton", tier: "boutique", basePrice: 220, rating: 4.3 },
  { name: "Moxy", tier: "select", basePrice: 140, rating: 4.0 },
  { name: "Cambria Hotel", tier: "upper-midscale", basePrice: 155, rating: 4.0 },
  { name: "Hyatt Place", tier: "upper-midscale", basePrice: 145, rating: 4.0 },
  { name: "Hyatt House", tier: "extended-stay", basePrice: 160, rating: 4.1 },
  { name: "Le Méridien", tier: "upscale", basePrice: 270, rating: 4.4 },
  { name: "St. Regis", tier: "luxury", basePrice: 600, rating: 4.9 },
  { name: "Waldorf Astoria", tier: "luxury", basePrice: 580, rating: 4.8 },
  { name: "Pendry", tier: "boutique", basePrice: 340, rating: 4.5 },
  { name: "Thompson", tier: "boutique", basePrice: 310, rating: 4.4 },
  { name: "1 Hotel", tier: "boutique", basePrice: 350, rating: 4.5 },
] as const;

// ── Image pool ─────────────────────────────────────────────────────
const imagePool = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800&h=500&fit=crop",
];

function getHotelImages(seed: number): string[] {
  const len = imagePool.length;
  return [
    imagePool[seed % len],
    imagePool[(seed + 3) % len],
    imagePool[(seed + 7) % len],
    imagePool[(seed + 11) % len],
    imagePool[(seed + 17) % len],
  ];
}

// ── Seeded PRNG (deterministic per city) ───────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ── City configurations ────────────────────────────────────────────
interface CityConfig {
  neighborhoods: string[];
  priceMultiplier: number;
  descriptors: string[]; // Extra words to vary hotel names
}

const cityConfigs: Record<string, CityConfig> = {
  "san francisco": { neighborhoods: ["Union Square", "Financial District", "SOMA", "Embarcadero", "Fisherman's Wharf", "Nob Hill", "Marina District", "Mission Bay", "Pacific Heights", "Hayes Valley", "Japantown", "Tenderloin"], priceMultiplier: 1.3, descriptors: ["Grand", "Plaza", "Park", "Bayview", "Gateway", "Civic Center", "Waterfront", "Heights"] },
  "new york": { neighborhoods: ["Midtown", "Times Square", "Financial District", "Chelsea", "Upper East Side", "SoHo", "Tribeca", "Gramercy", "Hell's Kitchen", "Upper West Side", "Lower East Side", "NoHo", "Murray Hill", "Flatiron"], priceMultiplier: 1.4, descriptors: ["Central", "Park Avenue", "Fifth Avenue", "Broadway", "Grand", "Metropolitan", "Manhattan", "Lexington"] },
  "chicago": { neighborhoods: ["The Loop", "Magnificent Mile", "River North", "Gold Coast", "West Loop", "Streeterville", "Lincoln Park", "Wicker Park", "South Loop", "Old Town"], priceMultiplier: 1.15, descriptors: ["Lakefront", "Michigan Avenue", "Millennium", "Riverwalk", "State Street", "Wacker", "Navy Pier"] },
  "los angeles": { neighborhoods: ["Downtown", "Beverly Hills", "Santa Monica", "Hollywood", "Century City", "West Hollywood", "LAX Area", "Venice", "Culver City", "Pasadena", "Koreatown", "Silver Lake"], priceMultiplier: 1.2, descriptors: ["Sunset", "Pacific", "Wilshire", "Hollywood", "Ocean", "Vine", "Melrose"] },
  "seattle": { neighborhoods: ["Downtown", "Pike Place", "Capitol Hill", "Belltown", "South Lake Union", "Pioneer Square", "Fremont", "Ballard", "Queen Anne", "International District"], priceMultiplier: 1.1, descriptors: ["Pacific", "Harbor", "Sound", "Puget", "Emerald", "Rainier", "Waterfront"] },
  "austin": { neighborhoods: ["Downtown", "East Austin", "South Congress", "Domain", "Rainey Street", "University Area", "Mueller", "Zilker", "Warehouse District", "Red River"], priceMultiplier: 1.0, descriptors: ["Capitol", "Lone Star", "Hill Country", "Live Music", "Congress", "Sixth Street"] },
  "boston": { neighborhoods: ["Back Bay", "Downtown", "Seaport", "Cambridge", "Beacon Hill", "Fenway", "Charlestown", "North End", "Brookline", "South Boston"], priceMultiplier: 1.2, descriptors: ["Harbor", "Commons", "Newbury", "Boylston", "Colonial", "Waterfront"] },
  "denver": { neighborhoods: ["Downtown", "LoDo", "RiNo", "Cherry Creek", "Capitol Hill", "Union Station", "Highland", "Colfax", "Baker", "Platt Park"], priceMultiplier: 0.95, descriptors: ["Mile High", "Mountain View", "Rocky", "Alpine", "Peak", "Crest"] },
  "miami": { neighborhoods: ["South Beach", "Downtown", "Brickell", "Miami Beach", "Coral Gables", "Coconut Grove", "Wynwood", "Design District", "Key Biscayne", "Aventura"], priceMultiplier: 1.15, descriptors: ["Ocean", "Bay", "Tropical", "Palm", "Shore", "Deco"] },
  "atlanta": { neighborhoods: ["Downtown", "Midtown", "Buckhead", "Perimeter", "Atlantic Station", "Virginia-Highland", "Inman Park", "Decatur", "West Midtown", "Sandy Springs"], priceMultiplier: 0.9, descriptors: ["Peachtree", "Piedmont", "Centennial", "Midtown", "Colony"] },
  "tokyo": { neighborhoods: ["Shinjuku", "Shibuya", "Ginza", "Roppongi", "Akasaka", "Marunouchi", "Asakusa", "Ueno", "Ikebukuro", "Odaiba", "Nihonbashi", "Shinagawa"], priceMultiplier: 1.25, descriptors: ["Imperial", "Sakura", "Grand", "Tokyo Bay", "Palace", "Garden"] },
  "london": { neighborhoods: ["Mayfair", "Westminster", "Covent Garden", "Soho", "Kensington", "Bloomsbury", "South Bank", "Canary Wharf", "Marylebone", "Shoreditch", "Tower Hill", "Paddington"], priceMultiplier: 1.35, descriptors: ["Royal", "Kensington", "Regent", "Hyde Park", "Victoria", "Strand"] },
  "paris": { neighborhoods: ["1st Arr. Louvre", "2nd Arr. Bourse", "5th Arr. Latin Quarter", "6th Arr. Saint-Germain", "7th Arr. Eiffel Tower", "8th Arr. Champs-Élysées", "9th Arr. Opéra", "10th Arr. Canal Saint-Martin", "11th Arr. Bastille", "16th Arr. Trocadéro"], priceMultiplier: 1.3, descriptors: ["Parisien", "Royal", "Grand", "Étoile", "Rivoli", "Opéra"] },
  "dallas": { neighborhoods: ["Downtown", "Uptown", "Deep Ellum", "Bishop Arts", "Design District", "Victory Park", "Knox-Henderson", "Oak Lawn", "North Dallas", "Las Colinas"], priceMultiplier: 0.85, descriptors: ["Lone Star", "Heritage", "Commerce", "Trinity", "Reunion"] },
  "houston": { neighborhoods: ["Downtown", "Galleria", "Medical Center", "Montrose", "Midtown", "River Oaks", "Heights", "Energy Corridor", "Memorial", "Museum District"], priceMultiplier: 0.85, descriptors: ["Space City", "Bayou", "Heritage", "Galleria", "Gulf"] },
  "washington": { neighborhoods: ["Downtown", "Georgetown", "Capitol Hill", "Dupont Circle", "Foggy Bottom", "Adams Morgan", "Navy Yard", "Penn Quarter", "NoMa", "Crystal City"], priceMultiplier: 1.2, descriptors: ["Capitol", "Monument", "Federal", "Embassy", "National"] },
  "san diego": { neighborhoods: ["Downtown", "Gaslamp Quarter", "La Jolla", "Mission Valley", "Old Town", "Coronado", "Pacific Beach", "Hillcrest", "Point Loma"], priceMultiplier: 1.05, descriptors: ["Harbor", "Pacific", "Coastal", "Bayfront", "Ocean"] },
  "phoenix": { neighborhoods: ["Downtown", "Scottsdale", "Tempe", "Arcadia", "Camelback", "Paradise Valley", "Old Town Scottsdale", "Chandler", "Mesa"], priceMultiplier: 0.85, descriptors: ["Desert", "Sonoran", "Camelback", "Valley", "Canyon"] },
  "portland": { neighborhoods: ["Downtown", "Pearl District", "Alberta Arts", "Hawthorne", "Sellwood", "Lloyd District", "Nob Hill", "Division", "Mississippi"], priceMultiplier: 0.95, descriptors: ["Pacific", "Bridge", "Rose City", "Pearl", "River"] },
  "nashville": { neighborhoods: ["Downtown", "Broadway", "The Gulch", "Music Row", "12 South", "Germantown", "East Nashville", "Midtown", "Elliston Place"], priceMultiplier: 0.95, descriptors: ["Music City", "Grand Ole", "Broadway", "Honky Tonk", "Capitol"] },
};

const amenitiesByTier: Record<string, string[][]> = {
  luxury: [
    ["Spa", "Pool", "Fine dining", "Concierge", "Valet parking", "Room service", "Club lounge"],
    ["Spa", "Pool", "Fine dining", "Butler service", "Gym", "Business center"],
    ["Spa", "Rooftop pool", "Fine dining", "City views", "Concierge", "Bar"],
  ],
  upscale: [
    ["Free Wi-Fi", "Pool", "Gym", "Restaurant", "Room service", "Business center"],
    ["Free Wi-Fi", "Gym", "Restaurant", "Bar", "Concierge"],
    ["Free Wi-Fi", "Pool", "Gym", "Restaurant", "Parking"],
  ],
  "upper-midscale": [
    ["Free Wi-Fi", "Pool", "Gym", "Restaurant"],
    ["Free Wi-Fi", "Gym", "Business center", "Restaurant"],
    ["Free Wi-Fi", "Pool", "Gym", "Parking"],
  ],
  midscale: [
    ["Free breakfast", "Free Wi-Fi", "Gym"],
    ["Free breakfast", "Free Wi-Fi", "Pool"],
    ["Free Wi-Fi", "Gym", "Parking", "Business center"],
  ],
  select: [
    ["Free Wi-Fi", "Gym", "Bar"],
    ["Free Wi-Fi", "Gym", "Restaurant"],
    ["Free Wi-Fi", "Pool", "Bar"],
  ],
  "extended-stay": [
    ["Free Wi-Fi", "Kitchen", "Gym", "Laundry", "Pool"],
    ["Free Wi-Fi", "Kitchen", "Gym", "Parking"],
    ["Free Wi-Fi", "Kitchen", "Pool", "Business center"],
  ],
  boutique: [
    ["Free Wi-Fi", "Restaurant", "Bar", "Unique design", "Concierge"],
    ["Free Wi-Fi", "Rooftop bar", "Restaurant", "Gym"],
    ["Free Wi-Fi", "Restaurant", "Spa", "Garden"],
  ],
};

const descriptions = [
  (name: string, area: string, tier: string) => `Experience ${tier === "luxury" ? "unparalleled luxury" : "exceptional comfort"} at ${name}, ideally situated in ${area}. Perfect for business and leisure travelers alike.`,
  (name: string, area: string) => `${name} offers a prime ${area} location with modern amenities and outstanding service. Steps from top dining, shopping, and attractions.`,
  (name: string, area: string) => `Discover the perfect blend of style and convenience at ${name}. Located in the heart of ${area}, with easy access to everything the city has to offer.`,
  (name: string, area: string) => `Welcome to ${name}, your home away from home in ${area}. Thoughtfully designed rooms, attentive service, and a fantastic location await.`,
  (name: string, area: string, tier: string) => `${name} in ${area} delivers ${tier === "luxury" ? "world-class elegance" : "reliable quality"} with every stay. Enjoy well-appointed rooms and a central location.`,
];

const cancellationPolicies = [
  "Free cancellation until 24 hours before check-in",
  "Free cancellation until 48 hours before check-in",
  "Free cancellation until 72 hours before check-in",
  "Non-refundable — best rate guarantee",
  "Free cancellation until 7 days before check-in",
];

const roomTypeSets = [
  ["Standard King", "Double Queen", "Suite"],
  ["Deluxe King", "Standard Double", "Junior Suite", "Executive Suite"],
  ["King Room", "Two Queen", "Premium Suite"],
  ["Superior Room", "Deluxe Room", "Grand Suite"],
  ["Studio King", "Double Queen", "One-Bedroom Suite"],
];

// ── Generator ──────────────────────────────────────────────────────

function generateHotelsForCity(city: string, config: CityConfig, nights: number): HotelOption[] {
  const seed = hashString(city);
  const rand = seededRandom(seed);
  const hotels: HotelOption[] = [];
  const usedNames = new Set<string>();

  // Generate 80-150 hotels per city
  const count = 80 + Math.floor(rand() * 70);

  for (let i = 0; i < count; i++) {
    const brandIdx = Math.floor(rand() * hotelBrands.length);
    const brand = hotelBrands[brandIdx];
    const neighborhood = config.neighborhoods[Math.floor(rand() * config.neighborhoods.length)];

    // Build a unique name
    let hotelName: string;
    const nameStrategy = Math.floor(rand() * 4);
    if (nameStrategy === 0) {
      hotelName = `${brand.name} ${neighborhood}`;
    } else if (nameStrategy === 1) {
      const desc = config.descriptors[Math.floor(rand() * config.descriptors.length)];
      hotelName = `${brand.name} ${desc}`;
    } else if (nameStrategy === 2) {
      hotelName = `The ${brand.name} ${neighborhood}`;
    } else {
      const desc = config.descriptors[Math.floor(rand() * config.descriptors.length)];
      hotelName = `${brand.name} ${desc} ${neighborhood}`;
    }

    // Deduplicate
    if (usedNames.has(hotelName)) {
      hotelName = `${hotelName} ${["Inn", "Suites", "Resort", "Hotel", "Lodge"][Math.floor(rand() * 5)]}`;
    }
    if (usedNames.has(hotelName)) continue;
    usedNames.add(hotelName);

    const priceVariation = 0.75 + rand() * 0.5;
    const pricePerNight = Math.round(brand.basePrice * config.priceMultiplier * priceVariation);
    const ratingVariation = (rand() - 0.5) * 0.6;
    const rating = Math.min(4.9, Math.max(3.5, brand.rating + ratingVariation));
    const reviewCount = 200 + Math.floor(rand() * 4800);
    const distance = 0.1 + rand() * 2.5;
    const policyCompliant = brand.tier !== "luxury" && pricePerNight < 350;

    const tags: string[] = [];
    if (policyCompliant) tags.push("Policy compliant");
    if (i < 3) tags.push("Recommended");
    if (pricePerNight < 160) tags.push("Budget friendly");
    if (pricePerNight < 180 && policyCompliant) tags.push("Best value");
    if (brand.tier === "luxury") tags.push("Luxury");
    if (distance < 0.3) tags.push("Closest");
    if (rand() > 0.7 && brand.tier === "boutique") tags.push("Boutique");
    if (rand() > 0.8) tags.push("Great breakfast");

    const tierAmenities = amenitiesByTier[brand.tier] || amenitiesByTier["midscale"];
    const amenities = tierAmenities[Math.floor(rand() * tierAmenities.length)];

    const descFn = descriptions[Math.floor(rand() * descriptions.length)];

    hotels.push({
      id: `htl_${hashString(city + hotelName)}_${i}`,
      name: hotelName,
      area: neighborhood,
      pricePerNight,
      totalPrice: pricePerNight * nights,
      rating: Math.round(rating * 10) / 10,
      distanceToVenue: `${distance.toFixed(1)} mi`,
      tags,
      images: getHotelImages(seed + i),
      amenities,
      reviewCount,
      description: descFn(hotelName, neighborhood, brand.tier),
      cancellationPolicy: cancellationPolicies[Math.floor(rand() * cancellationPolicies.length)],
      roomTypes: roomTypeSets[Math.floor(rand() * roomTypeSets.length)],
    });
  }

  // Sort: Recommended first, then by rating
  hotels.sort((a, b) => {
    const aRec = a.tags.includes("Recommended") ? 0 : 1;
    const bRec = b.tags.includes("Recommended") ? 0 : 1;
    if (aRec !== bRec) return aRec - bRec;
    return b.rating - a.rating;
  });

  return hotels;
}

// ── Normalize city ─────────────────────────────────────────────────
function normalizeCity(destination: string): string {
  const cityPart = destination.split(",")[0].trim().toLowerCase();
  const mappings: Record<string, string> = {
    sf: "san francisco", nyc: "new york", la: "los angeles",
    dc: "washington", "washington dc": "washington", "washington d.c.": "washington",
  };
  return mappings[cityPart] || cityPart;
}

// ── Public API ─────────────────────────────────────────────────────

export interface GetHotelsOptions {
  destination: string;
  nights?: number;
  checkIn?: Date;
  checkOut?: Date;
  maxPrice?: number;
  policyCompliantOnly?: boolean;
}

export function getHotelsForDestination(options: GetHotelsOptions): HotelOption[] {
  const { destination, nights = 2, maxPrice, policyCompliantOnly } = options;
  const normalizedCity = normalizeCity(destination);

  const config = cityConfigs[normalizedCity] || {
    neighborhoods: ["Downtown", "Business District", "City Center", "Airport Area", "Convention Center", "Old Town", "University District", "Waterfront"],
    priceMultiplier: 1.0,
    descriptors: ["Grand", "Central", "Plaza", "Gateway", "Premier", "Heritage"],
  };

  let hotels = generateHotelsForCity(normalizedCity, config, nights);

  if (maxPrice) hotels = hotels.filter((h) => h.pricePerNight <= maxPrice);
  if (policyCompliantOnly) hotels = hotels.filter((h) => h.tags.includes("Policy compliant"));

  return hotels;
}

export function getSupportedCities(): string[] {
  return Object.keys(cityConfigs).map((c) =>
    c.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

export function generateHotelOptions(destination: string, nights = 2): HotelOption[] {
  return getHotelsForDestination({ destination, nights });
}
