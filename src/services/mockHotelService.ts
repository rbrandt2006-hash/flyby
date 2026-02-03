import type { HotelOption } from "@/components/chats/booking/types";

// Hotel brand configurations for realistic generation
const hotelBrands = [
  { name: "Marriott", tier: "upscale", basePrice: 220, rating: 4.3 },
  { name: "Hilton", tier: "upscale", basePrice: 210, rating: 4.2 },
  { name: "Hyatt", tier: "upscale", basePrice: 230, rating: 4.4 },
  { name: "Westin", tier: "upscale", basePrice: 245, rating: 4.5 },
  { name: "Sheraton", tier: "upscale", basePrice: 195, rating: 4.1 },
  { name: "Doubletree", tier: "upper-midscale", basePrice: 165, rating: 4.0 },
  { name: "Courtyard", tier: "upper-midscale", basePrice: 155, rating: 4.0 },
  { name: "Hampton Inn", tier: "midscale", basePrice: 135, rating: 4.1 },
  { name: "Holiday Inn", tier: "midscale", basePrice: 140, rating: 3.9 },
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
];

// High-quality hotel images (unique per hotel via index modulo)
const hotelImages = {
  exterior: [
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
  ],
  interior: [
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
  ],
  amenities: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop",
  ],
};

// City-specific hotel catalog
interface CityHotelData {
  neighborhoods: string[];
  priceMultiplier: number; // Adjust for city cost of living
  hotels: Array<{
    name: string;
    brand: string;
    neighborhood: string;
    pricePerNight: number;
    rating: number;
    reviewCount: number;
    policyCompliant: boolean;
    tags: string[];
    amenities: string[];
    distanceToVenue: string;
  }>;
}

