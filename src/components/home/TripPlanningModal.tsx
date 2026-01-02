import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Hotel, Car, DollarSign, Check, Loader2, MapPin, Calendar, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CalendarEvent } from "@/services/mockCalendarService";

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
  hotel: HotelOption;
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

interface HotelOption {
  id: string;
  name: string;
  area: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  distanceToVenue: string;
  tags: string[];
}

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

const generateHotelOptions = (destination: string): HotelOption[] => [
  {
    id: "h1",
    name: "The Westin",
    area: "Downtown",
    pricePerNight: 245,
    totalPrice: 490,
    rating: 4.5,
    distanceToVenue: "0.3 mi",
    tags: ["Closest", "Policy compliant"],
  },
  {
    id: "h2",
    name: "Marriott",
    area: "Financial District",
    pricePerNight: 189,
    totalPrice: 378,
    rating: 4.3,
    distanceToVenue: "0.8 mi",
    tags: ["Best value"],
  },
  {
    id: "h3",
    name: "Hilton Garden Inn",
    area: "Convention Center",
    pricePerNight: 165,
    totalPrice: 330,
    rating: 4.1,
    distanceToVenue: "1.2 mi",
    tags: ["Cheapest"],
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
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [groundOptions, setGroundOptions] = useState<GroundOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
  const [selectedGround, setSelectedGround] = useState<GroundOption | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineSection, setRefineSection] = useState<"flights" | "hotels" | "ground" | null>(null);

  const estimatedTotal = (selectedFlight?.price || 0) + (selectedHotel?.totalPrice || 0) + (selectedGround?.price || 0);

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
      
      // Start planning sequence
      runPlanningSequence();
    }
  }, [open, event]);

  const runPlanningSequence = async () => {
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
    const hotels = generateHotelOptions(event?.location || "");
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
                    <div className="p-4 rounded-xl bg-card border border-border/60">
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
                            <div className="flex gap-1.5 mt-2">
                              {selectedFlight.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedFlight.price}</p>
                          <button 
                            onClick={() => { setIsRefining(true); setRefineSection("flights"); }}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hotel */}
                  {selectedHotel && (
                    <div className="p-4 rounded-xl bg-card border border-border/60">
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
                            <div className="flex gap-1.5 mt-2">
                              {selectedHotel.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedHotel.totalPrice}</p>
                          <p className="text-xs text-muted-foreground">${selectedHotel.pricePerNight}/night</p>
                          <button 
                            onClick={() => { setIsRefining(true); setRefineSection("hotels"); }}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Change
                          </button>
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

                  {/* Total */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="font-medium">Estimated Total</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">${estimatedTotal.toLocaleString()}</span>
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
                              <div className="flex gap-1.5 mt-2">
                                {hotel.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">${hotel.totalPrice}</p>
                              <p className="text-xs text-muted-foreground">${hotel.pricePerNight}/night</p>
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

  return content;
}