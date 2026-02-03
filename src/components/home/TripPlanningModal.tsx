import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Hotel, Car, DollarSign, Check, Loader2, MapPin, Calendar, ChevronRight, Sparkles, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CalendarEvent } from "@/services/mockCalendarService";
import { FlightChooserDrawer } from "@/components/trips/FlightChooserDrawer";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import type { HotelOption as FullHotelOption } from "@/components/chats/booking/types";

interface TripPlanningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onConfirm: (tripData: TripProposal) => void;
  onSaveDraft: (tripData: TripProposal) => void;
}

export interface TripProposal {
  destination: string;
  dates: string;
  purpose: string;
  flight: FlightOption;
  hotel: FullHotelOption;
  ground: GroundOption;
  estimatedCost: number;
}

interface FlightOption {
  id: string;
  airline: string;
  departTime: string;
  arriveTime: string;
  returnDepartTime: string;
  returnArriveTime: string;
  price: number;
  stops: number;
  duration: string;
  tags: string[];
}

// Using FullHotelOption from types for extended hotel data

interface GroundOption {
  id: string;
  type: "rideshare" | "rental" | "public";
  provider: string;
  estimate: string;
  price: number;
  tags: string[];
}

type PlanningStep = "reading" | "flights" | "hotels" | "ground" | "calculating" | "done";

const stepLabels: Record<PlanningStep, string> = {
  reading: "Reading event details…",
  flights: "Finding flights…",
  hotels: "Finding hotels…",
  ground: "Planning ground transport…",
  calculating: "Calculating total cost…",
  done: "Done!",
};

// Mock data generators
const generateFlightOptions = (destination: string): FlightOption[] => [
  {
    id: "f1",
    airline: "Delta",
    departTime: "7:45 AM",
    arriveTime: "11:30 AM",
    returnDepartTime: "5:30 PM",
    returnArriveTime: "9:15 PM",
    price: 487,
    stops: 0,
    duration: "3h 45m",
    tags: ["Recommended", "Nonstop"],
  },
  {
    id: "f2",
    airline: "United",
    departTime: "9:15 AM",
    arriveTime: "1:45 PM",
    returnDepartTime: "6:00 PM",
    returnArriveTime: "10:30 PM",
    price: 412,
    stops: 1,
    duration: "4h 30m",
    tags: ["Cheapest"],
  },
  {
    id: "f3",
    airline: "American",
    departTime: "6:00 AM",
    arriveTime: "9:30 AM",
    returnDepartTime: "4:00 PM",
    returnArriveTime: "7:30 PM",
    price: 523,
    stops: 0,
    duration: "3h 30m",
    tags: ["Fastest"],
  },
];

