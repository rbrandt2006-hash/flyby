export interface FlightOption {
  id: string;
  airline: string;
  airlineLogo: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: number;
  stopCity?: string;
  price: number;
  priceDiff?: number;
  tags: string[];
  origin: string;
  destination: string;
}

export interface SeatOption {
  id: string;
  row: number;
  seat: string;
  type: 'economy' | 'preferred' | 'exit' | 'business' | 'first';
  available: boolean;
  price: number;
  selected?: boolean;
}

export interface HotelOption {
  id: string;
  name: string;
  area: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  distanceToVenue: string;
  tags: string[];
  images: string[];
  amenities: string[];
  reviewCount: number;
  description: string;
  cancellationPolicy: string;
  roomTypes: string[];
}

export interface TripBookingState {
  flight: FlightOption | null;
  seat: SeatOption | null;
  hotel: HotelOption | null;
  startDate: Date | null;
  endDate: Date | null;
  nights: number;
  totalCost: number;
}

export interface DetectedTripData {
  destination: string;
  dates: string;
  purpose: string;
  conferenceStart?: Date;
  conferenceEnd?: Date;
  flight: {
    airline: string;
    departure: string;
    arrival: string;
    price: number;
  };
  hotel: {
    name: string;
    location: string;
    pricePerNight: number;
    nights: number;
  };
  totalCost: number;
  confidence: number;
  reasoning: string;
}
