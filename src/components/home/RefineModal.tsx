import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Hotel, Car, Check, ChevronDown, Star, Clock, DollarSign, MapPin, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import type { Flight } from "@/components/flights/FlightResults";
import type { HotelOption as TripHotelOption } from "@/components/chats/booking/types";
import type { GroundTransportOption } from "@/services/mockGroundTransportService";
import { getHotelsForDestination } from "@/services/mockHotelService";

interface FlightOption {
  id: string;
  airline: string;
  departTime: string;
  returnTime: string;
  price: number;
  duration: string;
  stops: number;
  tags: string[];
}

interface HotelOption {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  rating: number;
  distance: string;
  tags: string[];
}

interface GroundOption {
  id: string;
  type: string;
  provider: string;
  price: number;
  description: string;
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
  // The real ground-transport options for this trip (same list shown at search
  // time). When provided, the Ground tab shows these instead of a generic mock.
  ground?: GroundTransportOption[];
  currentFlight: { airline: string; departTime: string; returnTime: string };
  currentHotel: { name: string; location: string };
  currentGroundTransport: string;
  currentCost: number;
  onSave: (selections: {
    flight: { airline: string; departTime: string; returnTime: string };
    hotel: { name: string; location: string };
    groundTransport: string;
    estimatedCost: number;
  }) => void;
}

// Generate mock flight options
function generateFlightOptions(destination: string): FlightOption[] {
  const airlines = [
    { name: "American Airlines", basePrice: 380 },
    { name: "Delta Air Lines", basePrice: 420 },
    { name: "United Airlines", basePrice: 395 },
    { name: "Southwest Airlines", basePrice: 310 },
    { name: "JetBlue Airways", basePrice: 340 },
  ];
  
  const departures = ["6:00 AM", "7:45 AM", "9:30 AM", "12:15 PM", "3:45 PM"];
  const returns = ["4:30 PM", "5:45 PM", "7:00 PM", "8:30 PM", "9:15 PM"];
  
  return airlines.map((airline, i) => {
    const priceVariation = Math.floor(Math.random() * 100) - 50;
    const price = airline.basePrice + priceVariation;
    const stops = i < 2 ? 0 : i < 4 ? 1 : 2;
    const duration = stops === 0 ? "2h 45m" : stops === 1 ? "4h 15m" : "6h 30m";
    
    const tags: string[] = [];
    if (i === 3) tags.push("Best value");
    if (i === 0) tags.push("Shortest travel time");
    if (stops === 0) tags.push("Nonstop");
    
    return {
      id: `flight-${i}`,
      airline: airline.name,
      departTime: departures[i],
      returnTime: returns[i],
      price,
      duration,
      stops,
      tags,
    };
  });
}

// Fallback hotels for the destination.
//
// This used to return a hardcoded Washington-DC list ("The Willard
// InterContinental", "Capitol Hill"...) regardless of where the trip actually
// went, so refining a London trip could show DC hotels. It now uses the same
// destination-aware hotel source the rest of the app uses, so the fallback is
// at least for the right city.
function generateHotelOptions(destination: string): HotelOption[] {
  return getHotelsForDestination({ destination, nights: 3 }).map(realToHotelOption);
}

// Generate mock ground transport options
function generateGroundOptions(): GroundOption[] {
  return [
    {
      id: "ground-1",
      type: "Rideshare",
      provider: "Uber",
      price: 35,
      description: "Estimated fare from DCA airport",
      tags: ["Convenient"],
    },
    {
      id: "ground-2",
      type: "Rideshare",
      provider: "Lyft",
      price: 32,
      description: "Estimated fare from DCA airport",
      tags: ["Best value"],
    },
    {
      id: "ground-3",
      type: "Public Transit",
      provider: "Metro",
      price: 6,
      description: "Blue/Yellow Line from DCA to downtown",
      tags: ["Budget", "Eco-friendly"],
    },
    {
      id: "ground-4",
      type: "Rental Car",
      provider: "Hertz",
      price: 65,
      description: "Compact car, per day rate",
      tags: ["Flexibility"],
    },
  ];
}

// Map a real Flight (Duffel offer or local fallback) into the modal's
// FlightOption shape. Real flights are one-way departure→arrival, so the
// "return" slot displays the arrival time.
function realToFlightOption(f: Flight): FlightOption {
  const tags: string[] = [];
  if (f.isFastest) tags.push("Shortest travel time");
  if (f.isLowest) tags.push("Best value");
  if (f.stops === 0) tags.push("Nonstop");
  return {
    id: f.id,
    airline: f.airline,
    departTime: f.departureTime,
    returnTime: f.arrivalTime,
    price: f.price,
    duration: f.duration,
    stops: f.stops,
    tags,
  };
}

