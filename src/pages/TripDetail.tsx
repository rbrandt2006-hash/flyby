import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pencil, Plane, Building2, Car, Calendar, MapPin, DollarSign, Clock, Users, FileText, Receipt, ChevronRight, Check, X, Save, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useTrips, type LocalTrip } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { TripFlightPicker } from "@/components/trips/TripFlightPicker";
import { TripHotelPicker } from "@/components/trips/TripHotelPicker";
import { TripDatePicker } from "@/components/trips/TripDatePicker";
import { HotelDetailModal, type HotelInfo } from "@/components/trips/HotelDetailModal";
import { mockFlightOptions, mockHotelOptions } from "@/components/chats/booking/mockBookingData";
import type { FlightOption, HotelOption, SeatOption } from "@/components/chats/booking/types";
import { toast } from "sonner";

type TabType = "overview" | "itinerary" | "expenses";

interface TripData {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  purpose?: string;
  estimatedCost: number;
  flight?: {
    airline?: string;
    flightNumber?: string;
    departTime?: string;
    returnTime?: string;
  };
  hotel?: {
    name?: string;
    location?: string;
    address?: string;
    checkIn?: string;
    checkOut?: string;
    pricePerNight?: number;
    rating?: number;
    amenities?: string[];
    images?: string[];
    description?: string;
    reviewCount?: number;
  };
  groundTransport?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  confirmed: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
  archived: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

// Skeleton loader component
function TripDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>
      
      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full max-w-sm" />
      
