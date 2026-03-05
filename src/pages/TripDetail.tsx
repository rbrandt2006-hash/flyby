import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pencil, Plane, Building2, Calendar, MapPin, DollarSign, Clock, Users, FileText, Receipt, ChevronRight, Check, X, Save, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips, type LocalTrip } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { FlightSelectionPage, type FlightOption } from "@/components/trips/FlightSelectionPage";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { TripDateSelectionPage } from "@/components/trips/TripDateSelectionPage";
import { HotelDetailModal, type HotelInfo } from "@/components/trips/HotelDetailModal";
import { ItineraryEditor } from "@/components/itinerary/ItineraryEditor";
import type { HotelOption as FullHotelOption } from "@/components/chats/booking/types";
import { generateFlightOptions } from "@/services/mockFlightGenerator";
import { getHotelsForDestination } from "@/services/mockHotelService";
import { toast } from "sonner";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { useExpenses, type Expense } from "@/hooks/useExpenses";

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
    price?: number;
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
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  confirmed: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
  archived: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

// Hotel options now use imported getHotelsForDestination from mockHotelService

// Skeleton loader component
function TripDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
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
  const { addExpense } = useExpenses();
  
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  // Full-screen selector states
  const [flightSelectorOpen, setFlightSelectorOpen] = useState(false);
  const [hotelSelectorOpen, setHotelSelectorOpen] = useState(false);
  const [dateSelectorOpen, setDateSelectorOpen] = useState(false);
  
  // Selected options
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<FullHotelOption | null>(null);
  
  // Hotel detail modal (for non-edit mode viewing)
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Calculate nights
  const nights = useMemo(() => {
    if (!trip) return 2;
    return Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)));
  }, [trip]);

  // Generate options based on trip destination
  const flightOptions = useMemo(() => {
    if (!trip?.destination) return [];
    return generateFlightOptions({ destination: trip.destination.split(",")[0] || "SFO" });
  }, [trip?.destination]);

  const hotelOptions = useMemo(() => {
    if (!trip?.destination) return [];
    return getHotelsForDestination({ destination: trip.destination, nights });
  }, [trip?.destination, nights]);


  // Demo trips fallback data
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
        returnTime: "6:30 PM",
        price: 450
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
        description: "Experience luxury in the heart of San Francisco.",
        reviewCount: 2847
      },
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
        returnTime: "5:00 PM",
        price: 380
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
        description: "A historic landmark in downtown Seattle.",
        reviewCount: 1923
      },
    }
  };

  // Load trip data
  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 300));
      
      // Check local trips
      const localTrip = localTrips.find(t => t.id === tripId);
      if (localTrip) {
        setTrip({
          id: localTrip.id,
          destination: localTrip.destination,
          startDate: localTrip.startDate,
          endDate: localTrip.endDate,
          status: localTrip.status,
          purpose: localTrip.purpose,
          estimatedCost: localTrip.estimatedCost,
          flight: localTrip.flight ? { ...localTrip.flight } : undefined,
          hotel: localTrip.hotel ? { ...localTrip.hotel } : undefined,
        });
        setIsLoading(false);
        return;
      }
      
      // Check demo trips
      if (tripId && demoTrips[tripId]) {
        setTrip(demoTrips[tripId]);
        setIsLoading(false);
        return;
      }
      
      // Fallback to Supabase
      if (user && tripId) {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .single();
        
        if (!error && data) {
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
          });
          setIsLoading(false);
          return;
        }
      }
      
      setIsLoading(false);
    };
    
    loadTrip();
  }, [tripId, localTrips, user]);

  const handleBack = () => {
    navigate(-1);
  };

  // Calculate estimated cost
  const calculateEstimatedCost = useCallback((
    flightPrice?: number,
    hotelPricePerNight?: number,
    _groundPrice?: number,
    tripNights?: number
  ): number => {
    const flightCost = flightPrice || trip?.flight?.price || 400;
    const hotelCost = (hotelPricePerNight || trip?.hotel?.pricePerNight || 250) * (tripNights || nights);
    return flightCost + hotelCost;
  }, [trip, nights]);

  // Handle flight selection
  const handleFlightSelect = useCallback((flight: FlightOption) => {
    setSelectedFlight(flight);
    setTrip(prev => {
      if (!prev) return null;
      const newCost = calculateEstimatedCost(flight.price, prev.hotel?.pricePerNight);
      return {
        ...prev,
        flight: { 
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          departTime: flight.departTime, 
          returnTime: flight.arriveTime,
          price: flight.price
        },
        estimatedCost: newCost
      };
    });
    setFlightSelectorOpen(false);
    toast.success(`Flight updated to ${flight.airline}`);
  }, [calculateEstimatedCost]);

  // Handle hotel selection
  const handleHotelSelect = useCallback((hotel: FullHotelOption) => {
    setSelectedHotel(hotel);
    setTrip(prev => {
      if (!prev) return null;
      const newCost = calculateEstimatedCost(prev.flight?.price, hotel.pricePerNight);
      return {
        ...prev,
        hotel: { 
          name: hotel.name, 
          location: hotel.area,
          pricePerNight: hotel.pricePerNight,
          rating: hotel.rating,
          images: hotel.images,
          amenities: hotel.amenities,
          description: hotel.description,
          reviewCount: hotel.reviewCount,
        },
        estimatedCost: newCost
      };
    });
    setHotelSelectorOpen(false);
    toast.success(`Hotel updated to ${hotel.name}`);
  }, [calculateEstimatedCost]);

  // Handle date selection
  const handleDateSelect = useCallback((start: Date, end: Date) => {
    const newNights = Math.max(1, differenceInDays(end, start));
    setTrip(prev => {
      if (!prev) return null;
      const newCost = calculateEstimatedCost(prev.flight?.price, prev.hotel?.pricePerNight, undefined, newNights);
      return {
        ...prev,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        estimatedCost: newCost
      };
    });
    setDateSelectorOpen(false);
    toast.success("Travel dates updated");
  }, [calculateEstimatedCost]);

  // Toggle edit mode
  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // Save changes
  const handleSaveChanges = useCallback(async () => {
    if (!trip) return;
    
    setIsSaving(true);
    try {
      // Update local trip if exists
      if (localTrips.find(t => t.id === trip.id)) {
        updateTrip(trip.id, {
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          purpose: trip.purpose,
          estimatedCost: trip.estimatedCost,
          flight: trip.flight ? {
            airline: trip.flight.airline || "",
            departTime: trip.flight.departTime || "",
            returnTime: trip.flight.returnTime || "",
          } : null,
          hotel: trip.hotel ? {
            name: trip.hotel.name || "",
            location: trip.hotel.location || "",
          } : null,
        });
      }
      
      toast.success("Trip saved successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [trip, localTrips, updateTrip]);

  // Handle card clicks
  const handleFlightCardClick = useCallback(() => {
    if (isEditing) {
      setFlightSelectorOpen(true);
    }
  }, [isEditing]);

  const handleHotelCardClick = useCallback(() => {
    if (isEditing) {
      setHotelSelectorOpen(true);
    } else if (trip?.hotel) {
      setHotelModalOpen(true);
    }
  }, [isEditing, trip?.hotel]);

  const handleDateCardClick = useCallback(() => {
    if (isEditing) {
      setDateSelectorOpen(true);
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
            
            {/* Edit/Save buttons */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleEdit}
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveChanges}
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
                  onClick={handleToggleEdit}
                  className="rounded-full hover:bg-muted hover:text-primary transition-colors"
                  aria-label="Edit trip"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Edit Mode Banner */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary/5 border-b border-primary/20 overflow-hidden"
            >
              <div className="px-4 md:px-6 py-3 max-w-4xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Edit Mode</span>
                  <span className="text-primary/70">— Tap any card to make changes</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              {/* Tabs */}
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
                    <Card 
                      className={cn(
                        "border border-border/50 group transition-all",
                        isEditing && "cursor-pointer hover:border-primary/30 hover:shadow-md"
                      )}
                      onClick={handleFlightCardClick}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <Plane className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              {trip.flight?.airline ? (
                                <>
                                  <p className="font-medium text-foreground">
                                    {trip.flight.airline}
                                  </p>
                                  {trip.flight.flightNumber && (
                                    <p className="text-sm text-muted-foreground">
                                      Flight {trip.flight.flightNumber}
                                    </p>
                                  )}
                                  {trip.flight.departTime && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Depart: {trip.flight.departTime} • Return: {trip.flight.returnTime || "—"}
                                    </p>
                                  )}
                                  {trip.flight.price && (
                                    <p className="text-xs text-primary mt-1 font-medium">
                                      ${trip.flight.price}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-muted-foreground">No flight selected</p>
                                  {isEditing && (
                                    <button 
                                      className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFlightSelectorOpen(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add flight
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing && (
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hotel Card */}
                    <Card 
                      className={cn(
                        "border border-border/50 group transition-all cursor-pointer",
                        "hover:border-primary/30 hover:shadow-md"
                      )}
                      onClick={handleHotelCardClick}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Hotel thumbnail */}
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
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {trip.hotel?.name ? (
                                  <>
                                    <p className="font-medium text-foreground truncate">
                                      {trip.hotel.name}
                                    </p>
                                    {trip.hotel.location && (
                                      <p className="text-sm text-muted-foreground truncate">
                                        {trip.hotel.location}
                                      </p>
                                    )}
                                    {trip.hotel.rating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-amber-500">★</span>
                                        <span className="text-xs text-muted-foreground">
                                          {trip.hotel.rating.toFixed(1)}
                                        </span>
                                        {trip.hotel.pricePerNight && (
                                          <span className="text-xs text-primary ml-2 font-medium">
                                            ${trip.hotel.pricePerNight}/night
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium text-muted-foreground">No hotel selected</p>
                                    {isEditing && (
                                      <button 
                                        className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setHotelSelectorOpen(true);
                                        }}
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add hotel
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dates Card */}
                    <Card 
                      className={cn(
                        "border border-border/50 group transition-all",
                        isEditing && "cursor-pointer hover:border-primary/30 hover:shadow-md"
                      )}
                      onClick={handleDateCardClick}
                    >
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
                                {nights} {nights === 1 ? "night" : "nights"}
                              </p>
                            </div>
                          </div>
                          {isEditing && (
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                  </motion.div>
                )}

                {activeTab === "itinerary" && (
                  <motion.div
                    key="itinerary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ItineraryEditor
                      tripId={trip.id}
                      startDate={new Date(trip.startDate)}
                      endDate={new Date(trip.endDate)}
                      destination={trip.destination}
                      tripData={{
                        destination: trip.destination,
                        flight: trip.flight ? {
                          airline: trip.flight.airline,
                          flightNumber: trip.flight.flightNumber,
                          departTime: trip.flight.departTime,
                          returnTime: trip.flight.returnTime,
                        } : undefined,
                        hotel: trip.hotel ? {
                          name: trip.hotel.name,
                          location: trip.hotel.location,
                        } : undefined,
                      }}
                      isEditing={isEditing}
                      onSave={handleSaveChanges}
                    />
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
                          <Button variant="outline" className="mt-4" onClick={() => setIsAddExpenseOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
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

        {/* Full-Screen Selectors */}
        <FlightSelectionPage
          open={flightSelectorOpen}
          onClose={() => setFlightSelectorOpen(false)}
          flights={flightOptions}
          selectedFlight={selectedFlight}
          onSelect={handleFlightSelect}
          origin="Home"
          destination={trip?.destination}
        />
        
        <HotelSelectionPage
          open={hotelSelectorOpen}
          onClose={() => setHotelSelectorOpen(false)}
          hotels={hotelOptions}
          selectedHotel={selectedHotel}
          onSelect={handleHotelSelect}
          nights={nights}
          venueName={trip?.destination}
        />
        
        <TripDateSelectionPage
          open={dateSelectorOpen}
          onClose={() => setDateSelectorOpen(false)}
          startDate={trip ? new Date(trip.startDate) : new Date()}
          endDate={trip ? new Date(trip.endDate) : new Date()}
          onSelect={handleDateSelect}
          tripDestination={trip?.destination}
        />
        
        
        {/* Hotel Detail Modal (for non-edit viewing) */}
        {hotelInfoForModal && (
          <HotelDetailModal
            hotel={hotelInfoForModal}
            isOpen={hotelModalOpen}
            onClose={() => setHotelModalOpen(false)}
            onChangeHotel={() => {
              setHotelModalOpen(false);
              setHotelSelectorOpen(true);
            }}
            nights={nights}
          />
        )}

        {/* Add Expense Modal */}
        <AddExpenseModal
          open={isAddExpenseOpen}
          onOpenChange={setIsAddExpenseOpen}
          onSave={(expenseData, submitNow) => {
            addExpense({ ...expenseData, tripId: trip?.id, tripName: trip?.destination });
            toast.success(submitNow ? "Expense submitted for approval" : "Expense added to trip");
            setIsAddExpenseOpen(false);
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
