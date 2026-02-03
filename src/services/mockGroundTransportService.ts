export interface GroundTransportOption {
  id: string;
  type: "rideshare" | "rental" | "public";
  provider: string;
  rideType: string;
  description: string;
  eta: string;
  seats: number;
  priceMin: number;
  priceMax: number;
  price: number; // Average/estimated price
  tags: string[];
  icon: string;
  co2Savings?: string;
}

export interface UberAccount {
  email: string;
  status: "connected" | "disconnected";
  name: string;
  rating: number;
  ridesCompleted: number;
}

// Mock connected Uber account
export const mockUberAccount: UberAccount = {
  email: "demo@flyby.com",
  status: "connected",
  name: "Demo User",
  rating: 4.92,
  ridesCompleted: 147,
};

// Generate mock Uber ride options
export function generateUberOptions(distanceMiles: number = 15): GroundTransportOption[] {
  const basePrice = distanceMiles * 2.5;
  
  return [
    {
      id: "uber-x",
      type: "rideshare",
      provider: "Uber",
      rideType: "UberX",
      description: "Affordable, everyday rides",
      eta: "3 min",
      seats: 4,
      priceMin: Math.round(basePrice * 0.9),
      priceMax: Math.round(basePrice * 1.1),
      price: Math.round(basePrice),
      tags: ["Best value"],
      icon: "🚗",
    },
    {
      id: "uber-comfort",
      type: "rideshare",
      provider: "Uber",
      rideType: "Comfort",
      description: "Newer cars with extra legroom",
      eta: "5 min",
      seats: 4,
      priceMin: Math.round(basePrice * 1.2),
      priceMax: Math.round(basePrice * 1.4),
      price: Math.round(basePrice * 1.3),
      tags: ["Extra legroom"],
      icon: "🚙",
    },
    {
      id: "uber-xl",
      type: "rideshare",
      provider: "Uber",
      rideType: "UberXL",
      description: "Affordable rides for groups up to 6",
      eta: "7 min",
      seats: 6,
      priceMin: Math.round(basePrice * 1.4),
      priceMax: Math.round(basePrice * 1.7),
      price: Math.round(basePrice * 1.55),
      tags: ["Groups"],
      icon: "🚐",
    },
    {
      id: "uber-black",
      type: "rideshare",
      provider: "Uber",
      rideType: "Black",
      description: "Premium rides in luxury cars",
      eta: "8 min",
      seats: 4,
      priceMin: Math.round(basePrice * 2.0),
      priceMax: Math.round(basePrice * 2.4),
      price: Math.round(basePrice * 2.2),
      tags: ["Most comfortable", "Premium"],
      icon: "🚘",
    },
    {
      id: "uber-black-suv",
      type: "rideshare",
      provider: "Uber",
      rideType: "Black SUV",
      description: "Premium SUVs for groups up to 6",
      eta: "10 min",
      seats: 6,
      priceMin: Math.round(basePrice * 2.5),
      priceMax: Math.round(basePrice * 3.0),
      price: Math.round(basePrice * 2.75),
      tags: ["Premium", "Groups"],
      icon: "🚙",
    },
    {
      id: "uber-green",
      type: "rideshare",
      provider: "Uber",
      rideType: "Green",
      description: "Electric or hybrid vehicles",
      eta: "6 min",
      seats: 4,
      priceMin: Math.round(basePrice * 0.95),
      priceMax: Math.round(basePrice * 1.15),
      price: Math.round(basePrice * 1.05),
      tags: ["Eco-friendly"],
      icon: "🌱",
      co2Savings: "2.3 kg CO₂ saved",
    },
    {
      id: "uber-share",
      type: "rideshare",
      provider: "Uber",
      rideType: "Share",
      description: "Share your ride, save money",
      eta: "4 min",
      seats: 2,
      priceMin: Math.round(basePrice * 0.6),
      priceMax: Math.round(basePrice * 0.8),
      price: Math.round(basePrice * 0.7),
      tags: ["Cheapest"],
      icon: "👥",
      co2Savings: "1.5 kg CO₂ saved",
    },
  ];
}

// Generate rental car options
export function generateRentalOptions(): GroundTransportOption[] {
  return [
    {
      id: "hertz-economy",
      type: "rental",
      provider: "Hertz",
      rideType: "Economy",
      description: "Toyota Corolla or similar",
      eta: "Available now",
      seats: 5,
      priceMin: 45,
      priceMax: 55,
      price: 50,
      tags: ["Best value"],
      icon: "🚗",
    },
    {
      id: "hertz-midsize",
      type: "rental",
      provider: "Hertz",
      rideType: "Midsize",
      description: "Nissan Altima or similar",
      eta: "Available now",
      seats: 5,
      priceMin: 55,
      priceMax: 70,
      price: 62,
      tags: [],
      icon: "🚗",
    },
    {
      id: "hertz-suv",
      type: "rental",
      provider: "Hertz",
      rideType: "SUV",
      description: "Ford Explorer or similar",
      eta: "Available now",
      seats: 7,
      priceMin: 85,
      priceMax: 110,
      price: 95,
      tags: ["Groups"],
      icon: "🚙",
    },
    {
      id: "enterprise-luxury",
      type: "rental",
      provider: "Enterprise",
      rideType: "Luxury",
      description: "BMW 5 Series or similar",
      eta: "Available now",
      seats: 5,
      priceMin: 120,
      priceMax: 150,
      price: 135,
      tags: ["Premium"],
      icon: "🚘",
    },
  ];
}

// Generate public transit options
export function generatePublicTransitOptions(): GroundTransportOption[] {
  return [
    {
      id: "transit-rail",
      type: "public",
      provider: "Metro Rail",
      rideType: "Light Rail",
      description: "Direct line to downtown",
      eta: "Every 10 min",
      seats: 999,
      priceMin: 3,
      priceMax: 3,
      price: 3,
      tags: ["Cheapest", "Eco-friendly"],
      icon: "🚊",
      co2Savings: "4.2 kg CO₂ saved",
    },
    {
      id: "transit-bus",
      type: "public",
      provider: "City Bus",
      rideType: "Express Bus",
      description: "Airport express to city center",
      eta: "Every 15 min",
      seats: 999,
      priceMin: 2,
      priceMax: 2,
      price: 2,
      tags: ["Cheapest"],
      icon: "🚌",
      co2Savings: "3.8 kg CO₂ saved",
    },
  ];
}

// Get all ground transport options
export function getAllGroundTransportOptions(): GroundTransportOption[] {
  return [
    ...generateUberOptions(),
    ...generateRentalOptions(),
    ...generatePublicTransitOptions(),
  ];
}

// Static options for quick loading
export const staticGroundTransportOptions: GroundTransportOption[] = generateUberOptions(15);
