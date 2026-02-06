import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  X, 
  Plane, 
  Building2, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  ChevronRight,
  Star,
  History,
  ChevronDown
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { Trip } from "./TripCard";
import type { FlightOption, HotelOption, SeatOption } from "@/components/chats/booking/types";
import { mockFlightOptions, mockHotelOptions } from "@/components/chats/booking/mockBookingData";
import { TripFlightPicker } from "./TripFlightPicker";
import { TripHotelPicker } from "./TripHotelPicker";
import { TripDatePicker } from "./TripDatePicker";
import { HotelPhotoCarousel } from "@/components/chats/booking/HotelPhotoCarousel";
import { DecisionTimeline } from "./DecisionTimeline";
import type { TripTimelineEvent } from "@/hooks/useTrips";

interface TripEditDrawerProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tripId: string) => void;
  onCancel: (tripId: string) => void;
  timeline?: TripTimelineEvent[];
}

interface TripState {
  selected: {
    flight: FlightOption | null;
    seat: SeatOption | null;
    hotel: HotelOption | null;
    dates: { start: Date; end: Date } | null;
  };
  options: {
    flights: FlightOption[];
    hotels: HotelOption[];
  };
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      };
    case "pending":
      return {
        label: "Upcoming",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      };
    case "draft":
      return {
        label: "Draft",
        className: "bg-muted text-muted-foreground border-border",
      };
    case "cancelled":
      return {
        label: "Canceled",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

export function TripEditDrawer({ 
  trip, 
  open, 
  onOpenChange,
  onConfirm,
  onCancel,
  timeline = []
}: TripEditDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flightPickerOpen, setFlightPickerOpen] = useState(false);
  const [hotelPickerOpen, setHotelPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  
  const [tripState, setTripState] = useState<TripState>({
    selected: {
      flight: null,
      seat: null,
      hotel: null,
      dates: null,
    },
    options: {
      flights: [],
      hotels: [],
    },
  });

  // Initialize state when trip changes
  useEffect(() => {
    if (trip && open) {
      setIsLoading(true);
      // Simulate loading
      const timer = setTimeout(() => {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const nights = differenceInDays(endDate, startDate);
        
        // Find matching flight/hotel from mock data or create from trip data
        const matchedFlight = mockFlightOptions.find(f => 
          f.airline === trip.flight_details?.airline
        ) || (trip.flight_details?.airline ? {
          id: "trip-flight",
          airline: trip.flight_details.airline,
          airlineLogo: "",
          departTime: "8:00 AM",
          arriveTime: "11:30 AM",
          duration: "3h 30m",
          stops: 0,
          price: trip.total_estimated_cost ? Math.floor(trip.total_estimated_cost * 0.4) : 450,
          tags: [],
          origin: "SFO",
          destination: trip.destination.slice(0, 3).toUpperCase(),
        } : null);

        const matchedHotel = mockHotelOptions.find(h => 
          h.name === trip.hotel_details?.name
        ) || (trip.hotel_details?.name ? {
          id: "trip-hotel",
          name: trip.hotel_details.name,
          area: trip.hotel_details.address || "Downtown",
          pricePerNight: trip.total_estimated_cost ? Math.floor((trip.total_estimated_cost * 0.6) / nights) : 250,
          totalPrice: trip.total_estimated_cost ? Math.floor(trip.total_estimated_cost * 0.6) : 250 * nights,
          rating: 4.5,
          distanceToVenue: "0.5 mi",
          tags: ["Business"],
          images: [],
          amenities: ["Free Wi-Fi", "Gym"],
          reviewCount: 500,
          description: "A comfortable hotel",
          cancellationPolicy: "Free cancellation",
          roomTypes: ["Standard"],
        } : null);

        setTripState({
          selected: {
            flight: matchedFlight as FlightOption | null,
            seat: null,
            hotel: matchedHotel as HotelOption | null,
            dates: { start: startDate, end: endDate },
          },
          options: {
            flights: mockFlightOptions,
            hotels: mockHotelOptions.map(h => ({
              ...h,
              totalPrice: h.pricePerNight * nights,
            })),
          },
        });
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [trip, open]);

  // Reset editing state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setIsLoading(true);
    }
  }, [open]);

  const nights = useMemo(() => {
    if (tripState.selected.dates) {
      return differenceInDays(tripState.selected.dates.end, tripState.selected.dates.start);
    }
    if (trip) {
      return differenceInDays(new Date(trip.end_date), new Date(trip.start_date));
    }
    return 1;
  }, [tripState.selected.dates, trip]);

  const totalCost = useMemo(() => {
    const flightCost = tripState.selected.flight?.price || 0;
    const seatCost = tripState.selected.seat?.price || 0;
    const hotelCost = tripState.selected.hotel ? tripState.selected.hotel.pricePerNight * nights : 0;
    return flightCost + seatCost + hotelCost;
  }, [tripState.selected, nights]);

  const handleFlightSelect = useCallback((flight: FlightOption, seat: SeatOption | null) => {
    setTripState(prev => ({
      ...prev,
      selected: { ...prev.selected, flight, seat },
    }));
    setFlightPickerOpen(false);
  }, []);

  const handleHotelSelect = useCallback((hotel: HotelOption) => {
    setTripState(prev => ({
      ...prev,
      selected: { ...prev.selected, hotel },
    }));
    setHotelPickerOpen(false);
  }, []);

  const handleDatesSelect = useCallback((start: Date, end: Date) => {
    setTripState(prev => ({
      ...prev,
      selected: { ...prev.selected, dates: { start, end } },
    }));
    setDatePickerOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!trip) return null;

  const statusConfig = getStatusConfig(trip.status);
  const isConfirmed = trip.status === "confirmed";
  const isCancelled = trip.status === "cancelled";

  const formattedDates = tripState.selected.dates
    ? `${format(tripState.selected.dates.start, "MMM d")} – ${format(tripState.selected.dates.end, "MMM d, yyyy")}`
    : `${format(new Date(trip.start_date), "MMM d")} – ${format(new Date(trip.end_date), "MMM d, yyyy")}`;

  // Generate mock timeline if none provided
  const now = new Date().toISOString();
  const displayTimeline = timeline.length > 0 ? timeline : [
    { id: "1", type: "created" as const, description: "Trip created", timestamp: now },
    { id: "2", type: "ai_recommendation" as const, description: "AI generated travel recommendations", timestamp: now },
  ];

  const drawerContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop - lightweight overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
          />
          
          {/* Drawer - using transform only */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header - Sticky */}
            <div className="shrink-0 p-6 pb-4 border-b border-border bg-background">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs font-medium", statusConfig.className)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    {trip.destination}
                  </h2>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formattedDates}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isCancelled && (
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="p-6 space-y-5">
                {isLoading ? (
                  // Skeleton loading state
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ) : (
                  <>
                    {/* Flight Module */}
                    <EditableModule
                      icon={<Plane className="w-4 h-4" />}
                      title="Flight"
                      isEditing={isEditing}
                      onChangeClick={() => setFlightPickerOpen(true)}
                      rightContent={
                        <span className="text-lg font-bold text-primary">
                          ${tripState.selected.flight?.price || 0}
                        </span>
                      }
                    >
                      {tripState.selected.flight ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{tripState.selected.flight.airline}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{tripState.selected.flight.departTime}</span>
                            <span>→</span>
                            <span>{tripState.selected.flight.arriveTime}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {tripState.selected.flight.duration} • {tripState.selected.flight.stops === 0 ? "Nonstop" : `${tripState.selected.flight.stops} stop`}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No flight selected</p>
                      )}
                    </EditableModule>

                    {/* Hotel Module */}
                    <EditableModule
                      icon={<Building2 className="w-4 h-4" />}
                      title="Hotel"
                      isEditing={isEditing}
                      onChangeClick={() => setHotelPickerOpen(true)}
                      rightContent={
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            ${tripState.selected.hotel ? tripState.selected.hotel.pricePerNight * nights : 0}
                          </span>
                          {tripState.selected.hotel && (
                            <p className="text-xs text-muted-foreground">
                              ${tripState.selected.hotel.pricePerNight}/night
                            </p>
                          )}
                        </div>
                      }
                    >
                      {tripState.selected.hotel ? (
                        <div className="space-y-3">
                          {/* Hotel photo carousel */}
                          <HotelPhotoCarousel
                            images={tripState.selected.hotel.images}
                            hotelName={tripState.selected.hotel.name}
                            compact
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{tripState.selected.hotel.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{tripState.selected.hotel.area}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-muted-foreground">
                                {tripState.selected.hotel.rating} ({tripState.selected.hotel.reviewCount.toLocaleString()} reviews)
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{nights} night{nights !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hotel selected</p>
                      )}
                    </EditableModule>

                    {/* Dates Module */}
                    <EditableModule
                      icon={<Calendar className="w-4 h-4" />}
                      title="Dates"
                      isEditing={isEditing}
                      onChangeClick={() => setDatePickerOpen(true)}
                    >
                      <div className="space-y-1">
                        <p className="text-sm">{formattedDates}</p>
                        <p className="text-xs text-muted-foreground">{nights} night{nights !== 1 ? 's' : ''}</p>
                      </div>
                    </EditableModule>

                    {/* Total Cost */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estimated Total</span>
                        <span className="text-xl font-bold">${totalCost.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Flight + {nights} nights hotel
                      </p>
                    </div>

                    {/* Decision Timeline */}
                    <div className="pt-4 border-t border-border">
                      <button
                        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                        className="w-full flex items-center justify-between hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-primary" />
                          <h4 className="font-medium text-foreground text-sm">Trip Timeline</h4>
                        </div>
                        <motion.div
                          animate={{ rotate: isTimelineOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isTimelineOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <DecisionTimeline events={displayTimeline} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Actions - Sticky */}
            {!isCancelled && !isLoading && (
              <div className="shrink-0 flex gap-3 p-6 pt-4 border-t border-border bg-background">
                {!isConfirmed && (
                  <Button 
                    className="flex-1 bg-cta hover:bg-cta-hover text-cta-foreground font-medium"
                    onClick={() => onConfirm(trip.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Trip
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className={cn(
                    "flex-1 border-destructive/30 text-destructive",
                    "hover:bg-destructive/10 hover:border-destructive/50"
                  )}
                  onClick={() => onCancel(trip.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Trip
                </Button>
              </div>
            )}
          </motion.div>

          {/* Picker modals */}
          <TripFlightPicker
            open={flightPickerOpen}
            onOpenChange={setFlightPickerOpen}
            flights={tripState.options.flights}
            selectedFlight={tripState.selected.flight}
            selectedSeat={tripState.selected.seat}
            onSelect={handleFlightSelect}
          />
          <TripHotelPicker
            open={hotelPickerOpen}
            onOpenChange={setHotelPickerOpen}
            hotels={tripState.options.hotels}
            selectedHotel={tripState.selected.hotel}
            onSelect={handleHotelSelect}
            nights={nights}
          />
          <TripDatePicker
            open={datePickerOpen}
            onOpenChange={setDatePickerOpen}
            startDate={tripState.selected.dates?.start || new Date(trip.start_date)}
            endDate={tripState.selected.dates?.end || new Date(trip.end_date)}
            onSelect={handleDatesSelect}
          />
        </>
      )}
    </AnimatePresence>
  );

  // Render via portal
  return createPortal(drawerContent, document.body);
}

// Editable module component
interface EditableModuleProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isEditing: boolean;
  onChangeClick: () => void;
  rightContent?: React.ReactNode;
}

function EditableModule({ 
  icon, 
  title, 
  children, 
  isEditing, 
  onChangeClick,
  rightContent 
}: EditableModuleProps) {
  return (
    <div className="rounded-xl bg-card border border-border/60 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
            <span className="text-sm font-medium text-foreground">{title}</span>
          </div>
          {rightContent}
        </div>
        <div className="pl-10">
          {children}
        </div>
      </div>
      
      {/* Change button - only visible in edit mode */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-border/40 bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={onChangeClick}
              >
                <Edit2 className="w-3 h-3" />
                Change {title.toLowerCase()}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
