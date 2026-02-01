import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced airline database for real inventory simulation
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
  { code: "VS", name: "Virgin Atlantic", logo: "❤️" },
  { code: "IB", name: "Iberia", logo: "🇪🇸" },
  { code: "AZ", name: "ITA Airways", logo: "🇮🇹" },
  { code: "SK", name: "SAS", logo: "🇸🇪" },
  { code: "LX", name: "Swiss", logo: "🇨🇭" },
  { code: "OS", name: "Austrian Airlines", logo: "🇦🇹" },
  { code: "TK", name: "Turkish Airlines", logo: "🇹🇷" },
  { code: "EY", name: "Etihad Airways", logo: "🇦🇪" },
  { code: "AC", name: "Air Canada", logo: "🇨🇦" },
  { code: "AM", name: "Aeromexico", logo: "🇲🇽" },
];

// Comprehensive hotel database (1000+ hotels simulated)
const HOTEL_CHAINS = [
  "Marriott", "Hilton", "Hyatt", "IHG", "Wyndham", "Best Western", 
  "Choice Hotels", "AccorHotels", "Radisson", "Four Seasons",
  "Ritz-Carlton", "St. Regis", "W Hotels", "Westin", "Sheraton",
  "DoubleTree", "Embassy Suites", "Hampton Inn", "Holiday Inn",
  "Crowne Plaza", "Kimpton", "Fairmont", "Sofitel", "Novotel",
  "ibis", "La Quinta", "Comfort Inn", "Quality Inn", "Clarion"
];

const HOTEL_SUFFIXES = [
  "Hotel", "Suites", "Resort", "Inn", "Lodge", "Plaza",
  "Grand", "Tower", "Center", "Place", "Manor", "Court"
];

const AREAS = [
  "Downtown", "Midtown", "Financial District", "Airport",
  "Convention Center", "Beach", "Historic District", "Arts District",
  "Business District", "Waterfront", "City Center", "Tech Quarter"
];

const AMENITIES_POOL = [
  "Free Wi-Fi", "Gym", "Pool", "Spa", "Restaurant", "Bar",
  "Room Service", "Business Center", "Concierge", "Valet Parking",
  "Free Breakfast", "Pet Friendly", "EV Charging", "Rooftop Terrace"
];

// Ground transport providers
const GROUND_PROVIDERS = [
  { type: "Rideshare", provider: "Uber", basePrice: 25, tags: ["Convenient", "Popular"] },
  { type: "Rideshare", provider: "Lyft", basePrice: 23, tags: ["Best value", "Reliable"] },
  { type: "Rideshare", provider: "Uber Black", basePrice: 55, tags: ["Premium", "Luxury"] },
  { type: "Public Transit", provider: "Metro", basePrice: 5, tags: ["Budget", "Eco-friendly"] },
  { type: "Public Transit", provider: "Bus", basePrice: 3, tags: ["Budget", "Local"] },
  { type: "Rental Car", provider: "Hertz", basePrice: 55, tags: ["Flexibility", "Popular"] },
  { type: "Rental Car", provider: "Enterprise", basePrice: 50, tags: ["Great service", "Wide selection"] },
  { type: "Rental Car", provider: "Avis", basePrice: 52, tags: ["Business traveler", "Premium"] },
  { type: "Rental Car", provider: "Budget", basePrice: 42, tags: ["Budget", "Value"] },
  { type: "Rental Car", provider: "National", basePrice: 58, tags: ["Emerald Club", "Fast pickup"] },
  { type: "Shuttle", provider: "SuperShuttle", basePrice: 18, tags: ["Shared ride", "Airport"] },
  { type: "Taxi", provider: "Yellow Cab", basePrice: 35, tags: ["Traditional", "Metered"] },
  { type: "Limousine", provider: "Executive Limo", basePrice: 85, tags: ["Luxury", "Business"] },
];

