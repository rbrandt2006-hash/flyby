// Itinerary block types for corporate travel
export type ItineraryBlockType = 
  | "flight" 
  | "hotel_checkin" 
  | "hotel_checkout" 
  | "meeting" 
  | "meal" 
  | "transport" 
  | "free_time"
  | "custom";

export interface ItineraryBlockBase {
  id: string;
  type: ItineraryBlockType;
  dayIndex: number; // Which day this block belongs to (0-indexed)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  notes?: string;
  order: number; // For drag-and-drop ordering within a day
}

export interface FlightBlock extends ItineraryBlockBase {
  type: "flight";
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  confirmationNumber?: string;
  seatNumber?: string;
  isReturn?: boolean;
}

export interface HotelCheckinBlock extends ItineraryBlockBase {
  type: "hotel_checkin";
  hotelName: string;
  address: string;
  confirmationNumber?: string;
  roomType?: string;
}

export interface HotelCheckoutBlock extends ItineraryBlockBase {
  type: "hotel_checkout";
  hotelName: string;
  address: string;
}

export interface MeetingBlock extends ItineraryBlockBase {
  type: "meeting";
  title: string;
  location: string;
  address?: string;
  attendees: string[];
  businessPurpose?: string;
  clientName?: string;
  agenda?: string;
  isVirtual?: boolean;
  meetingLink?: string;
}

export interface MealBlock extends ItineraryBlockBase {
  type: "meal";
  mealType: "breakfast" | "lunch" | "dinner" | "coffee";
  venueName?: string;
  location?: string;
  attendees?: string[];
  businessPurpose?: string;
  reservationName?: string;
  reservationConfirmation?: string;
}

export interface TransportBlock extends ItineraryBlockBase {
  type: "transport";
  transportType: "uber" | "lyft" | "rental" | "shuttle" | "taxi" | "subway" | "walking";
  provider?: string;
  pickupLocation: string;
  dropoffLocation: string;
  confirmationNumber?: string;
  estimatedCost?: number;
  vehicleType?: string;
}

export interface FreeTimeBlock extends ItineraryBlockBase {
  type: "free_time";
  activity?: string;
  location?: string;
}

export interface CustomBlock extends ItineraryBlockBase {
  type: "custom";
  title: string;
  description?: string;
  location?: string;
}

export type ItineraryBlock = 
  | FlightBlock 
  | HotelCheckinBlock 
  | HotelCheckoutBlock 
  | MeetingBlock 
  | MealBlock 
  | TransportBlock 
  | FreeTimeBlock 
  | CustomBlock;

export interface ItineraryDay {
  dayIndex: number;
  date: Date;
  title: string;
  blocks: ItineraryBlock[];
}

export interface TripItinerary {
  tripId: string;
  days: ItineraryDay[];
  timezone: string;
  lastModified: string;
}

// Validation warning types
export interface ItineraryWarning {
  id: string;
  type: "overlap" | "conflict" | "suggestion" | "missing";
  severity: "error" | "warning" | "info";
  message: string;
  blockIds: string[];
  dayIndex?: number;
}

// Block type metadata for UI
export const blockTypeConfig: Record<ItineraryBlockType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  flight: {
    label: "Flight",
    icon: "Plane",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  hotel_checkin: {
    label: "Hotel Check-in",
    icon: "Building2",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  hotel_checkout: {
    label: "Hotel Check-out",
    icon: "LogOut",
    color: "text-amber-600",
    bgColor: "bg-amber-600/10",
  },
  meeting: {
    label: "Meeting",
    icon: "Users",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  meal: {
    label: "Business Meal",
    icon: "UtensilsCrossed",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  transport: {
    label: "Transportation",
    icon: "Car",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  free_time: {
    label: "Free Time",
    icon: "Clock",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  custom: {
    label: "Other",
    icon: "MoreHorizontal",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
  },
};

// Helper to generate unique IDs
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to format time for display
export function formatBlockTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Helper to check time overlap
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  return s1 < e2 && s2 < e1;
}
