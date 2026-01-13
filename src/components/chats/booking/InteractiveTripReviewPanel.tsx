import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Plane, 
  Building2, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  ChevronDown,
  Check, 
  X, 
  ArrowLeft,
  Armchair
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parse } from "date-fns";
import type { FlightOption, SeatOption, HotelOption, DetectedTripData } from "./types";
import { FlightSelectorDrawer } from "./FlightSelectorDrawer";
import { HotelBrowserDrawer } from "./HotelBrowserDrawer";
import { DatePickerDrawer } from "./DatePickerDrawer";
import { mockFlightOptions, mockHotelOptions } from "./mockBookingData";

interface InteractiveTripReviewPanelProps {
  detectedTrip: DetectedTripData | null;
  onReviewTrip: () => void;
}

export function InteractiveTripReviewPanel({ detectedTrip, onReviewTrip }: InteractiveTripReviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);

  // Booking state
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatOption | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Drawer states
  const [flightDrawerOpen, setFlightDrawerOpen] = useState(false);
  const [hotelDrawerOpen, setHotelDrawerOpen] = useState(false);
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false);

  // Initialize booking state from detected trip
  useEffect(() => {
    if (detectedTrip && !selectedFlight) {
      const initialFlight = mockFlightOptions.find(f => f.airline === detectedTrip.flight.airline) || mockFlightOptions[0];
      setSelectedFlight(initialFlight);
      
      const initialHotel = mockHotelOptions.find(h => h.name.includes(detectedTrip.hotel.name.split(' ')[0])) || mockHotelOptions[0];
      setSelectedHotel(initialHotel);

      // Parse dates from detected trip
      try {
        const dateMatch = detectedTrip.dates.match(/(\w+)\s+(\d+)-(\d+),?\s*(\d{4})?/);
        if (dateMatch) {
          const month = dateMatch[1];
          const startDay = parseInt(dateMatch[2]);
          const endDay = parseInt(dateMatch[3]);
          const year = dateMatch[4] || new Date().getFullYear().toString();
          setStartDate(parse(`${month} ${startDay}, ${year}`, "MMM d, yyyy", new Date()));
          setEndDate(parse(`${month} ${endDay}, ${year}`, "MMM d, yyyy", new Date()));
        }
      } catch {
        // Fallback dates
        const now = new Date();
        setStartDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
        setEndDate(new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000));
      }
    }
  }, [detectedTrip, selectedFlight]);

  // Calculate totals
  const nights = startDate && endDate ? differenceInDays(endDate, startDate) : detectedTrip?.hotel.nights || 4;
  
  const totalCost = useMemo(() => {
    const flightCost = selectedFlight?.price || detectedTrip?.flight.price || 0;
    const seatCost = selectedSeat?.price || 0;
    const hotelCost = selectedHotel ? selectedHotel.pricePerNight * nights : (detectedTrip?.hotel.pricePerNight || 0) * nights;
    return flightCost + seatCost + hotelCost;
  }, [selectedFlight, selectedSeat, selectedHotel, nights, detectedTrip]);

  // Update hotel prices based on nights
  const adjustedHotels = useMemo(() => {
    return mockHotelOptions.map(h => ({
      ...h,
      totalPrice: h.pricePerNight * nights,
    }));
  }, [nights]);

  if (!detectedTrip) return null;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setConfirmed(true);
    }, 1500);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setShowReviewPanel(false);
    setConfirmed(false);
  };

  const handleFlightSelect = (flight: FlightOption, seat: SeatOption | null) => {
    setSelectedFlight(flight);
    setSelectedSeat(seat);
  };

  const handleHotelSelect = (hotel: HotelOption) => {
    setSelectedHotel({ ...hotel, totalPrice: hotel.pricePerNight * nights });
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const getShortDestination = (dest: string) => {
    if (dest.toLowerCase().includes("new york")) return "NYC";
    if (dest.toLowerCase().includes("los angeles")) return "LA";
    if (dest.toLowerCase().includes("san francisco")) return "SF";
    if (dest.toLowerCase().includes("washington")) return "DC";
    return dest.split(",")[0].trim();
  };

  const formattedDates = startDate && endDate 
    ? `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`
    : detectedTrip.dates;

  const conferenceStart = detectedTrip.conferenceStart || (startDate ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : undefined);
  const conferenceEnd = detectedTrip.conferenceEnd || (endDate ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000) : undefined);

  const CollapsedPill = (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={() => setIsExpanded(true)}
      className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border/60 rounded-full shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-200 cursor-pointer group"
    >
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-foreground">Trip detected</span>
      <span className="text-sm text-muted-foreground">·</span>
      <span className="text-sm font-medium text-primary">{getShortDestination(detectedTrip.destination)}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </motion.button>
  );

  const ExpandedPanel = createPortal(
    <AnimatePresence>
      {isExpanded && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-[420px] max-w-[90vw] bg-background shadow-2xl z-50 flex flex-col"
          >
            <AnimatePresence mode="wait">
              {!showReviewPanel ? (
                <motion.div key="detection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                  <div className="shrink-0 px-6 py-5 border-b border-border/40 flex items-center justify-between bg-background">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-base font-semibold text-foreground">AI Assistant</span>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
                    <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm">
                      <div className="mb-5">
                        <h3 className="text-xl font-semibold text-foreground mb-1">{detectedTrip.destination}</h3>
                        <p className="text-sm text-muted-foreground">{detectedTrip.purpose}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{formattedDates}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                            <Plane className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{selectedFlight?.airline || detectedTrip.flight.airline}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{selectedHotel?.name || detectedTrip.hotel.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-base font-semibold text-foreground">${totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <button onClick={() => setReasoningExpanded(!reasoningExpanded)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", reasoningExpanded && "rotate-180")} />
                        <span className="font-medium">Why Flyby suggested this</span>
                      </button>
                      <AnimatePresence>
                        {reasoningExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="mt-3 ml-6 pl-4 border-l-2 border-muted">
                              <p className="text-sm text-muted-foreground">{detectedTrip.reasoning}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="shrink-0 px-6 py-5 border-t border-border/40 bg-background">
                    <Button className="w-full h-12 text-sm font-semibold gap-2 rounded-xl shadow-md hover:shadow-lg transition-all" onClick={() => setShowReviewPanel(true)}>
                      Review & Book
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                  <div className="shrink-0 px-6 py-5 border-b border-border/40 flex items-center gap-3 bg-background">
                    <button onClick={() => setShowReviewPanel(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="text-base font-semibold text-foreground">Review Booking</span>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
                    {confirmed ? (
                      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Check className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Booked Successfully</h3>
                        <p className="text-sm text-muted-foreground">Your trip to {detectedTrip.destination} is confirmed</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {/* Flight Section - Clickable */}
                        <button onClick={() => setFlightDrawerOpen(true)} className="w-full p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all text-left group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
                                <Plane className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Flight</p>
                                <p className="text-sm text-muted-foreground">{selectedFlight?.airline || detectedTrip.flight.airline}</p>
                                <p className="text-sm text-muted-foreground">{selectedFlight?.departTime || detectedTrip.flight.departure} → {selectedFlight?.arriveTime || detectedTrip.flight.arrival}</p>
                                <p className="text-sm font-medium text-foreground mt-1">${selectedFlight?.price || detectedTrip.flight.price}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
                          </div>
                        </button>

                        {/* Seat Section */}
                        {selectedSeat && (
                          <div className="ml-12 p-3 rounded-lg bg-muted/30 border border-border/40">
                            <div className="flex items-center gap-2">
                              <Armchair className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Seat {selectedSeat.id}</span>
                              <span className="text-sm text-muted-foreground">({selectedSeat.type})</span>
                              {selectedSeat.price > 0 && <span className="text-sm font-medium ml-auto">+${selectedSeat.price}</span>}
                            </div>
                          </div>
                        )}

                        {/* Hotel Section - Clickable */}
                        <button onClick={() => setHotelDrawerOpen(true)} className="w-full p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all text-left group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Hotel</p>
                                <p className="text-sm text-muted-foreground">{selectedHotel?.name || detectedTrip.hotel.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedHotel?.area || detectedTrip.hotel.location}</p>
                                <p className="text-sm font-medium text-foreground mt-1">${selectedHotel?.pricePerNight || detectedTrip.hotel.pricePerNight}/night × {nights}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
                          </div>
                        </button>

                        {/* Dates Section - Clickable */}
                        <button onClick={() => setDateDrawerOpen(true)} className="w-full p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all text-left group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Dates</p>
                                <p className="text-sm text-muted-foreground">{formattedDates}</p>
                                <p className="text-sm text-muted-foreground">{nights} night{nights !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
                          </div>
                        </button>

                        {/* Total */}
                        <div className="pt-4 border-t border-border/40 mt-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Estimated Total</span>
                            <span className="text-xl font-bold">${totalCost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!confirmed && (
                    <div className="shrink-0 px-6 py-5 border-t border-border/40 bg-background">
                      <Button className="w-full h-11 text-sm gap-2 rounded-xl shadow-md" onClick={handleConfirm} disabled={isConfirming}>
                        {isConfirming ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Confirm & Book
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <AnimatePresence>{!isExpanded && CollapsedPill}</AnimatePresence>
      {ExpandedPanel}
      
      <FlightSelectorDrawer
        open={flightDrawerOpen}
        onOpenChange={setFlightDrawerOpen}
        flights={mockFlightOptions}
        selectedFlight={selectedFlight}
        selectedSeat={selectedSeat}
        onSelect={handleFlightSelect}
        basePrice={detectedTrip.flight.price}
      />
      
      <HotelBrowserDrawer
        open={hotelDrawerOpen}
        onOpenChange={setHotelDrawerOpen}
        hotels={adjustedHotels}
        selectedHotel={selectedHotel}
        onSelect={handleHotelSelect}
        nights={nights}
        venueName="Moscone Center"
      />
      
      <DatePickerDrawer
        open={dateDrawerOpen}
        onOpenChange={setDateDrawerOpen}
        startDate={startDate}
        endDate={endDate}
        onSelect={handleDateSelect}
        conferenceStart={conferenceStart}
        conferenceEnd={conferenceEnd}
        eventName={detectedTrip.purpose}
      />
    </>
  );
}
