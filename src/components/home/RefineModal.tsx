import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Hotel, Check, ChevronDown, Star, Clock, DollarSign, MapPin, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import type { Flight } from "@/components/flights/FlightResults";
import type { HotelOption as TripHotelOption } from "@/components/chats/booking/types";

interface FlightOption {
  id: string;
  airline: string;
  departTime: string;
  returnTime: string;
  price: number;
  duration: string;
  stops: number;
  tags: string[];
  /** Days after departure the outbound lands. */
  arriveDayOffset?: number;
  /** The journey home, when the fare is a round trip. */
  returnLine?: string;
  roundTrip?: boolean;
}

interface HotelOption {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  /** The supplier's total for the stay — not per-night times nights, which drifts by rounding. */
  totalPrice: number;
  rating: number;
  distance: string;
  tags: string[];
}

interface RefineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: string;
  dates: string;
  // The real flights fetched for this trip (Duffel offers, or the local
  // fallback) — the same list shown when the trip was first planned. When
  // provided, the Flights tab shows these instead of a generic mock list so
  // Refine stays consistent with what the user actually searched.
  flights?: Flight[];
  // The real, destination-specific hotels for this trip (same list used
  // elsewhere in the app). When provided, the Hotels tab shows these instead
  // of a generic mock list.
  hotels?: TripHotelOption[];
  currentFlight: { airline: string; departTime: string; returnTime: string };
  currentHotel: { name: string; location: string };
  currentCost: number;
  /** Nights of the stay, so the hotel is priced for the actual trip. */
  nights?: number;
  onSave: (selections: {
    /** Id of the chosen offer — what Confirm & Book must actually purchase. */
    flightId: string;
    /** Live search result id of the chosen hotel, or null for no hotel. */
    hotelId: string | null;
    flight: { airline: string; departTime: string; returnTime: string };
    hotel: { name: string; location: string; pricePerNight?: number; totalPrice?: number; nights?: number };
    estimatedCost: number;
  }) => void;
}

// Map a real Flight (Duffel offer or local fallback) into the modal's
// FlightOption shape. `returnTime` holds the outbound's arrival time (the name
// is historical); the journey home, on a round trip, is in `returnLine`.
function realToFlightOption(f: Flight): FlightOption {
  const tags: string[] = [];
  if (f.isFastest) tags.push("Shortest travel time");
  if (f.isLowest) tags.push("Best value");
  if (f.stops === 0) tags.push("Nonstop");
  const plus = (days?: number) => (days ? ` (+${days})` : "");
  const stops = (n?: number) => (n === undefined ? "" : n === 0 ? "Nonstop" : `${n} stop${n > 1 ? "s" : ""}`);
  const roundTrip = f.tripType === "round_trip";
  return {
    id: f.id,
    airline: f.airline,
    departTime: f.departureTime,
    returnTime: f.arrivalTime,
    price: f.price,
    duration: f.duration,
    stops: f.stops,
    tags,
    arriveDayOffset: f.arriveDayOffset,
    roundTrip,
    returnLine: roundTrip
      ? `Back ${f.returnDepartureTime} → ${f.returnArrivalTime}${plus(f.returnArriveDayOffset)} · ${[f.returnDuration, stops(f.returnStops)].filter(Boolean).join(" · ")}`
      : undefined,
  };
}

// Map a real trip hotel into the modal's HotelOption shape.
function realToHotelOption(h: TripHotelOption): HotelOption {
  return {
    id: h.id,
    name: h.name,
    location: h.area,
    pricePerNight: h.pricePerNight,
    totalPrice: h.totalPrice,
    rating: h.rating,
    distance: h.distanceToVenue,
    tags: h.tags,
  };
}