      {/* Content cards skeleton */}
      <div className="grid gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trips: localTrips, updateTrip } = useTrips();
  
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Picker states
  const [flightPickerOpen, setFlightPickerOpen] = useState(false);
  const [hotelPickerOpen, setHotelPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Selected options for pickers
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatOption | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  
  // Edit mode state
  const [editedTrip, setEditedTrip] = useState<TripData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate nights
  const nights = useMemo(() => {
    if (!trip) return 4;
    return Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)));
  }, [trip]);

  // Demo trips fallback data (must match Dashboard demo IDs)
  const demoTrips: Record<string, TripData> = {
    "demo_trip_sf_2025": {
      id: "demo_trip_sf_2025",
      destination: "San Francisco, CA",
      startDate: "2025-01-08T00:00:00.000Z",
      endDate: "2025-01-10T00:00:00.000Z",
      status: "confirmed",
      purpose: "Client meeting",
      estimatedCost: 1850,
      flight: {
        airline: "United Airlines",
        flightNumber: "UA 1234",
        departTime: "7:00 AM",
        returnTime: "6:30 PM"
      },
      hotel: {
        name: "The Westin St. Francis",
        location: "Union Square",
        address: "335 Powell St, San Francisco, CA 94102",
        pricePerNight: 289,
        rating: 4.5,
        amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Bar", "Room Service"],
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=500&fit=crop",
        ],
        description: "Experience luxury in the heart of San Francisco. The Westin St. Francis offers world-class amenities and unparalleled views of Union Square.",
        reviewCount: 2847
      },
      groundTransport: "Uber / Lyft"
    },
    "demo_trip_seattle_2025": {
      id: "demo_trip_seattle_2025",
      destination: "Seattle, WA",
      startDate: "2025-01-15T00:00:00.000Z",
      endDate: "2025-01-17T00:00:00.000Z",
      status: "pending",
      purpose: "Team offsite",
      estimatedCost: 2100,
      flight: {
        airline: "Alaska Airlines",
        flightNumber: "AS 567",
        departTime: "8:30 AM",
        returnTime: "5:00 PM"
      },
      hotel: {
        name: "The Fairmont Olympic",
        location: "Downtown Seattle",
        address: "411 University St, Seattle, WA 98101",
        pricePerNight: 349,
        rating: 4.7,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Gym", "Restaurant", "Valet Parking"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&h=500&fit=crop",
        ],
        description: "A historic landmark in the heart of downtown Seattle. The Fairmont Olympic combines timeless elegance with modern luxury.",
        reviewCount: 1923
      },
      groundTransport: "Light Rail + Uber"
    }
  };

  // Load trip data
  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      
      // Debug logging in dev mode
      if (import.meta.env.DEV) {
        console.log('[TripDetail] Loading trip with ID:', tripId);
        console.log('[TripDetail] Local trips count:', localTrips.length);
        console.log('[TripDetail] Local trip IDs:', localTrips.map(t => t.id));
      }
      
      // Simulate loading delay for smooth skeleton display
      await new Promise(r => setTimeout(r, 300));
      
      // First check local trips from useTrips hook
      const localTrip = localTrips.find(t => t.id === tripId);
      if (localTrip) {
        if (import.meta.env.DEV) {
          console.log('[TripDetail] Found trip in local storage:', localTrip.id);
        }
        setTrip({
          id: localTrip.id,
          destination: localTrip.destination,
          startDate: localTrip.startDate,
          endDate: localTrip.endDate,
          status: localTrip.status,
          purpose: localTrip.purpose,
          estimatedCost: localTrip.estimatedCost,
          flight: localTrip.flight,
          hotel: localTrip.hotel,
          groundTransport: localTrip.groundTransport,
        });
        setIsLoading(false);
        return;
      }
      
      // Check demo trips
      if (tripId && demoTrips[tripId]) {
        if (import.meta.env.DEV) {
          console.log('[TripDetail] Found demo trip:', tripId);
        }
        setTrip(demoTrips[tripId]);
        setIsLoading(false);
        return;
      }
      
      // Fallback to backend trips (Supabase)
      if (user && tripId) {
        if (import.meta.env.DEV) {
          console.log('[TripDetail] Fetching trip from Supabase:', tripId);
        }
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .single();
        
        if (!error && data) {
          if (import.meta.env.DEV) {
            console.log('[TripDetail] Found trip in Supabase:', data.id);
          }
          setTrip({
            id: data.id,
            destination: data.destination,
            startDate: data.start_date,
            endDate: data.end_date,
            status: data.status,
            purpose: data.purpose || undefined,
            estimatedCost: data.total_estimated_cost || 0,
            flight: data.flight_details as TripData["flight"],
            hotel: data.hotel_details as TripData["hotel"],
            groundTransport: data.ground_transport as string | undefined,
          });
          setIsLoading(false);
          return;
        } else if (import.meta.env.DEV && error) {
          console.log('[TripDetail] Supabase error:', error.message);
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('[TripDetail] Trip not found anywhere for ID:', tripId);
      }
      
      setIsLoading(false);
    };
    
    loadTrip();
  }, [tripId, localTrips, user]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleFlightSelect = (flight: FlightOption, seat: SeatOption | null) => {
    setSelectedFlight(flight);
    setSelectedSeat(seat);
    if (trip) {
      setTrip(prev => prev ? {
        ...prev,
        flight: { 
          airline: flight.airline, 
          departTime: flight.departTime, 
          returnTime: flight.arriveTime 
        },
        estimatedCost: prev.estimatedCost + flight.price - (selectedFlight?.price || 400)
      } : null);
    }
    setFlightPickerOpen(false);
  };

  const handleHotelSelect = (hotel: HotelOption) => {
    setSelectedHotel(hotel);
    if (trip) {
      setTrip(prev => prev ? {
        ...prev,
        hotel: { name: hotel.name, location: hotel.area },
        estimatedCost: prev.estimatedCost + (hotel.pricePerNight * nights) - (selectedHotel?.pricePerNight ? selectedHotel.pricePerNight * nights : 600)
      } : null);
    }
    setHotelPickerOpen(false);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    if (trip) {
      setTrip(prev => prev ? {
        ...prev,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      } : null);
    }
    setDatePickerOpen(false);
  };

  // Handle starting edit mode
  const handleStartEdit = useCallback(() => {
    if (trip) {
      setEditedTrip({ ...trip });
      setIsEditing(true);
    }
  }, [trip]);

  // Handle cancelling edit
  const handleCancelEdit = useCallback(() => {
    setEditedTrip(null);
    setIsEditing(false);
  }, []);

  // Handle saving edits
  const handleSaveEdit = useCallback(async () => {
    if (!editedTrip || !trip) return;
    
    setIsSaving(true);
    try {
      // Calculate new estimated cost based on hotel price changes
      let newEstimatedCost = editedTrip.estimatedCost;
      
      // Update the trip state
      setTrip(editedTrip);
      
      // If it's a local trip, update it in the store
      if (localTrips.find(t => t.id === trip.id)) {
        updateTrip(trip.id, {
          destination: editedTrip.destination,
          startDate: editedTrip.startDate,
          endDate: editedTrip.endDate,
          purpose: editedTrip.purpose,
          estimatedCost: newEstimatedCost,
          flight: editedTrip.flight ? {
            airline: editedTrip.flight.airline || "",
            departTime: editedTrip.flight.departTime || "",
            returnTime: editedTrip.flight.returnTime || "",
          } : null,
          hotel: editedTrip.hotel ? {
            name: editedTrip.hotel.name || "",
            location: editedTrip.hotel.location || "",
          } : null,
          groundTransport: editedTrip.groundTransport || null,
        });
      }
      
      toast.success("Trip updated successfully");
      setIsEditing(false);
      setEditedTrip(null);
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [editedTrip, trip, localTrips, updateTrip]);

  // Handle hotel card click to open details modal
  const handleHotelCardClick = useCallback(() => {
    if (!isEditing) {
      setHotelModalOpen(true);
    }
  }, [isEditing]);

  // Convert trip hotel to HotelInfo for modal
  const hotelInfoForModal: HotelInfo | null = useMemo(() => {
    if (!trip?.hotel) return null;
    return {
      name: trip.hotel.name || "Hotel",
      location: trip.hotel.location,
      address: trip.hotel.address,
      rating: trip.hotel.rating,
      pricePerNight: trip.hotel.pricePerNight,
      amenities: trip.hotel.amenities,
      images: trip.hotel.images,
      description: trip.hotel.description,
      reviewCount: trip.hotel.reviewCount,
    };
  }, [trip?.hotel]);

  const status = trip ? (statusConfig[trip.status] || statusConfig.draft) : statusConfig.draft;

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "itinerary", label: "Itinerary" },
    { id: "expenses", label: "Expenses" },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="trip-detail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen bg-background"
      >
        {/* Sticky Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
        >
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              {isLoading ? (
                <div className="space-y-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : trip ? (
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold text-foreground">{trip.destination}</h1>
                    <Badge variant="outline" className={cn("text-xs", status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              ) : null}
            </div>
            
            {/* Edit/Save/Cancel buttons */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="gap-1"
                  >
                    {isSaving ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartEdit}
                  className="rounded-full hover:bg-muted hover:text-primary transition-colors"
                  aria-label="Edit trip"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
          {isLoading ? (
            <TripDetailSkeleton />
          ) : trip ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="space-y-6"
            >
              {/* Segmented Control / Tabs */}
              <div className="bg-muted/50 p-1 rounded-xl inline-flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Trip Summary Card */}
                    <Card className="border border-border/50">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{trip.destination}</p>
                            {trip.purpose && (
                              <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Estimated Cost</span>
                          </div>
                          <span className="text-xl font-bold text-foreground">
                            ${trip.estimatedCost.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Flight Card */}
                    <Card className="border border-border/50 group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <Plane className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {trip.flight?.airline || "No flight selected"}
                              </p>
                              {trip.flight?.flightNumber && (
                                <p className="text-sm text-muted-foreground">
                                  Flight {trip.flight.flightNumber}
                                </p>
                              )}
                              {trip.flight?.departTime && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Depart: {trip.flight.departTime} • Return: {trip.flight.returnTime || "—"}
                                </p>
                              )}
                            </div>
                          </div>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFlightPickerOpen(true)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Change
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hotel Card - Clickable with thumbnail */}
                    <Card 
                      className={cn(
                        "border border-border/50 group transition-all",
                        !isEditing && "cursor-pointer hover:border-primary/30 hover:shadow-md"
                      )}
                      onClick={handleHotelCardClick}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Hotel thumbnail image */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                            {trip.hotel?.images?.[0] ? (
                              <img 
                                src={trip.hotel.images[0]} 
                                alt={trip.hotel.name || "Hotel"} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                                <Building2 className="w-8 h-8 text-amber-500/60" />
                              </div>
                            )}
                          </div>
                          
                          {/* Hotel info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {trip.hotel?.name || "No hotel selected"}
                                </p>
                                {trip.hotel?.location && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {trip.hotel.location}
                                  </p>
                                )}
                                {trip.hotel?.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-amber-500">★</span>
                                    <span className="text-xs text-muted-foreground">
                                      {trip.hotel.rating.toFixed(1)}
                                    </span>
                                    {trip.hotel?.pricePerNight && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ${trip.hotel.pricePerNight}/night
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {isEditing ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHotelPickerOpen(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                  Change
                                </Button>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dates Card */}
                    <Card className="border border-border/50 group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Travel Dates</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(trip.startDate), "EEEE, MMM d")} – {format(new Date(trip.endDate), "EEEE, MMM d, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} nights
                              </p>
                            </div>
                          </div>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDatePickerOpen(true)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ground Transport */}
                    {trip.groundTransport && (
                      <Card className="border border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                              <Car className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Ground Transport</p>
                              <p className="text-sm text-muted-foreground">{trip.groundTransport}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}

                {activeTab === "itinerary" && (
                  <motion.div
                    key="itinerary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <Card className="border border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Day-by-Day Schedule
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Placeholder itinerary items */}
                        {Array.from({ length: Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 }).map((_, i) => {
                          const dayDate = new Date(trip.startDate);
                          dayDate.setDate(dayDate.getDate() + i);
                          return (
                            <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                <span className="text-xs text-muted-foreground">{format(dayDate, "EEE")}</span>
                                <span className="text-lg font-bold text-primary">{format(dayDate, "d")}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  {i === 0 ? "Arrival Day" : i === Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) ? "Departure Day" : `Day ${i + 1}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {i === 0 
                                    ? `Arrive in ${trip.destination}, check into ${trip.hotel?.name || "hotel"}`
                                    : i === Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
                                    ? "Check out and return flight"
                                    : "Meetings and activities"
                                  }
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "expenses" && (
                  <motion.div
                    key="expenses"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <Card className="border border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          Trip Expenses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <Receipt className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">No expenses recorded yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expenses will appear here once the trip begins
                          </p>
                          <Button variant="outline" className="mt-4">
                            Add Expense
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Budget Summary */}
                    <Card className="border border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget Estimate</p>
                            <p className="text-2xl font-bold text-foreground">
                              ${trip.estimatedCost.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-2xl font-bold text-success">$0</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: "0%" }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          ${trip.estimatedCost.toLocaleString()} remaining
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Trip not found</p>
              <Button variant="outline" onClick={handleBack} className="mt-4">
                Go Back
              </Button>
            </div>
          )}
        </main>

        {/* Pickers */}
        <TripFlightPicker
          open={flightPickerOpen}
          onOpenChange={setFlightPickerOpen}
          flights={mockFlightOptions}
          selectedFlight={selectedFlight}
          selectedSeat={selectedSeat}
          onSelect={handleFlightSelect}
        />
        
        <TripHotelPicker
          open={hotelPickerOpen}
          onOpenChange={setHotelPickerOpen}
          hotels={mockHotelOptions}
          selectedHotel={selectedHotel}
          onSelect={handleHotelSelect}
          nights={nights}
        />
        
        <TripDatePicker
          open={datePickerOpen}
          onOpenChange={setDatePickerOpen}
          startDate={trip ? new Date(trip.startDate) : new Date()}
          endDate={trip ? new Date(trip.endDate) : new Date()}
          onSelect={handleDateSelect}
        />
        
        {/* Hotel Detail Modal */}
        {hotelInfoForModal && (
          <HotelDetailModal
            hotel={hotelInfoForModal}
            isOpen={hotelModalOpen}
            onClose={() => setHotelModalOpen(false)}
            onChangeHotel={() => setHotelPickerOpen(true)}
            nights={nights}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
