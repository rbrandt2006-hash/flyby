import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Plane, Building2, Calendar, DollarSign, ChevronRight, Check, Pencil, X, ArrowLeft, Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlightSelectorDrawer } from "./booking/FlightSelectorDrawer";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { DatePickerDrawer } from "./booking/DatePickerDrawer";
import { HotelPhotoCarousel } from "./booking/HotelPhotoCarousel";
import { mockFlightOptions, mockHotelOptions } from "./booking/mockBookingData";
import type { FlightOption, SeatOption, HotelOption } from "./booking/types";

interface DetectedTrip {
  destination: string;
  dates: string;
  purpose: string;
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

interface TripState {
  selected: {
    flight: FlightOption | null;
    seat: SeatOption | null;
    hotel: HotelOption | null;
    startDate: Date | null;
    endDate: Date | null;
  };
  options: {
    flights: FlightOption[];
    hotels: HotelOption[];
  };
}

interface AITripDetectionPanelProps {
  detectedTrip: DetectedTrip | null;
  onReviewTrip: () => void;
  onClose?: () => void;
}

export function AITripDetectionPanel({ detectedTrip, onReviewTrip, onClose }: AITripDetectionPanelProps) {
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  
  // Drawer states
  const [flightDrawerOpen, setFlightDrawerOpen] = useState(false);
  const [hotelDrawerOpen, setHotelDrawerOpen] = useState(false);
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false);

  // Trip state with selections and options
  const [tripState, setTripState] = useState<TripState>(() => ({
    selected: {
      flight: null,
      seat: null,
      hotel: null,
      startDate: null,
      endDate: null,
    },
    options: {
      flights: mockFlightOptions,
      hotels: mockHotelOptions,
    },
  }));