export function RefineModal({
  open,
  onOpenChange,
  destination,
  dates,
  flights,
  hotels,
  currentFlight,
  currentHotel,
  currentCost,
  nights = 1,
  onSave,
}: RefineModalProps) {
  const [activeTab, setActiveTab] = useState("flights");
  const [sortBy, setSortBy] = useState("recommended");

  // Only the live offers this trip was planned with. There is no generated
  // fallback: a list of invented flights here once offered a Qatar Airways
  // nonstop from LAX to Dubai, which does not exist. Offer ids from the airline
  // feed start with "off_"; anything else is dropped.
  const flightOptions = useMemo(
    () => (flights || []).filter((f) => f.id.startsWith("off_")).map(realToFlightOption),
    [flights],
  );
  // Only hotels from the live supplier — the ones this trip was planned with.
  // No generated list stands in when there are none.
  const hotelOptions = useMemo(
    () => (hotels || []).filter((h) => h.live).map(realToHotelOption),
    [hotels],
  );
  
  // Track selections
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(
    flightOptions.find(f => f.airline === currentFlight.airline && f.departTime === currentFlight.departTime)
      || flightOptions.find(f => f.airline === currentFlight.airline)
      || flightOptions[0]
      || null
  );
  // Starts on the hotel already on the itinerary — or on none, if it has none.
  // It used to default to the first hotel in the list, so merely opening Refine
  // and saving would add a hotel nobody chose.
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(
    (currentHotel.name && hotelOptions.find(h => h.name === currentHotel.name)) || null
  );
  
  // What will be charged: the fare and the stay, exactly as the itinerary sums
  // them.
  const updatedCost = useMemo(
    () => (selectedFlight?.price || 0) + (selectedHotel?.totalPrice || 0),
    [selectedFlight, selectedHotel],
  );

  const handleSave = () => {
    // A flight is required; a hotel is not — a trip can have none.
    if (selectedFlight) {
      onSave({
        flightId: selectedFlight.id,
        hotelId: selectedHotel?.id ?? null,
        flight: {
          airline: selectedFlight.airline,
          departTime: selectedFlight.departTime,
          returnTime: selectedFlight.returnTime,
        },
        hotel: selectedHotel
          ? {
              name: selectedHotel.name,
              location: selectedHotel.location,
              pricePerNight: selectedHotel.pricePerNight,
              totalPrice: selectedHotel.totalPrice,
              nights,
            }
          : { name: "", location: "" },
        estimatedCost: updatedCost,
      });
      onOpenChange(false);
    }
  };
  
  // Sort options
  const sortedFlights = useMemo(() => {
    const flights = [...flightOptions];
    if (sortBy === "cheapest") return flights.sort((a, b) => a.price - b.price);
    if (sortBy === "fastest") return flights.sort((a, b) => a.stops - b.stops);
    return flights; // recommended = default order
  }, [flightOptions, sortBy]);
  
  const sortedHotels = useMemo(() => {
    const hotels = [...hotelOptions];
    if (sortBy === "cheapest") return hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
    if (sortBy === "closest") return hotels.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return hotels;
  }, [hotelOptions, sortBy]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Modal - Centered with flexbox, not transforms */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header - Sticky */}
            <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-border bg-background">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Refine Trip</h2>
                <p className="text-sm text-muted-foreground">{destination} • {dates}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Tabs container - flex-1 with min-h-0 for proper scroll */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              {/* Controls row - Sticky */}
              <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background">
                <TabsList className="grid grid-cols-2 w-auto">
                  <TabsTrigger value="flights" className="gap-2">
                    <Plane className="w-4 h-4" />
                    Flights
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="gap-2">
                    <Hotel className="w-4 h-4" />
                    Hotels
                  </TabsTrigger>
                </TabsList>
                
                {(
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="cheapest">Cheapest</SelectItem>
                      {activeTab === "flights" && <SelectItem value="fastest">Fastest</SelectItem>}
                      {activeTab === "hotels" && <SelectItem value="closest">Closest</SelectItem>}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Scrollable content area - THIS is the scroll container */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="mx-auto w-full max-w-[760px] px-6 py-5">
                <TabsContent value="flights" className="mt-0 space-y-3">
                  {sortedFlights.length === 0 && (
                    <div className="rounded-xl border border-border p-6 text-center text-sm space-y-1">
                      <p className="font-medium">No live flights to choose from</p>
                      <p className="text-muted-foreground">
                        Flyby only lists real flights from the airlines. Run the search again once live flight search is reachable.
                      </p>
                    </div>
                  )}
                  {sortedFlights.map((flight) => (
                    <motion.div
                      key={flight.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedFlight(flight)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedFlight?.id === flight.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{flight.airline}</p>
                            {flight.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {flight.departTime} → {flight.returnTime}{flight.arriveDayOffset ? ` (+${flight.arriveDayOffset})` : ""}
                            </span>
                            <span>{flight.duration}</span>
                            <span>{flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</span>
                          </div>
                          {flight.returnLine && (
                            <p className="text-sm text-muted-foreground">{flight.returnLine}</p>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold">${flight.price}</p>
                          <p className="text-xs text-muted-foreground">{flight.roundTrip ? "round trip total" : "one way total"}</p>
                          {selectedFlight?.id === flight.id && (
                            <Check className="w-5 h-5 text-primary mt-1" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>
                
                <TabsContent value="hotels" className="mt-0 space-y-3">
                  {sortedHotels.length === 0 && (
                    <div className="rounded-xl border border-border p-6 text-center text-sm space-y-1">
                      <p className="font-medium">No hotels to choose from</p>
                      <p className="text-muted-foreground">
                        Flyby only lists real, bookable hotels, and none were available for this trip.
                      </p>
                    </div>
                  )}
                  {sortedHotels.map((hotel) => (
                    <motion.div
                      key={hotel.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      // Clicking the selected hotel again removes it from the trip.
                      onClick={() => setSelectedHotel(selectedHotel?.id === hotel.id ? null : hotel)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedHotel?.id === hotel.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{hotel.name}</p>
                            {hotel.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {hotel.location}
                            </span>
                            {hotel.distance && <span>{hotel.distance}</span>}
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-warning text-warning" />
                              {hotel.rating}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold">${hotel.pricePerNight}</p>
                          <p className="text-xs text-muted-foreground">per night · ${hotel.totalPrice.toLocaleString()} total</p>
                          {selectedHotel?.id === hotel.id && (
                            <Check className="w-5 h-5 text-primary mt-1" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>
                
                </div>
              </div>
            </Tabs>
            
            {/* Footer - Sticky */}
            <div className="shrink-0 px-6 py-5 border-t border-border bg-secondary/30">
              <div className="mx-auto max-w-[760px]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Updated total cost</p>
                    <p className="text-2xl font-bold">${updatedCost.toLocaleString()}</p>
                  </div>
                  <div className={cn(
                    "text-sm font-medium px-3 py-1 rounded-full",
                    updatedCost < currentCost 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : updatedCost > currentCost 
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {updatedCost < currentCost 
                      ? `$${(currentCost - updatedCost).toLocaleString()} savings`
                      : updatedCost > currentCost
                        ? `$${(updatedCost - currentCost).toLocaleString()} more`
                        : "Same price"}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