// Map a real ground-transport option into the modal's GroundOption shape.
function realToGroundOption(g: GroundTransportOption): GroundOption {
  return {
    id: g.id,
    type: g.rideType || g.type,
    provider: g.provider,
    price: g.price,
    description: g.description,
    tags: g.tags,
  };
}

// Map a real trip hotel into the modal's HotelOption shape.
function realToHotelOption(h: TripHotelOption): HotelOption {
  return {
    id: h.id,
    name: h.name,
    location: h.area,
    pricePerNight: h.pricePerNight,
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
  ground,
  currentFlight,
  currentHotel,
  currentGroundTransport,
  currentCost,
  onSave,
}: RefineModalProps) {
  const [activeTab, setActiveTab] = useState("flights");
  const [sortBy, setSortBy] = useState("recommended");

  // Prefer the real flights this trip was planned with (so Refine matches what
  // the user actually searched); fall back to the local generator only when no
  // real flights were passed in (e.g. offline).
  const flightOptions = useMemo(
    () =>
      flights && flights.length > 0
        ? flights.map(realToFlightOption)
        : generateFlightOptions(destination),
    [flights, destination],
  );
  const hotelOptions = useMemo(
    () =>
      hotels && hotels.length > 0
        ? hotels.map(realToHotelOption)
        : generateHotelOptions(destination),
    [hotels, destination],
  );
  const groundOptions = useMemo(
    () =>
      ground && ground.length > 0
        ? ground.map(realToGroundOption)
        : generateGroundOptions(),
    [ground],
  );
  
  // Track selections
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(
    flightOptions.find(f => f.airline === currentFlight.airline) || flightOptions[0]
  );
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(
    hotelOptions.find(h => h.name === currentHotel.name) || hotelOptions[0]
  );
  const [selectedGround, setSelectedGround] = useState<GroundOption | null>(groundOptions[0]);
  
  // Calculate updated cost
  const updatedCost = useMemo(() => {
    const flightCost = (selectedFlight?.price || 0) * 2; // Round trip
    const hotelCost = (selectedHotel?.pricePerNight || 0) * 2; // 2 nights
    const groundCost = (selectedGround?.price || 0) * 2; // Both ways
    return flightCost + hotelCost + groundCost + 150; // Add misc costs
  }, [selectedFlight, selectedHotel, selectedGround]);
  
  const handleSave = () => {
    if (selectedFlight && selectedHotel && selectedGround) {
      onSave({
        flight: {
          airline: selectedFlight.airline,
          departTime: selectedFlight.departTime,
          returnTime: selectedFlight.returnTime,
        },
        hotel: {
          name: selectedHotel.name,
          location: selectedHotel.location,
        },
        groundTransport: `${selectedGround.provider} - $${selectedGround.price} estimated`,
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
                <TabsList className="grid grid-cols-3 w-auto">
                  <TabsTrigger value="flights" className="gap-2">
                    <Plane className="w-4 h-4" />
                    Flights
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="gap-2">
                    <Hotel className="w-4 h-4" />
                    Hotels
                  </TabsTrigger>
                  <TabsTrigger value="ground" className="gap-2">
                    <Car className="w-4 h-4" />
                    Ground
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
                              {flight.departTime} → {flight.returnTime}
                            </span>
                            <span>{flight.duration}</span>
                            <span>{flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold">${flight.price}</p>
                          <p className="text-xs text-muted-foreground">per person</p>
                          {selectedFlight?.id === flight.id && (
                            <Check className="w-5 h-5 text-primary mt-1" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>
                
                <TabsContent value="hotels" className="mt-0 space-y-3">
                  {sortedHotels.map((hotel) => (
                    <motion.div
                      key={hotel.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedHotel(hotel)}
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
                            <span>{hotel.distance} to center</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-warning text-warning" />
                              {hotel.rating}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold">${hotel.pricePerNight}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                          {selectedHotel?.id === hotel.id && (
                            <Check className="w-5 h-5 text-primary mt-1" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>
                
                <TabsContent value="ground" className="mt-0 space-y-3">
                  {groundOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedGround(option)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedGround?.id === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{option.provider}</p>
                            <Badge variant="outline" className="text-xs">{option.type}</Badge>
                            {option.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-bold">${option.price}</p>
                          <p className="text-xs text-muted-foreground">each way</p>
                          {selectedGround?.id === option.id && (
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