const cityHotelCatalog: Record<string, CityHotelData> = {
  "san francisco": {
    neighborhoods: ["Union Square", "Financial District", "SOMA", "Embarcadero", "Fisherman's Wharf", "Nob Hill", "Marina District"],
    priceMultiplier: 1.3,
    hotels: [
      { name: "The Westin St. Francis", brand: "Westin", neighborhood: "Union Square", pricePerNight: 289, rating: 4.5, reviewCount: 2847, policyCompliant: true, tags: ["Recommended", "Closest"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Bar", "Room Service"], distanceToVenue: "0.2 mi" },
      { name: "Marriott Marquis", brand: "Marriott", neighborhood: "SOMA", pricePerNight: 265, rating: 4.3, reviewCount: 3201, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.5 mi" },
      { name: "Hilton Financial District", brand: "Hilton", neighborhood: "Financial District", pricePerNight: 245, rating: 4.2, reviewCount: 1892, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Gym", "Business center"], distanceToVenue: "0.3 mi" },
      { name: "Hyatt Regency Embarcadero", brand: "Hyatt", neighborhood: "Embarcadero", pricePerNight: 279, rating: 4.4, reviewCount: 2156, policyCompliant: true, tags: ["Great views"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Waterfront views"], distanceToVenue: "0.6 mi" },
      { name: "Four Seasons San Francisco", brand: "Four Seasons", neighborhood: "SOMA", pricePerNight: 595, rating: 4.8, reviewCount: 1245, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Fine dining", "Concierge", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Hotel Nikko", brand: "Boutique", neighborhood: "Union Square", pricePerNight: 225, rating: 4.3, reviewCount: 1678, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Pool", "Gym"], distanceToVenue: "0.3 mi" },
      { name: "The Ritz-Carlton", brand: "Ritz-Carlton", neighborhood: "Nob Hill", pricePerNight: 545, rating: 4.7, reviewCount: 987, policyCompliant: false, tags: ["Luxury", "Premium"], amenities: ["Spa", "Fine dining", "Club lounge", "Valet"], distanceToVenue: "0.8 mi" },
      { name: "Courtyard Downtown", brand: "Courtyard", neighborhood: "SOMA", pricePerNight: 189, rating: 4.0, reviewCount: 1432, policyCompliant: true, tags: ["Best value", "Policy compliant"], amenities: ["Free Wi-Fi", "Gym", "Business center"], distanceToVenue: "0.7 mi" },
      { name: "W San Francisco", brand: "W Hotel", neighborhood: "SOMA", pricePerNight: 385, rating: 4.4, reviewCount: 1567, policyCompliant: false, tags: ["Trendy"], amenities: ["Bar", "Restaurant", "Gym", "Rooftop"], distanceToVenue: "0.5 mi" },
      { name: "Kimpton Sir Francis Drake", brand: "Kimpton", neighborhood: "Union Square", pricePerNight: 275, rating: 4.3, reviewCount: 1823, policyCompliant: true, tags: ["Historic", "Boutique"], amenities: ["Free Wi-Fi", "Restaurant", "Bar"], distanceToVenue: "0.2 mi" },
      { name: "Hampton Inn Fisherman's Wharf", brand: "Hampton Inn", neighborhood: "Fisherman's Wharf", pricePerNight: 179, rating: 4.1, reviewCount: 2134, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "1.2 mi" },
      { name: "InterContinental Mark Hopkins", brand: "InterContinental", neighborhood: "Nob Hill", pricePerNight: 295, rating: 4.5, reviewCount: 1456, policyCompliant: true, tags: ["Historic", "Great views"], amenities: ["Restaurant", "Bar", "Gym", "City views"], distanceToVenue: "0.7 mi" },
    ],
  },
  "new york": {
    neighborhoods: ["Midtown", "Times Square", "Financial District", "Chelsea", "Upper East Side", "SoHo", "Tribeca"],
    priceMultiplier: 1.4,
    hotels: [
      { name: "The Plaza", brand: "Fairmont", neighborhood: "Midtown", pricePerNight: 695, rating: 4.7, reviewCount: 3456, policyCompliant: false, tags: ["Luxury", "Iconic"], amenities: ["Spa", "Fine dining", "Concierge", "Central Park views"], distanceToVenue: "0.3 mi" },
      { name: "New York Marriott Marquis", brand: "Marriott", neighborhood: "Times Square", pricePerNight: 329, rating: 4.3, reviewCount: 4521, policyCompliant: true, tags: ["Recommended", "Central location"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Broadway views"], distanceToVenue: "0.1 mi" },
      { name: "Hilton Midtown", brand: "Hilton", neighborhood: "Midtown", pricePerNight: 289, rating: 4.2, reviewCount: 3892, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Business center"], distanceToVenue: "0.4 mi" },
      { name: "The Westin New York", brand: "Westin", neighborhood: "Times Square", pricePerNight: 315, rating: 4.4, reviewCount: 2678, policyCompliant: true, tags: ["Closest"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.2 mi" },
      { name: "Park Hyatt New York", brand: "Hyatt", neighborhood: "Midtown", pricePerNight: 575, rating: 4.8, reviewCount: 1234, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Fine dining", "Pool", "City views"], distanceToVenue: "0.5 mi" },
      { name: "Courtyard Times Square", brand: "Courtyard", neighborhood: "Times Square", pricePerNight: 249, rating: 4.0, reviewCount: 2345, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.3 mi" },
      { name: "The Standard High Line", brand: "Boutique", neighborhood: "Chelsea", pricePerNight: 345, rating: 4.4, reviewCount: 1567, policyCompliant: false, tags: ["Trendy", "Views"], amenities: ["Rooftop bar", "Restaurant", "Gym"], distanceToVenue: "0.8 mi" },
      { name: "Four Seasons Downtown", brand: "Four Seasons", neighborhood: "Tribeca", pricePerNight: 625, rating: 4.8, reviewCount: 987, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining", "Concierge"], distanceToVenue: "1.2 mi" },
      { name: "Hampton Inn Times Square", brand: "Hampton Inn", neighborhood: "Times Square", pricePerNight: 219, rating: 4.0, reviewCount: 3210, policyCompliant: true, tags: ["Great breakfast", "Policy compliant"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Conrad Downtown", brand: "Conrad", neighborhood: "Financial District", pricePerNight: 385, rating: 4.5, reviewCount: 1678, policyCompliant: true, tags: ["Premium", "Business"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Harbor views"], distanceToVenue: "1.5 mi" },
      { name: "Hyatt Grand Central", brand: "Hyatt", neighborhood: "Midtown", pricePerNight: 295, rating: 4.3, reviewCount: 2134, policyCompliant: true, tags: ["Convenient"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.6 mi" },
      { name: "The Langham Fifth Avenue", brand: "Langham", neighborhood: "Midtown", pricePerNight: 495, rating: 4.6, reviewCount: 1123, policyCompliant: false, tags: ["Luxury", "Elegant"], amenities: ["Spa", "Fine dining", "Afternoon tea"], distanceToVenue: "0.4 mi" },
    ],
  },
  "seattle": {
    neighborhoods: ["Downtown", "Pike Place", "Capitol Hill", "Belltown", "South Lake Union", "Pioneer Square"],
    priceMultiplier: 1.1,
    hotels: [
      { name: "The Fairmont Olympic", brand: "Fairmont", neighborhood: "Downtown", pricePerNight: 349, rating: 4.7, reviewCount: 1923, policyCompliant: true, tags: ["Recommended", "Historic"], amenities: ["Pool", "Spa", "Restaurant", "Gym"], distanceToVenue: "0.2 mi" },
      { name: "Hyatt Regency Seattle", brand: "Hyatt", neighborhood: "Downtown", pricePerNight: 259, rating: 4.3, reviewCount: 2456, policyCompliant: true, tags: ["Policy compliant", "Central"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.3 mi" },
      { name: "The Westin Seattle", brand: "Westin", neighborhood: "Downtown", pricePerNight: 275, rating: 4.4, reviewCount: 2134, policyCompliant: true, tags: ["Closest"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.1 mi" },
      { name: "Hilton Seattle", brand: "Hilton", neighborhood: "Downtown", pricePerNight: 235, rating: 4.2, reviewCount: 1876, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.4 mi" },
      { name: "Four Seasons Seattle", brand: "Four Seasons", neighborhood: "Downtown", pricePerNight: 495, rating: 4.8, reviewCount: 876, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining", "City views"], distanceToVenue: "0.5 mi" },
      { name: "Marriott Waterfront", brand: "Marriott", neighborhood: "Pike Place", pricePerNight: 289, rating: 4.4, reviewCount: 1567, policyCompliant: true, tags: ["Waterfront", "Views"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Harbor views"], distanceToVenue: "0.6 mi" },
      { name: "Thompson Seattle", brand: "Boutique", neighborhood: "Pike Place", pricePerNight: 315, rating: 4.5, reviewCount: 1234, policyCompliant: true, tags: ["Trendy", "Rooftop"], amenities: ["Rooftop bar", "Restaurant", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Courtyard Pioneer Square", brand: "Courtyard", neighborhood: "Pioneer Square", pricePerNight: 179, rating: 4.0, reviewCount: 987, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym"], distanceToVenue: "0.7 mi" },
      { name: "Hampton Inn Downtown", brand: "Hampton Inn", neighborhood: "Downtown", pricePerNight: 169, rating: 4.1, reviewCount: 1456, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "Hotel 1000", brand: "Boutique", neighborhood: "Downtown", pricePerNight: 285, rating: 4.4, reviewCount: 1123, policyCompliant: true, tags: ["Tech-forward"], amenities: ["Virtual golf", "Spa", "Restaurant"], distanceToVenue: "0.3 mi" },
    ],
  },
  "chicago": {
    neighborhoods: ["The Loop", "Magnificent Mile", "River North", "Gold Coast", "West Loop", "Streeterville"],
    priceMultiplier: 1.15,
    hotels: [
      { name: "The Peninsula Chicago", brand: "Peninsula", neighborhood: "Magnificent Mile", pricePerNight: 545, rating: 4.8, reviewCount: 1234, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining", "City views"], distanceToVenue: "0.3 mi" },
      { name: "Chicago Marriott Downtown", brand: "Marriott", neighborhood: "Magnificent Mile", pricePerNight: 275, rating: 4.3, reviewCount: 3456, policyCompliant: true, tags: ["Recommended"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.2 mi" },
      { name: "Hyatt Regency Chicago", brand: "Hyatt", neighborhood: "The Loop", pricePerNight: 245, rating: 4.2, reviewCount: 4521, policyCompliant: true, tags: ["Policy compliant", "Largest"], amenities: ["Free Wi-Fi", "Gym", "Restaurant", "River views"], distanceToVenue: "0.4 mi" },
      { name: "The Westin Michigan Avenue", brand: "Westin", neighborhood: "Magnificent Mile", pricePerNight: 295, rating: 4.4, reviewCount: 2134, policyCompliant: true, tags: ["Closest", "Shopping"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.1 mi" },
      { name: "Hilton Chicago", brand: "Hilton", neighborhood: "The Loop", pricePerNight: 225, rating: 4.1, reviewCount: 3789, policyCompliant: true, tags: ["Best value", "Historic"], amenities: ["Free Wi-Fi", "Pool", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "Four Seasons Chicago", brand: "Four Seasons", neighborhood: "Magnificent Mile", pricePerNight: 575, rating: 4.8, reviewCount: 987, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining"], distanceToVenue: "0.3 mi" },
      { name: "The Langham Chicago", brand: "Langham", neighborhood: "River North", pricePerNight: 425, rating: 4.7, reviewCount: 1123, policyCompliant: false, tags: ["Luxury", "River views"], amenities: ["Spa", "Pool", "Fine dining", "Afternoon tea"], distanceToVenue: "0.6 mi" },
      { name: "Courtyard Magnificent Mile", brand: "Courtyard", neighborhood: "Magnificent Mile", pricePerNight: 189, rating: 4.0, reviewCount: 1567, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Hampton Inn Chicago Downtown", brand: "Hampton Inn", neighborhood: "The Loop", pricePerNight: 159, rating: 4.0, reviewCount: 2345, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "0.6 mi" },
      { name: "Kimpton Gray Hotel", brand: "Kimpton", neighborhood: "The Loop", pricePerNight: 265, rating: 4.4, reviewCount: 1234, policyCompliant: true, tags: ["Boutique", "Historic"], amenities: ["Restaurant", "Bar", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "W Chicago Lakeshore", brand: "W Hotel", neighborhood: "Streeterville", pricePerNight: 335, rating: 4.3, reviewCount: 1678, policyCompliant: false, tags: ["Lake views", "Trendy"], amenities: ["Bar", "Restaurant", "Gym", "Lake views"], distanceToVenue: "0.7 mi" },
    ],
  },
  "los angeles": {
    neighborhoods: ["Downtown", "Beverly Hills", "Santa Monica", "Hollywood", "Century City", "West Hollywood", "LAX Area"],
    priceMultiplier: 1.2,
    hotels: [
      { name: "The Beverly Hilton", brand: "Hilton", neighborhood: "Beverly Hills", pricePerNight: 375, rating: 4.4, reviewCount: 2345, policyCompliant: true, tags: ["Iconic", "Pool"], amenities: ["Pool", "Spa", "Restaurant", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "JW Marriott LA Live", brand: "JW Marriott", neighborhood: "Downtown", pricePerNight: 295, rating: 4.5, reviewCount: 3456, policyCompliant: true, tags: ["Recommended", "Entertainment"], amenities: ["Free Wi-Fi", "Pool", "Spa", "Restaurant"], distanceToVenue: "0.2 mi" },
      { name: "The Westin Bonaventure", brand: "Westin", neighborhood: "Downtown", pricePerNight: 245, rating: 4.2, reviewCount: 2789, policyCompliant: true, tags: ["Iconic", "Policy compliant"], amenities: ["Pool", "Gym", "Restaurant", "City views"], distanceToVenue: "0.3 mi" },
      { name: "Hyatt Regency Century City", brand: "Hyatt", neighborhood: "Century City", pricePerNight: 265, rating: 4.3, reviewCount: 1567, policyCompliant: true, tags: ["Business", "Closest"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.1 mi" },
      { name: "Four Seasons Beverly Wilshire", brand: "Four Seasons", neighborhood: "Beverly Hills", pricePerNight: 695, rating: 4.9, reviewCount: 1234, policyCompliant: false, tags: ["Luxury", "Iconic"], amenities: ["Spa", "Pool", "Fine dining", "Concierge"], distanceToVenue: "0.8 mi" },
      { name: "Shutters on the Beach", brand: "Boutique", neighborhood: "Santa Monica", pricePerNight: 545, rating: 4.7, reviewCount: 987, policyCompliant: false, tags: ["Beachfront", "Luxury"], amenities: ["Beach access", "Spa", "Restaurant"], distanceToVenue: "1.5 mi" },
      { name: "The London West Hollywood", brand: "Boutique", neighborhood: "West Hollywood", pricePerNight: 385, rating: 4.5, reviewCount: 1456, policyCompliant: false, tags: ["Celebrity", "Rooftop"], amenities: ["Rooftop pool", "Restaurant", "Gym"], distanceToVenue: "1.0 mi" },
      { name: "Courtyard Century City", brand: "Courtyard", neighborhood: "Century City", pricePerNight: 199, rating: 4.0, reviewCount: 1234, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Pool", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Hampton Inn LAX", brand: "Hampton Inn", neighborhood: "LAX Area", pricePerNight: 149, rating: 4.0, reviewCount: 2567, policyCompliant: true, tags: ["Great breakfast", "Airport"], amenities: ["Free breakfast", "Free Wi-Fi", "Shuttle"], distanceToVenue: "2.0 mi" },
      { name: "W Hollywood", brand: "W Hotel", neighborhood: "Hollywood", pricePerNight: 365, rating: 4.4, reviewCount: 1789, policyCompliant: false, tags: ["Trendy", "Rooftop"], amenities: ["Rooftop pool", "Bar", "Restaurant"], distanceToVenue: "0.9 mi" },
      { name: "Hilton Santa Monica", brand: "Hilton", neighborhood: "Santa Monica", pricePerNight: 285, rating: 4.3, reviewCount: 1567, policyCompliant: true, tags: ["Beach nearby"], amenities: ["Pool", "Gym", "Restaurant"], distanceToVenue: "1.3 mi" },
    ],
  },
  "austin": {
    neighborhoods: ["Downtown", "East Austin", "South Congress", "Domain", "Rainey Street", "University Area"],
    priceMultiplier: 1.0,
    hotels: [
      { name: "The Driskill", brand: "Boutique", neighborhood: "Downtown", pricePerNight: 295, rating: 4.5, reviewCount: 1567, policyCompliant: true, tags: ["Historic", "Recommended"], amenities: ["Restaurant", "Bar", "Gym"], distanceToVenue: "0.2 mi" },
      { name: "JW Marriott Austin", brand: "JW Marriott", neighborhood: "Downtown", pricePerNight: 325, rating: 4.6, reviewCount: 2345, policyCompliant: true, tags: ["Closest", "Premium"], amenities: ["Pool", "Spa", "Restaurant", "Gym"], distanceToVenue: "0.1 mi" },
      { name: "Hyatt Regency Austin", brand: "Hyatt", neighborhood: "Downtown", pricePerNight: 245, rating: 4.3, reviewCount: 1892, policyCompliant: true, tags: ["Lake views", "Policy compliant"], amenities: ["Pool", "Gym", "Restaurant", "Lake views"], distanceToVenue: "0.4 mi" },
      { name: "Hilton Austin", brand: "Hilton", neighborhood: "Downtown", pricePerNight: 225, rating: 4.2, reviewCount: 2134, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Pool", "Gym"], distanceToVenue: "0.3 mi" },
      { name: "Four Seasons Austin", brand: "Four Seasons", neighborhood: "Downtown", pricePerNight: 475, rating: 4.8, reviewCount: 876, policyCompliant: false, tags: ["Luxury", "Lakefront"], amenities: ["Spa", "Pool", "Fine dining", "Lake views"], distanceToVenue: "0.5 mi" },
      { name: "Kimpton Hotel Van Zandt", brand: "Kimpton", neighborhood: "Rainey Street", pricePerNight: 275, rating: 4.4, reviewCount: 1234, policyCompliant: true, tags: ["Music", "Trendy"], amenities: ["Pool", "Restaurant", "Live music"], distanceToVenue: "0.6 mi" },
      { name: "W Austin", brand: "W Hotel", neighborhood: "Downtown", pricePerNight: 345, rating: 4.4, reviewCount: 1567, policyCompliant: false, tags: ["Trendy", "Music"], amenities: ["Pool", "Bar", "Restaurant"], distanceToVenue: "0.3 mi" },
      { name: "Courtyard Downtown", brand: "Courtyard", neighborhood: "Downtown", pricePerNight: 179, rating: 4.0, reviewCount: 987, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "Hampton Inn Domain", brand: "Hampton Inn", neighborhood: "Domain", pricePerNight: 159, rating: 4.1, reviewCount: 1456, policyCompliant: true, tags: ["Great breakfast", "Shopping"], amenities: ["Free breakfast", "Free Wi-Fi", "Pool"], distanceToVenue: "1.2 mi" },
      { name: "Hotel Saint Cecilia", brand: "Boutique", neighborhood: "South Congress", pricePerNight: 425, rating: 4.7, reviewCount: 567, policyCompliant: false, tags: ["Boutique", "Artistic"], amenities: ["Pool", "Garden", "Vinyl collection"], distanceToVenue: "0.8 mi" },
    ],
  },
  "boston": {
    neighborhoods: ["Back Bay", "Downtown", "Seaport", "Cambridge", "Beacon Hill", "Fenway"],
    priceMultiplier: 1.2,
    hotels: [
      { name: "Four Seasons Boston", brand: "Four Seasons", neighborhood: "Back Bay", pricePerNight: 545, rating: 4.8, reviewCount: 1234, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining", "Garden views"], distanceToVenue: "0.3 mi" },
      { name: "The Westin Copley Place", brand: "Westin", neighborhood: "Back Bay", pricePerNight: 295, rating: 4.4, reviewCount: 2567, policyCompliant: true, tags: ["Recommended", "Shopping"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.2 mi" },
      { name: "Boston Marriott Copley", brand: "Marriott", neighborhood: "Back Bay", pricePerNight: 275, rating: 4.3, reviewCount: 3456, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.3 mi" },
      { name: "Hyatt Regency Boston", brand: "Hyatt", neighborhood: "Downtown", pricePerNight: 255, rating: 4.2, reviewCount: 1892, policyCompliant: true, tags: ["Closest"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.1 mi" },
      { name: "Seaport Hotel", brand: "Boutique", neighborhood: "Seaport", pricePerNight: 285, rating: 4.4, reviewCount: 1567, policyCompliant: true, tags: ["Waterfront"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Harbor views"], distanceToVenue: "0.7 mi" },
      { name: "The Liberty Hotel", brand: "Boutique", neighborhood: "Beacon Hill", pricePerNight: 345, rating: 4.5, reviewCount: 1234, policyCompliant: false, tags: ["Historic", "Unique"], amenities: ["Restaurant", "Bar", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "Courtyard Downtown", brand: "Courtyard", neighborhood: "Downtown", pricePerNight: 199, rating: 4.0, reviewCount: 1123, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Hampton Inn Seaport", brand: "Hampton Inn", neighborhood: "Seaport", pricePerNight: 189, rating: 4.1, reviewCount: 1678, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "0.8 mi" },
      { name: "The Charles Hotel", brand: "Boutique", neighborhood: "Cambridge", pricePerNight: 325, rating: 4.5, reviewCount: 987, policyCompliant: true, tags: ["Harvard Square"], amenities: ["Spa", "Restaurant", "Jazz bar"], distanceToVenue: "1.5 mi" },
      { name: "Hilton Back Bay", brand: "Hilton", neighborhood: "Back Bay", pricePerNight: 245, rating: 4.2, reviewCount: 2134, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.4 mi" },
    ],
  },
  "denver": {
    neighborhoods: ["Downtown", "LoDo", "RiNo", "Cherry Creek", "Capitol Hill", "Union Station"],
    priceMultiplier: 0.95,
    hotels: [
      { name: "The Brown Palace", brand: "Marriott Autograph", neighborhood: "Downtown", pricePerNight: 295, rating: 4.6, reviewCount: 1567, policyCompliant: true, tags: ["Historic", "Recommended"], amenities: ["Restaurant", "Spa", "Afternoon tea"], distanceToVenue: "0.2 mi" },
      { name: "Four Seasons Denver", brand: "Four Seasons", neighborhood: "Downtown", pricePerNight: 475, rating: 4.8, reviewCount: 876, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining", "Mountain views"], distanceToVenue: "0.3 mi" },
      { name: "The Crawford Hotel", brand: "Boutique", neighborhood: "Union Station", pricePerNight: 285, rating: 4.5, reviewCount: 1234, policyCompliant: true, tags: ["Unique", "Union Station"], amenities: ["Restaurant", "Bar", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Hyatt Regency Denver", brand: "Hyatt", neighborhood: "Downtown", pricePerNight: 235, rating: 4.3, reviewCount: 2345, policyCompliant: true, tags: ["Policy compliant", "Closest"], amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant"], distanceToVenue: "0.1 mi" },
      { name: "Denver Marriott City Center", brand: "Marriott", neighborhood: "Downtown", pricePerNight: 225, rating: 4.2, reviewCount: 1892, policyCompliant: true, tags: ["Best value"], amenities: ["Free Wi-Fi", "Pool", "Gym"], distanceToVenue: "0.3 mi" },
      { name: "Kimpton Hotel Monaco", brand: "Kimpton", neighborhood: "Downtown", pricePerNight: 265, rating: 4.4, reviewCount: 1123, policyCompliant: true, tags: ["Boutique", "Pet-friendly"], amenities: ["Restaurant", "Bar", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Courtyard Cherry Creek", brand: "Courtyard", neighborhood: "Cherry Creek", pricePerNight: 175, rating: 4.0, reviewCount: 987, policyCompliant: true, tags: ["Shopping"], amenities: ["Free Wi-Fi", "Gym"], distanceToVenue: "0.9 mi" },
      { name: "Hampton Inn Downtown", brand: "Hampton Inn", neighborhood: "Downtown", pricePerNight: 155, rating: 4.1, reviewCount: 1567, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "The Maven at Dairy Block", brand: "Boutique", neighborhood: "LoDo", pricePerNight: 275, rating: 4.4, reviewCount: 876, policyCompliant: true, tags: ["Trendy", "Food hall"], amenities: ["Restaurant", "Bar", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "Hilton Denver City Center", brand: "Hilton", neighborhood: "Downtown", pricePerNight: 215, rating: 4.1, reviewCount: 1678, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym", "Restaurant"], distanceToVenue: "0.3 mi" },
    ],
  },
  "miami": {
    neighborhoods: ["South Beach", "Downtown", "Brickell", "Miami Beach", "Coral Gables", "Coconut Grove"],
    priceMultiplier: 1.15,
    hotels: [
      { name: "Faena Miami Beach", brand: "Faena", neighborhood: "Miami Beach", pricePerNight: 595, rating: 4.7, reviewCount: 876, policyCompliant: false, tags: ["Luxury", "Beachfront"], amenities: ["Beach", "Spa", "Pool", "Fine dining"], distanceToVenue: "0.8 mi" },
      { name: "Four Seasons Surf Club", brand: "Four Seasons", neighborhood: "Miami Beach", pricePerNight: 695, rating: 4.8, reviewCount: 654, policyCompliant: false, tags: ["Luxury", "Historic"], amenities: ["Beach", "Spa", "Pool", "Fine dining"], distanceToVenue: "1.0 mi" },
      { name: "JW Marriott Miami", brand: "JW Marriott", neighborhood: "Brickell", pricePerNight: 295, rating: 4.4, reviewCount: 2345, policyCompliant: true, tags: ["Recommended", "Business"], amenities: ["Pool", "Spa", "Restaurant", "City views"], distanceToVenue: "0.2 mi" },
      { name: "Hyatt Regency Miami", brand: "Hyatt", neighborhood: "Downtown", pricePerNight: 245, rating: 4.2, reviewCount: 1892, policyCompliant: true, tags: ["Policy compliant", "Closest"], amenities: ["Pool", "Gym", "Restaurant", "River views"], distanceToVenue: "0.1 mi" },
      { name: "W South Beach", brand: "W Hotel", neighborhood: "South Beach", pricePerNight: 425, rating: 4.5, reviewCount: 1567, policyCompliant: false, tags: ["Trendy", "Beachfront"], amenities: ["Beach", "Pool", "Bar", "Restaurant"], distanceToVenue: "0.6 mi" },
      { name: "The Setai", brand: "Boutique", neighborhood: "South Beach", pricePerNight: 575, rating: 4.7, reviewCount: 987, policyCompliant: false, tags: ["Luxury", "Asian-inspired"], amenities: ["Beach", "Pool", "Spa", "Restaurant"], distanceToVenue: "0.7 mi" },
      { name: "Marriott Biscayne Bay", brand: "Marriott", neighborhood: "Downtown", pricePerNight: 225, rating: 4.1, reviewCount: 1678, policyCompliant: true, tags: ["Best value", "Bay views"], amenities: ["Pool", "Gym", "Restaurant"], distanceToVenue: "0.3 mi" },
      { name: "Hampton Inn Brickell", brand: "Hampton Inn", neighborhood: "Brickell", pricePerNight: 185, rating: 4.0, reviewCount: 1234, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Pool"], distanceToVenue: "0.4 mi" },
      { name: "Kimpton EPIC Hotel", brand: "Kimpton", neighborhood: "Downtown", pricePerNight: 285, rating: 4.4, reviewCount: 1345, policyCompliant: true, tags: ["Rooftop pool"], amenities: ["Pool", "Spa", "Restaurant", "Bay views"], distanceToVenue: "0.3 mi" },
      { name: "The Biltmore", brand: "Boutique", neighborhood: "Coral Gables", pricePerNight: 345, rating: 4.5, reviewCount: 1567, policyCompliant: false, tags: ["Historic", "Golf"], amenities: ["Pool", "Golf", "Spa", "Restaurant"], distanceToVenue: "1.5 mi" },
    ],
  },
  "atlanta": {
    neighborhoods: ["Downtown", "Midtown", "Buckhead", "Perimeter", "Atlantic Station", "Virginia-Highland"],
    priceMultiplier: 0.9,
    hotels: [
      { name: "The St. Regis Atlanta", brand: "St. Regis", neighborhood: "Buckhead", pricePerNight: 445, rating: 4.7, reviewCount: 876, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining", "Butler service"], distanceToVenue: "1.0 mi" },
      { name: "Loews Atlanta", brand: "Loews", neighborhood: "Midtown", pricePerNight: 275, rating: 4.4, reviewCount: 1567, policyCompliant: true, tags: ["Recommended"], amenities: ["Pool", "Spa", "Restaurant"], distanceToVenue: "0.3 mi" },
      { name: "Atlanta Marriott Marquis", brand: "Marriott", neighborhood: "Downtown", pricePerNight: 245, rating: 4.3, reviewCount: 3456, policyCompliant: true, tags: ["Iconic", "Policy compliant"], amenities: ["Pool", "Gym", "Restaurant"], distanceToVenue: "0.2 mi" },
      { name: "Hyatt Regency Atlanta", brand: "Hyatt", neighborhood: "Downtown", pricePerNight: 215, rating: 4.1, reviewCount: 2789, policyCompliant: true, tags: ["Closest", "Best value"], amenities: ["Pool", "Gym", "Restaurant"], distanceToVenue: "0.1 mi" },
      { name: "Four Seasons Atlanta", brand: "Four Seasons", neighborhood: "Midtown", pricePerNight: 475, rating: 4.8, reviewCount: 654, policyCompliant: false, tags: ["Luxury"], amenities: ["Spa", "Pool", "Fine dining"], distanceToVenue: "0.5 mi" },
      { name: "W Atlanta Midtown", brand: "W Hotel", neighborhood: "Midtown", pricePerNight: 285, rating: 4.3, reviewCount: 1234, policyCompliant: false, tags: ["Trendy"], amenities: ["Pool", "Bar", "Restaurant"], distanceToVenue: "0.4 mi" },
      { name: "The Ritz-Carlton Buckhead", brand: "Ritz-Carlton", neighborhood: "Buckhead", pricePerNight: 395, rating: 4.6, reviewCount: 987, policyCompliant: false, tags: ["Luxury", "Shopping"], amenities: ["Spa", "Restaurant", "Concierge"], distanceToVenue: "1.2 mi" },
      { name: "Courtyard Midtown", brand: "Courtyard", neighborhood: "Midtown", pricePerNight: 165, rating: 4.0, reviewCount: 1123, policyCompliant: true, tags: ["Policy compliant"], amenities: ["Free Wi-Fi", "Gym"], distanceToVenue: "0.5 mi" },
      { name: "Hampton Inn Downtown", brand: "Hampton Inn", neighborhood: "Downtown", pricePerNight: 145, rating: 4.1, reviewCount: 1789, policyCompliant: true, tags: ["Great breakfast"], amenities: ["Free breakfast", "Free Wi-Fi", "Gym"], distanceToVenue: "0.4 mi" },
      { name: "Kimpton Sylvan Hotel", brand: "Kimpton", neighborhood: "Buckhead", pricePerNight: 255, rating: 4.4, reviewCount: 567, policyCompliant: true, tags: ["New", "Boutique"], amenities: ["Pool", "Restaurant", "Bar"], distanceToVenue: "0.9 mi" },
    ],
  },
};

// Generate unique images for a hotel based on its index
function getHotelImages(hotelIndex: number): string[] {
  const extIdx1 = hotelIndex % hotelImages.exterior.length;
  const extIdx2 = (hotelIndex + 3) % hotelImages.exterior.length;
  const intIdx1 = hotelIndex % hotelImages.interior.length;
  const intIdx2 = (hotelIndex + 4) % hotelImages.interior.length;
  const intIdx3 = (hotelIndex + 7) % hotelImages.interior.length;
  
  return [
    hotelImages.exterior[extIdx1],
    hotelImages.interior[intIdx1],
    hotelImages.interior[intIdx2],
    hotelImages.exterior[extIdx2],
    hotelImages.interior[intIdx3],
  ];
}

// Generate a programmatic hotel when catalog is insufficient
function generateProgrammaticHotel(
  city: string,
  neighborhood: string,
  index: number,
  priceMultiplier: number
): HotelOption {
  const brand = hotelBrands[index % hotelBrands.length];
  const priceVariation = 0.85 + Math.random() * 0.3; // 85%-115% of base
  const pricePerNight = Math.round(brand.basePrice * priceMultiplier * priceVariation);
  const ratingVariation = (Math.random() - 0.5) * 0.4; // ±0.2
  const rating = Math.min(5, Math.max(3.5, brand.rating + ratingVariation));
  
  const hotelName = `${brand.name} ${neighborhood}`;
  const reviewCount = 500 + Math.floor(Math.random() * 2500);
  const policyCompliant = brand.tier !== "luxury" && pricePerNight < 350;
  
  const tags: string[] = [];
  if (policyCompliant) tags.push("Policy compliant");
  if (pricePerNight < 180) tags.push("Best value");
  if (brand.tier === "luxury") tags.push("Luxury");
  if (index === 0) tags.push("Recommended");
  
  const amenitiesByTier: Record<string, string[]> = {
    "luxury": ["Spa", "Pool", "Fine dining", "Concierge", "Valet parking"],
    "upscale": ["Free Wi-Fi", "Pool", "Gym", "Restaurant", "Room service"],
    "upper-midscale": ["Free Wi-Fi", "Pool", "Gym", "Restaurant"],
    "midscale": ["Free breakfast", "Free Wi-Fi", "Gym"],
    "select": ["Free Wi-Fi", "Gym", "Bar"],
    "extended-stay": ["Free Wi-Fi", "Kitchen", "Gym", "Laundry"],
    "boutique": ["Free Wi-Fi", "Restaurant", "Bar", "Unique design"],
  };
  
  return {
    id: `gen_${city.replace(/\s/g, "_")}_${index}`,
    name: hotelName,
    area: neighborhood,
    pricePerNight,
    totalPrice: pricePerNight * 2, // Will be recalculated
    rating: Math.round(rating * 10) / 10,
    distanceToVenue: `${(0.2 + Math.random() * 1.3).toFixed(1)} mi`,
    tags,
    images: getHotelImages(index + 100), // Offset to get different images
    amenities: amenitiesByTier[brand.tier] || ["Free Wi-Fi", "Gym"],
    reviewCount,
    description: `Experience ${brand.tier === "luxury" ? "luxury" : "comfort"} at ${hotelName}, located in the ${neighborhood} area.`,
    cancellationPolicy: policyCompliant ? "Free cancellation until 24h before check-in" : "Non-refundable",
    roomTypes: ["Standard King", "Double Queen", "Suite"],
  };
}

// Normalize city name for lookup
function normalizeCity(destination: string): string {
  const cityPart = destination.split(",")[0].trim().toLowerCase();
  
  // Handle common variations
  const cityMappings: Record<string, string> = {
    "sf": "san francisco",
    "nyc": "new york",
    "la": "los angeles",
    "chi-town": "chicago",
    "atl": "atlanta",
  };
  
  return cityMappings[cityPart] || cityPart;
}

// Main function to get hotels for a destination
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
  const cityData = cityHotelCatalog[normalizedCity];
  
  let hotels: HotelOption[] = [];
  
  if (cityData) {
    // Convert catalog hotels to HotelOption format
    hotels = cityData.hotels.map((hotel, index) => ({
      id: `${normalizedCity.replace(/\s/g, "_")}_${index}`,
      name: hotel.name,
      area: hotel.neighborhood,
      pricePerNight: hotel.pricePerNight,
      totalPrice: hotel.pricePerNight * nights,
      rating: hotel.rating,
      distanceToVenue: hotel.distanceToVenue,
      tags: hotel.tags,
      images: getHotelImages(index),
      amenities: hotel.amenities,
      reviewCount: hotel.reviewCount,
      description: `Discover exceptional service at ${hotel.name} in the heart of ${hotel.neighborhood}.`,
      cancellationPolicy: hotel.policyCompliant ? "Free cancellation until 24h before check-in" : "Non-refundable",
      roomTypes: ["Standard King", "Double Queen", "Suite"],
    }));
    
    // If fewer than 10, generate more
    if (hotels.length < 10) {
      const needed = 10 - hotels.length;
      for (let i = 0; i < needed; i++) {
        const neighborhood = cityData.neighborhoods[i % cityData.neighborhoods.length];
        hotels.push(generateProgrammaticHotel(normalizedCity, neighborhood, hotels.length + i, cityData.priceMultiplier));
      }
    }
  } else {
    // Unknown city - generate hotels programmatically
    const genericNeighborhoods = ["Downtown", "Business District", "City Center", "Airport Area", "Convention Center"];
    for (let i = 0; i < 12; i++) {
      const neighborhood = genericNeighborhoods[i % genericNeighborhoods.length];
      hotels.push(generateProgrammaticHotel(destination, neighborhood, i, 1.0));
    }
  }
  
  // Update total prices based on nights
  hotels = hotels.map(hotel => ({
    ...hotel,
    totalPrice: hotel.pricePerNight * nights,
  }));
  
  // Apply filters
  if (maxPrice) {
    hotels = hotels.filter(h => h.pricePerNight <= maxPrice);
  }
  
  if (policyCompliantOnly) {
    hotels = hotels.filter(h => h.tags.includes("Policy compliant"));
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

// Get list of supported cities
export function getSupportedCities(): string[] {
  return Object.keys(cityHotelCatalog).map(city => 
    city.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  );
}

// Legacy compatibility: Generate hotels for a simple destination string
export function generateHotelOptions(destination: string, nights: number = 2): HotelOption[] {
  return getHotelsForDestination({ destination, nights });
}