const generateHotelOptions = (destination: string, nights: number = 2): FullHotelOption[] => [
  {
    id: "h1",
    name: "The Westin",
    area: "Downtown",
    pricePerNight: 245,
    totalPrice: 245 * nights,
    rating: 4.5,
    distanceToVenue: "0.3 mi",
    tags: ["Recommended", "Closest", "Policy compliant"],
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Gym", "Pool", "Breakfast included", "Parking", "Restaurant"],
    reviewCount: 2847,
    description: "Experience luxury in the heart of downtown. The Westin offers stunning city views, world-class amenities, and is steps away from major business centers and attractions.",
    cancellationPolicy: "Free cancellation until 24 hours before check-in",
    roomTypes: ["King Room", "Double Queen", "Executive Suite", "Presidential Suite"],
  },
  {
    id: "h2",
    name: "Marriott",
    area: "Financial District",
    pricePerNight: 189,
    totalPrice: 189 * nights,
    rating: 4.3,
    distanceToVenue: "0.8 mi",
    tags: ["Best value"],
    images: [
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Gym", "Business center", "Restaurant", "Parking"],
    reviewCount: 1923,
    description: "Modern comfort meets convenience at the Marriott. Ideal for business travelers with excellent meeting facilities and a prime Financial District location.",
    cancellationPolicy: "Free cancellation until 48 hours before check-in",
    roomTypes: ["Standard King", "Standard Double", "Junior Suite"],
  },
  {
    id: "h3",
    name: "Hilton Garden Inn",
    area: "Convention Center",
    pricePerNight: 165,
    totalPrice: 165 * nights,
    rating: 4.1,
    distanceToVenue: "1.2 mi",
    tags: ["Cheapest"],
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Breakfast included", "Parking", "Fitness center"],
    reviewCount: 1456,
    description: "Affordable elegance at the Hilton Garden Inn. Enjoy complimentary breakfast and easy access to the Convention Center for your business needs.",
    cancellationPolicy: "Free cancellation until 24 hours before check-in",
    roomTypes: ["Standard Room", "Deluxe King", "Suite"],
  },
  {
    id: "h4",
    name: "Hyatt Regency",
    area: "Business District",
    pricePerNight: 219,
    totalPrice: 219 * nights,
    rating: 4.4,
    distanceToVenue: "0.5 mi",
    tags: ["Executive preferred"],
    images: [
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1587213811864-46e59f6873b1?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
    ],
    amenities: ["Free Wi-Fi", "Gym", "Pool", "Spa", "Restaurant", "Valet parking"],
    reviewCount: 2134,
    description: "Elevate your stay at the Hyatt Regency. Premium accommodations with executive amenities, perfect for the discerning business traveler.",
    cancellationPolicy: "Free cancellation until 72 hours before check-in",
    roomTypes: ["Regency King", "Regency Double", "Executive Suite", "Club Access Room"],
  },
];

const generateGroundOptions = (): GroundOption[] => [
  {
    id: "g1",
    type: "rideshare",
    provider: "Uber",
    estimate: "$35-45 each way",
    price: 80,
    tags: ["Recommended"],
  },
  {
    id: "g2",
    type: "rental",
    provider: "Hertz",
    estimate: "$65/day",
    price: 130,
    tags: [],
  },
  {
    id: "g3",
    type: "public",
    provider: "Public Transit",
    estimate: "$15 round trip",
    price: 15,
    tags: ["Cheapest"],
  },
];

export function TripPlanningModal({ 
  open, 
  onOpenChange, 
  event,
  onConfirm,
  onSaveDraft 
}: TripPlanningModalProps) {
  const [currentStep, setCurrentStep] = useState<PlanningStep>("reading");
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([]);
  const [hotelOptions, setHotelOptions] = useState<FullHotelOption[]>([]);
  const [groundOptions, setGroundOptions] = useState<GroundOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<FullHotelOption | null>(null);
  const [selectedGround, setSelectedGround] = useState<GroundOption | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineSection, setRefineSection] = useState<"flights" | "hotels" | "ground" | null>(null);
  const [flightDrawerOpen, setFlightDrawerOpen] = useState(false);
  const [hotelDrawerOpen, setHotelDrawerOpen] = useState(false);

  const estimatedTotal = (selectedFlight?.price || 0) + (selectedHotel?.totalPrice || 0) + (selectedGround?.price || 0);

  // Calculate nights from event dates
  const calculateNights = (): number => {
    if (!event) return 2;
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const nights = calculateNights();
  const isSameDayTrip = nights === 0 || (event && new Date(event.startDate).toDateString() === new Date(event.endDate).toDateString());

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Reset state when modal opens
  useEffect(() => {
    if (open && event) {
      setCurrentStep("reading");
      setFlightOptions([]);
      setHotelOptions([]);
      setGroundOptions([]);
      setSelectedFlight(null);
      setSelectedHotel(null);
      setSelectedGround(null);
      setIsRefining(false);
      setRefineSection(null);
      setFlightDrawerOpen(false);
      setHotelDrawerOpen(false);
      
      // Start planning sequence
      runPlanningSequence();
    }
  }, [open, event]);

  const runPlanningSequence = async () => {
    // Calculate nights for hotel pricing
    const tripNights = calculateNights();
    
    // Step 1: Reading
    await new Promise(r => setTimeout(r, 800));
    setCurrentStep("flights");
    
    // Step 2: Flights
    await new Promise(r => setTimeout(r, 1200));
    const flights = generateFlightOptions(event?.location || "");
    setFlightOptions(flights);
    setSelectedFlight(flights[0]);
    setCurrentStep("hotels");
    
    // Step 3: Hotels
    await new Promise(r => setTimeout(r, 1000));
    const hotels = generateHotelOptions(event?.location || "", tripNights);
    setHotelOptions(hotels);
    setSelectedHotel(hotels[0]);
    setCurrentStep("ground");
    
    // Step 4: Ground
    await new Promise(r => setTimeout(r, 800));
    const ground = generateGroundOptions();
    setGroundOptions(ground);
    setSelectedGround(ground[0]);
    setCurrentStep("calculating");
    
    // Step 5: Done
    await new Promise(r => setTimeout(r, 500));
    setCurrentStep("done");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selectedFlight || !selectedHotel || !selectedGround || !event) return;
    
    const tripData: TripProposal = {
      destination: event.location || "",
      dates: `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`,
      purpose: event.title,
      flight: selectedFlight,
      hotel: selectedHotel,
      ground: selectedGround,
      estimatedCost: estimatedTotal,
    };
    
    onConfirm(tripData);
    handleClose();
  };

  const handleSaveDraft = () => {
    if (!selectedFlight || !selectedHotel || !selectedGround || !event) return;
    
    const tripData: TripProposal = {
      destination: event.location || "",
      dates: `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`,
      purpose: event.title,
      flight: selectedFlight,
      hotel: selectedHotel,
      ground: selectedGround,
      estimatedCost: estimatedTotal,
    };
    
    onSaveDraft(tripData);
    handleClose();
  };

  const stepComplete = (step: PlanningStep): boolean => {
    const steps: PlanningStep[] = ["reading", "flights", "hotels", "ground", "calculating", "done"];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex;
  };

  const stepActive = (step: PlanningStep): boolean => currentStep === step;

  if (!event) return null;

  const content = createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[720px] max-h-[calc(100vh-48px)] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header - Sticky */}
            <div className="sticky top-0 z-10 shrink-0 px-6 py-5 border-b border-border/40 bg-background">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Planning Trip</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{event.location}</span>
                      <span>•</span>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 truncate">{event.title}</p>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Planning Steps */}
              {currentStep !== "done" && (
                <div className="space-y-3 mb-6">
                  {(["reading", "flights", "hotels", "ground", "calculating"] as PlanningStep[]).map((step) => (
                    <div 
                      key={step}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        stepActive(step) && "bg-primary/5",
                        stepComplete(step) && "opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        stepComplete(step) && "bg-success text-success-foreground",
                        stepActive(step) && "bg-primary/20",
                        !stepComplete(step) && !stepActive(step) && "bg-muted"
                      )}>
                        {stepComplete(step) ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : stepActive(step) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm",
                        stepActive(step) && "font-medium text-foreground",
                        stepComplete(step) && "text-muted-foreground",
                        !stepComplete(step) && !stepActive(step) && "text-muted-foreground"
                      )}>
                        {stepLabels[step]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {currentStep === "done" && !isRefining && (
                <div className="space-y-4">
                  {/* Flight */}
                  {selectedFlight && (
                    <button
                      onClick={() => setFlightDrawerOpen(true)}
                      className="w-full p-4 rounded-xl bg-card border border-border/60 text-left transition-all hover:border-primary/30 hover:shadow-md group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Plane className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{selectedFlight.airline}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedFlight.departTime} → {selectedFlight.arriveTime} • {selectedFlight.duration}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {selectedFlight.stops === 0 ? "Nonstop" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? 's' : ''}`}
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              {selectedFlight.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedFlight.price}</p>
                          <span className="text-xs text-primary group-hover:underline mt-1 inline-block">
                            Change
                          </span>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Hotel */}
                  {selectedHotel && !isSameDayTrip && (
                    <button
                      onClick={() => setHotelDrawerOpen(true)}
                      className="w-full p-4 rounded-xl bg-card border border-border/60 text-left transition-all hover:border-primary/30 hover:shadow-md group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Hotel className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{selectedHotel.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedHotel.area} • {selectedHotel.distanceToVenue} to venue
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs text-muted-foreground">{selectedHotel.rating}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              ${selectedHotel.pricePerNight}/night × {nights} night{nights !== 1 ? 's' : ''} = ${selectedHotel.totalPrice}
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              {selectedHotel.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedHotel.totalPrice}</p>
                          <span className="text-xs text-primary group-hover:underline mt-1 inline-block">
                            Change
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                  
                  {/* Same-day trip - no hotel needed */}
                  {isSameDayTrip && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/60">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Hotel className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No hotel needed</p>
                          <p className="text-sm text-muted-foreground">
                            Same-day trip — returning same evening
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ground */}
                  {selectedGround && (
                    <div className="p-4 rounded-xl bg-card border border-border/60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{selectedGround.provider}</p>
                            <p className="text-sm text-muted-foreground">{selectedGround.estimate}</p>
                            <div className="flex gap-1.5 mt-2">
                              {selectedGround.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedGround.price}</p>
                          <button 
                            onClick={() => { setIsRefining(true); setRefineSection("ground"); }}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total with breakdown */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Flight</span>
                        <span>${selectedFlight?.price || 0}</span>
                      </div>
                      {!isSameDayTrip && selectedHotel && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Hotel ({nights} night{nights !== 1 ? 's' : ''})</span>
                          <span>${selectedHotel.totalPrice}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Ground transport</span>
                        <span>${selectedGround?.price || 0}</span>
                      </div>
                      <div className="border-t border-primary/20 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          <span className="font-medium">Estimated Total</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          ${(isSameDayTrip 
                            ? (selectedFlight?.price || 0) + (selectedGround?.price || 0) 
                            : estimatedTotal
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Refine View */}
              {isRefining && refineSection && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => { setIsRefining(false); setRefineSection(null); }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to summary
                    </button>
                    <h3 className="text-sm font-medium">
                      {refineSection === "flights" && "Select Flight"}
                      {refineSection === "hotels" && "Select Hotel"}
                      {refineSection === "ground" && "Select Ground Transport"}
                    </h3>
                  </div>

                  {refineSection === "flights" && (
                    <div className="space-y-3">
                      {flightOptions.map((flight) => (
                        <button
                          key={flight.id}
                          onClick={() => { setSelectedFlight(flight); setIsRefining(false); setRefineSection(null); }}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left transition-all",
                            selectedFlight?.id === flight.id 
                              ? "bg-primary/5 border-primary/30" 
                              : "bg-card border-border/60 hover:border-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{flight.airline}</p>
                              <p className="text-sm text-muted-foreground">
                                {flight.departTime} → {flight.arriveTime} • {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
                              </p>
                              <div className="flex gap-1.5 mt-2">
                                {flight.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <p className="text-lg font-semibold">${flight.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {refineSection === "hotels" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        {nights} night{nights !== 1 ? 's' : ''} • {new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}
                      </p>
                      {hotelOptions.map((hotel) => (
                        <button
                          key={hotel.id}
                          onClick={() => { setSelectedHotel(hotel); setIsRefining(false); setRefineSection(null); }}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left transition-all",
                            selectedHotel?.id === hotel.id 
                              ? "bg-primary/5 border-primary/30" 
                              : "bg-card border-border/60 hover:border-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{hotel.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {hotel.area} • {hotel.distanceToVenue} to venue • ⭐ {hotel.rating}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                ${hotel.pricePerNight}/night × {nights} night{nights !== 1 ? 's' : ''}
                              </p>
                              <div className="flex gap-1.5 mt-2">
                                {hotel.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">${hotel.totalPrice}</p>
                              <p className="text-xs text-muted-foreground">total</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {refineSection === "ground" && (
                    <div className="space-y-3">
                      {groundOptions.map((ground) => (
                        <button
                          key={ground.id}
                          onClick={() => { setSelectedGround(ground); setIsRefining(false); setRefineSection(null); }}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left transition-all",
                            selectedGround?.id === ground.id 
                              ? "bg-primary/5 border-primary/30" 
                              : "bg-card border-border/60 hover:border-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{ground.provider}</p>
                              <p className="text-sm text-muted-foreground">{ground.estimate}</p>
                              <div className="flex gap-1.5 mt-2">
                                {ground.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <p className="text-lg font-semibold">${ground.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {currentStep === "done" && !isRefining && (
              <div className="shrink-0 px-6 py-4 border-t border-border/40 bg-background flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSaveDraft}
                >
                  Save as Draft
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleConfirm}
                >
                  Confirm Trip
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {content}
      
      {/* Flight Chooser Drawer */}
      <FlightChooserDrawer
        open={flightDrawerOpen}
        onOpenChange={setFlightDrawerOpen}
        flights={flightOptions}
        selectedFlight={selectedFlight}
        onSelect={setSelectedFlight}
      />
      
      {/* Hotel Selection Full-Screen Page */}
      <HotelSelectionPage
        open={hotelDrawerOpen}
        onClose={() => setHotelDrawerOpen(false)}
        hotels={hotelOptions}
        selectedHotel={selectedHotel}
        onSelect={setSelectedHotel}
        nights={nights}
        venueName={event?.location}
      />
    </>
  );
}