import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Hotel, Car, DollarSign, Check, Loader2, MapPin, Calendar, ChevronRight, Sparkles, RefreshCw, Star, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CalendarEvent } from "@/services/mockCalendarService";
import { FlightSelectionPage, type FlightOption } from "@/components/trips/FlightSelectionPage";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { GroundTransportSelectionPage } from "@/components/trips/GroundTransportSelectionPage";
import type { HotelOption as FullHotelOption } from "@/components/chats/booking/types";
import { generateFlightOptions } from "@/services/mockFlightGenerator";
import { getAllGroundTransportOptions, type GroundTransportOption } from "@/services/mockGroundTransportService";
import { getHotelsForDestination } from "@/services/mockHotelService";
import { TransportIcon } from "@/components/trips/TransportIcon";
import { usePreferences } from "@/hooks/usePreferences";

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
  ground: GroundTransportOption | null;
  estimatedCost: number;
}

// Using FlightOption from FlightSelectionPage, FullHotelOption from types, and GroundTransportOption from service

type PlanningStep = "reading" | "flights" | "hotels" | "ground" | "calculating" | "done";

const stepLabels: Record<PlanningStep, string> = {
  reading: "Reading event details…",
  flights: "Finding flights…",
  hotels: "Finding hotels…",
  ground: "Planning ground transport…",
  calculating: "Calculating total cost…",
  done: "Done!",
};
// Hotel options now use imported getHotelsForDestination from mockHotelService

// Ground options now use imported generateUberOptions

export function TripPlanningModal({ 
  open, 
  onOpenChange, 
  event,
  onConfirm,
  onSaveDraft 
}: TripPlanningModalProps) {
  const { preferences } = usePreferences();
  const [currentStep, setCurrentStep] = useState<PlanningStep>("reading");
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([]);
  const [hotelOptions, setHotelOptions] = useState<FullHotelOption[]>([]);
  const [groundOptions, setGroundOptions] = useState<GroundTransportOption[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<FullHotelOption | null>(null);
  const [selectedGround, setSelectedGround] = useState<GroundTransportOption | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineSection, setRefineSection] = useState<"flights" | "hotels" | "ground" | null>(null);
  const [flightDrawerOpen, setFlightDrawerOpen] = useState(false);
  const [hotelDrawerOpen, setHotelDrawerOpen] = useState(false);
  const [groundDrawerOpen, setGroundDrawerOpen] = useState(false);

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
    const flights = generateFlightOptions({ destination: event?.location || "SFO", numFlights: 20 });
    setFlightOptions(flights);
    setSelectedFlight(flights[0]);
    setCurrentStep("hotels");
    
    // Step 3: Hotels (destination-specific)
    await new Promise(r => setTimeout(r, 1000));
    const hotels = getHotelsForDestination({ 
      destination: event?.location || "", 
      nights: tripNights 
    });
    setHotelOptions(hotels);
    setSelectedHotel(hotels[0]);
    setCurrentStep("ground");
    
    // Step 4: Ground (load all transport options: rideshare, rental, transit)
    await new Promise(r => setTimeout(r, 800));
    const ground = getAllGroundTransportOptions();
    setGroundOptions(ground);
    // Default to best value rideshare option
    const defaultRideshare = ground.find(g => g.type === "rideshare" && g.tags.includes("Best value")) || ground[0];
    setSelectedGround(defaultRideshare);
    setCurrentStep("calculating");
    
    // Step 5: Done
    await new Promise(r => setTimeout(r, 500));
    setCurrentStep("done");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selectedFlight || !selectedHotel || !event) return;
    
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
    if (!selectedFlight || !selectedHotel || !event) return;
    
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

                  {/* Ground Transport */}
                  {selectedGround ? (
                    <div className="p-4 rounded-xl bg-card border border-border/60 group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <TransportIcon type={selectedGround.iconType} size="md" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{selectedGround.rideType}</p>
                            <p className="text-sm text-muted-foreground">{selectedGround.provider} • {selectedGround.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{selectedGround.eta} • {selectedGround.seats} seats</p>
                            <div className="flex gap-1.5 mt-2">
                              {selectedGround.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">${selectedGround.price}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              onClick={() => setGroundDrawerOpen(true)}
                              className="text-xs text-primary hover:underline"
                            >
                              Change
                            </button>
                            <span className="text-muted-foreground">•</span>
                            <button 
                              onClick={() => setSelectedGround(null)}
                              className="text-xs text-destructive hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setGroundDrawerOpen(true)}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add ground transport</p>
                          <p className="text-sm text-muted-foreground">Uber, rental car, or public transit</p>
                        </div>
                      </div>
                    </button>
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
                                {hotel.area} • {hotel.distanceToVenue} to venue • {hotel.rating} rating
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
                    <div className="text-center py-8">
                      <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground mb-4">Use the full-screen selector for ground transport</p>
                      <Button onClick={() => { setGroundDrawerOpen(true); setIsRefining(false); setRefineSection(null); }}>
                        Open Ground Transport
                      </Button>
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
      
      {/* Flight Selection Full-Screen Page */}
      <FlightSelectionPage
        open={flightDrawerOpen}
        onClose={() => setFlightDrawerOpen(false)}
        flights={flightOptions}
        selectedFlight={selectedFlight}
        onSelect={setSelectedFlight}
        origin="ORD"
        destination={event?.location}
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

      {/* Ground Transport Selection Full-Screen Page */}
      <GroundTransportSelectionPage
        open={groundDrawerOpen}
        onClose={() => setGroundDrawerOpen(false)}
        options={groundOptions}
        selectedOption={selectedGround}
        onSelect={setSelectedGround}
      />
    </>
  );
}