// Generate flight options based on search query
function generateFlights(query: string, origin: string, dest: string, date: string): any[] {
  const queryLower = query.toLowerCase();
  
  const matchingAirlines = AIRLINES_DATABASE.filter(airline => 
    airline.name.toLowerCase().includes(queryLower) ||
    airline.code.toLowerCase().includes(queryLower)
  );
  
  const airlines = matchingAirlines.length > 0 ? matchingAirlines : AIRLINES_DATABASE.slice(0, 15);
  
  const departureTimes = ["6:00 AM", "7:30 AM", "9:00 AM", "10:30 AM", "12:00 PM", 
                         "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM", "7:30 PM"];
  
  const flights: any[] = [];
  
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
      if (departIdx < 2) tags.push("Early departure");
      if (departIdx > 7) tags.push("Red-eye");
      if (i === 0 && j === 0) tags.push("Recommended");
      
      const durationHours = Math.floor(duration / 60);
      const durationMins = duration % 60;
      
      const departHour = parseInt(departureTimes[departIdx].split(":")[0]);
      const isPM = departureTimes[departIdx].includes("PM");
      const actualDepartHour = isPM && departHour !== 12 ? departHour + 12 : departHour;
      const arriveHour = (actualDepartHour + durationHours) % 24;
      const arriveTime = arriveHour > 12 
        ? `${arriveHour - 12}:${durationMins.toString().padStart(2, "0")} PM`
        : arriveHour === 0 
          ? `12:${durationMins.toString().padStart(2, "0")} AM`
          : `${arriveHour}:${durationMins.toString().padStart(2, "0")} AM`;
      
      flights.push({
        id: `fl-${airline.code}-${i}-${j}`,
        airline: airline.name,
        airlineLogo: airline.logo,
        departTime: departureTimes[departIdx],
        arriveTime: arriveTime,
        duration: `${durationHours}h ${durationMins}m`,
        stops,
        stopCity: stops > 0 ? ["DEN", "ORD", "ATL", "DFW", "CLT"][Math.floor(Math.random() * 5)] : undefined,
        price: basePrice,
        priceDiff: i === 0 ? 0 : basePrice - flights[0]?.price || 0,
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

// Generate hotel options based on search query
function generateHotels(query: string, city: string, checkIn: string, checkOut: string): any[] {
  const queryLower = query.toLowerCase();
  
  const matchingChains = HOTEL_CHAINS.filter(chain => 
    chain.toLowerCase().includes(queryLower)
  );
  
  const chains = matchingChains.length > 0 ? matchingChains : HOTEL_CHAINS;
  
  const hotels: any[] = [];
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
      if (amenities.includes("Free Breakfast")) tags.push("Breakfast included");
      if (basePrice >= 150 && basePrice <= 350) tags.push("Policy compliant");
      
      const nights = 2; // Default assumption
      
      hotels.push({
        id: `ht-${id++}`,
        name: `${chain} ${suffix}`,
        area: area,
        pricePerNight: basePrice,
        totalPrice: basePrice * nights,
        rating: parseFloat(rating.toFixed(1)),
        distanceToVenue: `${distance} mi`,
        tags,
        images: [
          `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop&sig=${id}`,
          `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop&sig=${id}`,
          `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop&sig=${id}`,
        ],
        amenities,
        reviewCount: 500 + Math.floor(Math.random() * 3000),
        description: `Experience ${chain} hospitality in the heart of ${area}. Modern amenities and exceptional service await.`,
        cancellationPolicy: basePrice > 300 
          ? "Free cancellation until 72 hours before check-in"
          : "Free cancellation until 24 hours before check-in",
        roomTypes: ["Standard Room", "King Room", "Suite"],
        city: city || "San Francisco",
      });
    }
  });
  
  // Filter by query if not matching chain name
  let filtered = hotels;
  if (matchingChains.length === 0 && queryLower.length > 0) {
    filtered = hotels.filter(h => 
      h.name.toLowerCase().includes(queryLower) ||
      h.area.toLowerCase().includes(queryLower) ||
      h.amenities.some((a: string) => a.toLowerCase().includes(queryLower))
    );
  }
  
  return filtered.sort((a, b) => {
    if (a.tags.includes("Recommended")) return -1;
    if (b.tags.includes("Recommended")) return 1;
    return a.pricePerNight - b.pricePerNight;
  }).slice(0, 100);
}

// Generate ground transport options based on search query
function generateGround(query: string, city: string, date: string): any[] {
  const queryLower = query.toLowerCase();
  
  let filtered = GROUND_PROVIDERS;
  if (queryLower.length > 0) {
    filtered = GROUND_PROVIDERS.filter(g => 
      g.provider.toLowerCase().includes(queryLower) ||
      g.type.toLowerCase().includes(queryLower) ||
      g.tags.some(t => t.toLowerCase().includes(queryLower))
    );
    
    if (filtered.length === 0) {
      filtered = GROUND_PROVIDERS;
    }
  }
  
  return filtered.map((g, i) => ({
    id: `ground-${i}`,
    type: g.type,
    provider: g.provider,
    price: g.basePrice + Math.floor(Math.random() * 15) - 5,
    description: g.type === "Rental Car" 
      ? "Per day rate, compact car" 
      : g.type === "Public Transit"
        ? `${g.provider} from airport to ${city || "downtown"}`
        : `Estimated fare from airport to ${city || "city center"}`,
    tags: i === 0 ? ["Recommended", ...g.tags] : g.tags,
  }));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const searchType = url.searchParams.get('type') || 'all';
    const query = url.searchParams.get('q') || '';
    const city = url.searchParams.get('city') || '';
    const origin = url.searchParams.get('origin') || '';
    const dest = url.searchParams.get('dest') || '';
    const checkIn = url.searchParams.get('checkIn') || '';
    const checkOut = url.searchParams.get('checkOut') || '';
    const date = url.searchParams.get('date') || '';

    console.log(`Search request: type=${searchType}, query=${query}, city=${city}`);

    let results: any = {};

    switch (searchType) {
      case 'flights':
        results = {
          flights: generateFlights(query, origin, dest, date),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;
      
      case 'hotels':
        results = {
          hotels: generateHotels(query, city, checkIn, checkOut),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;
      
      case 'ground':
        results = {
          ground: generateGround(query, city, date),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;
      
      case 'all':
      default:
        results = {
          flights: generateFlights(query, origin, dest, date).slice(0, 10),
          hotels: generateHotels(query, city, checkIn, checkOut).slice(0, 10),
          ground: generateGround(query, city, date),
          cached: false,
          timestamp: new Date().toISOString(),
        };
        break;
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Search failed', details: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