  // Calculate nights
  const nights = useMemo(() => {
    if (tripState.selected.startDate && tripState.selected.endDate) {
      const diffTime = Math.abs(tripState.selected.endDate.getTime() - tripState.selected.startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return detectedTrip?.hotel.nights || 3;
  }, [tripState.selected.startDate, tripState.selected.endDate, detectedTrip]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    const flightPrice = tripState.selected.flight?.price || detectedTrip?.flight.price || 0;
    const seatPrice = tripState.selected.seat?.price || 0;
    const hotelPrice = tripState.selected.hotel 
      ? tripState.selected.hotel.pricePerNight * nights
      : (detectedTrip?.hotel.pricePerNight || 0) * nights;
    return flightPrice + seatPrice + hotelPrice;
  }, [tripState.selected, nights, detectedTrip]);

  if (!detectedTrip) return null;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setConfirmed(true);
    }, 1500);
  };

  const handleFlightSelect = (flight: FlightOption, seat: SeatOption | null) => {
    setTripState(prev => ({
      ...prev,
      selected: {
        ...prev.selected,
        flight,
        seat,
      },
    }));
  };

  const handleHotelSelect = (hotel: HotelOption) => {
    setTripState(prev => ({
      ...prev,
      selected: {
        ...prev.selected,
        hotel,
      },
    }));
  };

  const handleDatesSelect = (startDate: Date, endDate: Date) => {
    setTripState(prev => ({
      ...prev,
      selected: {
        ...prev.selected,
        startDate,
        endDate,
      },
    }));
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Get display values (selected or default)
  const displayFlight = tripState.selected.flight || {
    airline: detectedTrip.flight.airline,
    departTime: detectedTrip.flight.departure,
    arriveTime: detectedTrip.flight.arrival,
    price: detectedTrip.flight.price,
    stops: 0,
    duration: "3h 45m",
  };

  const displayHotel = tripState.selected.hotel || {
    name: detectedTrip.hotel.name,
    area: detectedTrip.hotel.location,
    pricePerNight: detectedTrip.hotel.pricePerNight,
    rating: 4.5,
    images: [],
    reviewCount: 0,
  };

  return (
    <div className="w-full h-full flex flex-col bg-muted/30 border-l border-border/40">
      <AnimatePresence mode="wait">
        {!showReviewPanel ? (
          <motion.div
            key="detection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">AI Assistant</span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground/60" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Trip summary card */}
              <div className="rounded-lg bg-card border border-border/60 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-0.5">Detected trip</p>
                    <h4 className="font-semibold text-foreground">{detectedTrip.destination}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{detectedTrip.purpose}</p>
                  </div>
                </div>

                <div className="space-y-2.5 mt-4">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>{detectedTrip.dates}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Plane className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>{detectedTrip.flight.airline}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>{detectedTrip.hotel.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-primary/70" />
                    <span className="font-medium text-foreground">${detectedTrip.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* AI Reasoning - subtle */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                  Why this was detected
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {detectedTrip.reasoning}
                </p>
              </div>
            </div>
            
            {/* Footer CTA */}
            <div className="p-4 border-t border-border/40">
              <Button 
                className="w-full h-9 text-xs gap-1.5" 
                onClick={() => setShowReviewPanel(true)}
              >
                Review & book
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setShowReviewPanel(false); setIsEditing(false); }}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="text-xs font-medium text-foreground">Review booking</span>
              </div>
              {!confirmed && (
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={toggleEditMode}
                >
                  {isEditing ? "Done" : "Edit"}
                </Button>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
              {confirmed ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-8"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Booked</h3>
                  <p className="text-xs text-muted-foreground">
                    Trip to {detectedTrip.destination} confirmed
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Flight Card */}
                  <EditableCard
                    icon={<Plane className="w-3.5 h-3.5" />}
                    title="Flight"
                    isEditing={isEditing}
                    onChangeClick={() => setFlightDrawerOpen(true)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{displayFlight.airline}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {displayFlight.departTime} → {displayFlight.arriveTime}
                        </p>
                        {tripState.selected.flight && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {tripState.selected.flight.duration} • {tripState.selected.flight.stops === 0 ? "Nonstop" : `${tripState.selected.flight.stops} stop`}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary">${displayFlight.price}</span>
                    </div>
                    {tripState.selected.seat && (
                      <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Seat {tripState.selected.seat.id}</span>
                        {tripState.selected.seat.price > 0 && (
                          <span className="font-medium">+${tripState.selected.seat.price}</span>
                        )}
                      </div>
                    )}
                  </EditableCard>

                  {/* Hotel Card */}
                  <EditableCard
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    title="Hotel"
                    isEditing={isEditing}
                    onChangeClick={() => setHotelDrawerOpen(true)}
                  >
                    {/* Photo carousel for selected hotel */}
                    {tripState.selected.hotel && tripState.selected.hotel.images.length > 0 && (
                      <div className="mb-3 -mx-3 -mt-3">
                        <HotelPhotoCarousel
                          images={tripState.selected.hotel.images}
                          hotelName={tripState.selected.hotel.name}
                          compact
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{displayHotel.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground/60" />
                          <p className="text-[11px] text-muted-foreground">{displayHotel.area}</p>
                        </div>
                        {tripState.selected.hotel && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] text-muted-foreground">
                              {tripState.selected.hotel.rating} ({tripState.selected.hotel.reviewCount.toLocaleString()} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-primary">${displayHotel.pricePerNight * nights}</span>
                        <p className="text-[10px] text-muted-foreground">${displayHotel.pricePerNight}/night</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{nights} night{nights !== 1 ? 's' : ''}</p>
                  </EditableCard>

                  {/* Dates Card */}
                  <EditableCard
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    title="Dates"
                    isEditing={isEditing}
                    onChangeClick={() => setDateDrawerOpen(true)}
                  >
                    <p className="text-xs text-foreground">{detectedTrip.dates}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{nights} night{nights !== 1 ? 's' : ''}</p>
                  </EditableCard>

                  {/* Total */}
                  <div className="pt-3 border-t border-border/40 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Estimated Total</span>
                      <span className="text-base font-bold">${totalCost.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Flight + {nights} nights hotel{tripState.selected.seat ? ' + seat' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!confirmed && (
              <div className="p-4 border-t border-border/40">
                <Button 
                  size="sm"
                  className="w-full h-9 text-xs gap-1.5"
                  onClick={handleConfirm}
                  disabled={isConfirming || isEditing}
                >
                  {isConfirming ? (
                    <>
                      <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Confirm booking
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flight Selector Drawer */}
      <FlightSelectorDrawer
        open={flightDrawerOpen}
        onOpenChange={setFlightDrawerOpen}
        flights={tripState.options.flights}
        selectedFlight={tripState.selected.flight}
        selectedSeat={tripState.selected.seat}
        onSelect={handleFlightSelect}
        basePrice={detectedTrip.flight.price}
      />

      {/* Hotel Selection Full-Screen Page */}
      <HotelSelectionPage
        open={hotelDrawerOpen}
        onClose={() => setHotelDrawerOpen(false)}
        hotels={tripState.options.hotels}
        selectedHotel={tripState.selected.hotel}
        onSelect={handleHotelSelect}
        nights={nights}
        venueName={detectedTrip.destination}
      />

      {/* Date Picker Drawer */}
      <DatePickerDrawer
        open={dateDrawerOpen}
        onOpenChange={setDateDrawerOpen}
        startDate={tripState.selected.startDate}
        endDate={tripState.selected.endDate}
        onSelect={handleDatesSelect}
      />
    </div>
  );
}

interface EditableCardProps {
  icon: React.ReactNode;
  title: string;
  isEditing: boolean;
  onChangeClick: () => void;
  children: React.ReactNode;
}

function EditableCard({ icon, title, isEditing, onChangeClick, children }: EditableCardProps) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg bg-card border border-border/60 transition-all",
        isEditing && "hover:border-primary/30 cursor-pointer"
      )}
      onClick={isEditing ? onChangeClick : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
            {icon}
          </div>
          <p className="text-xs font-medium text-foreground">{title}</p>
        </div>
        {isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeClick();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/70 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Change
          </button>
        )}
      </div>
      <div className="pl-9">
        {children}
      </div>
    </div>
  );
}
