import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plane, Building2, Calendar, MapPin, DollarSign, Clock, Users, FileText, Receipt, ChevronRight, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips, type LocalTrip } from "@/hooks/useTrips";
import { CompanyPicker } from "@/components/trips/CompanyPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { HotelDetailModal, type HotelInfo } from "@/components/trips/HotelDetailModal";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { getHotelsForDestination } from "@/services/mockHotelService";
import { ItineraryEditor } from "@/components/itinerary/ItineraryEditor";
import { TripSlideEditor } from "@/components/trips/TripSlideEditor";
import { toast } from "sonner";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { useExpenses } from "@/hooks/useExpenses";
import type { HotelOption } from "@/components/chats/booking/types";

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
  clientCompanyId?: string | null;
  clientCompanyName?: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  confirmed: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
  archived: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
};

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
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hotel detail modal (for non-edit viewing)
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  // Hotel picker (for selecting/changing hotel)
  const [hotelPickerOpen, setHotelPickerOpen] = useState(false);

  const nights = useMemo(() => {
    if (!trip) return 2;
    return Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)));
  }, [trip]);

  // Generate hotel options based on destination
  const hotelOptions = useMemo(() => {
    if (!trip) return [];
    return getHotelsForDestination({ destination: trip.destination, nights });
  }, [trip?.destination, nights]);

  const handleSelectHotel = useCallback((hotel: HotelOption) => {
    if (!trip) return;
    const updatedHotel = {
      name: hotel.name,
      location: hotel.area,
      address: hotel.area,
      pricePerNight: hotel.pricePerNight,
      rating: hotel.rating,
      amenities: hotel.amenities,
      images: hotel.images,
      description: hotel.description,
      reviewCount: hotel.reviewCount,
    };
    setTrip({ ...trip, hotel: updatedHotel, estimatedCost: trip.estimatedCost + hotel.totalPrice });
    // Sync to localStorage
    if (localTrips.find(t => t.id === trip.id)) {
      updateTrip(trip.id, {
        hotel: { name: hotel.name, location: hotel.area },
      });
    }
    setHotelPickerOpen(false);
    toast.success(`${hotel.name} added to your trip`);
  }, [trip, localTrips, updateTrip]);

  const handleSelectCompany = useCallback((company: import("@/hooks/useCompanies").ClientCompany | null) => {
    if (!trip) return;
    setTrip({ ...trip, clientCompanyId: company?.id ?? null, clientCompanyName: company?.name ?? null });
    if (localTrips.find(t => t.id === trip.id)) {
      updateTrip(trip.id, {
        clientCompanyId: company?.id ?? null,
        clientCompanyName: company?.name ?? null,
      });
    }
    toast.success(company ? `Linked to ${company.name}` : "Client link removed");
  }, [trip, localTrips, updateTrip]);

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
      flight: { airline: "United Airlines", flightNumber: "UA 1234", departTime: "7:00 AM", returnTime: "6:30 PM", price: 450 },
      hotel: {
        name: "The Westin St. Francis", location: "Union Square", address: "335 Powell St, San Francisco, CA 94102",
        pricePerNight: 289, rating: 4.5,
        amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Bar", "Room Service"],
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop",
        ],
        description: "Experience luxury in the heart of San Francisco.",
        reviewCount: 2847,
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
      flight: { airline: "Alaska Airlines", flightNumber: "AS 567", departTime: "8:30 AM", returnTime: "5:00 PM", price: 380 },
      hotel: {
        name: "The Fairmont Olympic", location: "Downtown Seattle", address: "411 University St, Seattle, WA 98101",
        pricePerNight: 349, rating: 4.7,
        amenities: ["Free Wi-Fi", "Pool", "Spa", "Gym", "Restaurant"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
        ],
        description: "A historic landmark in downtown Seattle.",
        reviewCount: 1923,
      },
    },
    "demo_trip_chi_2025": {
      id: "demo_trip_chi_2025",
      destination: "Chicago, IL",
      startDate: "2025-01-20T00:00:00.000Z",
      endDate: "2025-01-23T00:00:00.000Z",
      status: "confirmed",
      purpose: "Partner summit",
      estimatedCost: 1650,
      flight: { airline: "American Airlines", flightNumber: "AA 892", departTime: "6:45 AM", returnTime: "7:15 PM", price: 380 },
      hotel: {
        name: "The Palmer House Hilton", location: "The Loop", address: "17 E Monroe St, Chicago, IL 60603",
        pricePerNight: 259, rating: 4.4,
        amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant", "Bar"],
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop",
        ],
        description: "Historic luxury in the heart of Chicago's Loop.",
        reviewCount: 3421,
      },
    },
    "demo_trip_nyc_2025": {
      id: "demo_trip_nyc_2025",
      destination: "New York, NY",
      startDate: "2025-01-12T00:00:00.000Z",
      endDate: "2025-01-14T00:00:00.000Z",
      status: "confirmed",
      purpose: "Client presentation",
      estimatedCost: 2400,
      flight: { airline: "Delta Air Lines", flightNumber: "DL 402", departTime: "9:00 AM", returnTime: "5:30 PM", price: 520 },
      hotel: {
        name: "The Westin New York Grand Central", location: "Midtown East", address: "212 E 42nd St, New York, NY 10017",
        pricePerNight: 329, rating: 4.3,
        amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Room Service", "Business Center"],
        images: [
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop",
        ],
        description: "Steps from Grand Central in the heart of Manhattan.",
        reviewCount: 2156,
      },
    },
  };

  // Load trip data
  useEffect(() => {
    const loadTrip = async () => {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 300));

      const localTrip = localTrips.find(t => t.id === tripId);
      if (localTrip) {
        setTrip({
          id: localTrip.id, destination: localTrip.destination,
          startDate: localTrip.startDate, endDate: localTrip.endDate,
          status: localTrip.status, purpose: localTrip.purpose,
          estimatedCost: localTrip.estimatedCost,
          flight: localTrip.flight ? { ...localTrip.flight } : undefined,
          hotel: localTrip.hotel ? { ...localTrip.hotel } : undefined,
          clientCompanyId: localTrip.clientCompanyId ?? null,
          clientCompanyName: localTrip.clientCompanyName ?? null,
        });
        setIsLoading(false);
        return;
      }

      if (tripId && demoTrips[tripId]) {
        setTrip(demoTrips[tripId]);
        setIsLoading(false);
        return;
      }

      if (user && tripId) {
        const { data, error } = await supabase
          .from("trips").select("*").eq("id", tripId).single();
        if (!error && data) {
          setTrip({
            id: data.id, destination: data.destination,
            startDate: data.start_date, endDate: data.end_date,
            status: data.status, purpose: data.purpose || undefined,
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

  const handleBack = () => navigate(-1);

  // Save from slide editor
  const handleEditorSave = useCallback(async (editorData: {
    destination: string; purpose: string; startDate: string; endDate: string;
    estimatedCost: number;
    flight?: { airline?: string; flightNumber?: string; departTime?: string; returnTime?: string; price?: number } | null;
    hotel?: { name?: string; location?: string; address?: string; pricePerNight?: number; rating?: number } | null;
  }) => {
    if (!trip) return;
    setIsSaving(true);
    try {
      const updatedTrip: TripData = {
        ...trip,
        destination: editorData.destination,
        purpose: editorData.purpose,
        startDate: editorData.startDate,
        endDate: editorData.endDate,
        estimatedCost: editorData.estimatedCost,
        flight: editorData.flight ? { ...trip.flight, ...editorData.flight } : trip.flight,
        hotel: editorData.hotel ? { ...trip.hotel, ...editorData.hotel } : trip.hotel,
      };

      // Update local state immediately (live preview)
      setTrip(updatedTrip);

      // Sync to useTrips (localStorage) for calendar/homepage/trips page
      if (localTrips.find(t => t.id === trip.id)) {
        updateTrip(trip.id, {
          destination: editorData.destination,
          purpose: editorData.purpose,
          startDate: editorData.startDate,
          endDate: editorData.endDate,
          estimatedCost: editorData.estimatedCost,
          flight: editorData.flight ? {
            airline: editorData.flight.airline || "",
            departTime: editorData.flight.departTime || "",
            returnTime: editorData.flight.returnTime || "",
          } : null,
          hotel: editorData.hotel ? {
            name: editorData.hotel.name || "",
            location: editorData.hotel.location || "",
          } : null,
        });
      }

      toast.success("Trip updated successfully", {
        description: "Calendar and trip pages have been synced.",
        action: {
          label: "View Calendar",
          onClick: () => navigate("/trips"),
        },
      });
      setEditorOpen(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [trip, localTrips, updateTrip, navigate]);

  // Convert trip hotel to HotelInfo for modal
  const hotelInfoForModal: HotelInfo | null = useMemo(() => {
    if (!trip?.hotel) return null;
    return {
      name: trip.hotel.name || "Hotel",
      location: trip.hotel.location, address: trip.hotel.address,
      rating: trip.hotel.rating, pricePerNight: trip.hotel.pricePerNight,
      amenities: trip.hotel.amenities, images: trip.hotel.images,
      description: trip.hotel.description, reviewCount: trip.hotel.reviewCount,
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
          className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border"
        >
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full hover:bg-muted">
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
                    <Badge variant="outline" className={cn("text-xs", status.className)}>{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Edit button */}
            {trip && trip.status !== "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditorOpen(true)}
                className="gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Trip
              </Button>
            )}
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
                    {/* Trip Summary */}
                    <Card className="border border-border/50">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{trip.destination}</p>
                            {trip.purpose && <p className="text-sm text-muted-foreground">{trip.purpose}</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Estimated Cost</span>
                          </div>
                          <span className="text-xl font-bold text-foreground">${trip.estimatedCost.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Client / Company Card */}
                    <Card className="border border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <p className="font-medium text-foreground">Client / Company</p>
                              <p className="text-xs text-muted-foreground">
                                Tie this trip to a client account for reporting and sales visibility.
                              </p>
                            </div>
                            <CompanyPicker
                              value={trip.clientCompanyId ?? null}
                              onChange={handleSelectCompany}
                              placeholder="Link to a client/company"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dates Card */}
                    <Card
                      className="border border-border/50 group transition-all cursor-pointer hover:border-primary/30 hover:shadow-md"
                      onClick={() => setEditorOpen(true)}
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
                              <p className="text-xs text-muted-foreground mt-1">{nights} {nights === 1 ? "night" : "nights"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="text-xs">Edit</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Flight Card */}
                    <Card
                      className="border border-border/50 group transition-all cursor-pointer hover:border-primary/30 hover:shadow-md"
                      onClick={() => setEditorOpen(true)}
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
                                  <p className="font-medium text-foreground">{trip.flight.airline}</p>
                                  {trip.flight.flightNumber && (
                                    <p className="text-sm text-muted-foreground">Flight {trip.flight.flightNumber}</p>
                                  )}
                                  {trip.flight.departTime && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Depart: {trip.flight.departTime} • Return: {trip.flight.returnTime || "—"}
                                    </p>
                                  )}
                                  {trip.flight.price != null && (
                                    <p className="text-xs text-primary mt-1 font-medium">${trip.flight.price}</p>
                                  )}
                                </>
                              ) : (
                                <p className="font-medium text-muted-foreground">No flight selected</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="text-xs">Edit</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hotel Card */}
                    <Card
                      className="border border-border/50 group transition-all cursor-pointer hover:border-primary/30 hover:shadow-md"
                      onClick={() => {
                        if (trip.hotel?.name) {
                          setHotelModalOpen(true);
                        } else {
                          setHotelPickerOpen(true);
                        }
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
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
                                    <p className="font-medium text-foreground truncate">{trip.hotel.name}</p>
                                    {trip.hotel.location && <p className="text-sm text-muted-foreground truncate">{trip.hotel.location}</p>}
                                    {trip.hotel.rating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-amber-500">★</span>
                                        <span className="text-xs text-muted-foreground">{trip.hotel.rating.toFixed(1)}</span>
                                        {trip.hotel.pricePerNight && (
                                          <span className="text-xs text-primary ml-2 font-medium">${trip.hotel.pricePerNight}/night</span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="font-medium text-muted-foreground">No hotel selected</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={(e) => { e.stopPropagation(); setHotelPickerOpen(true); }}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add Hotel
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {trip.hotel?.name ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-xs h-auto py-1 px-2"
                                    onClick={(e) => { e.stopPropagation(); setHotelPickerOpen(true); }}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Change
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
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
                      isEditing={false}
                      onSave={() => {}}
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
                          <p className="text-sm text-muted-foreground mt-1">Expenses will appear here once the trip begins</p>
                          <Button variant="outline" className="mt-4" onClick={() => setIsAddExpenseOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Expense
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget Estimate</p>
                            <p className="text-2xl font-bold text-foreground">${trip.estimatedCost.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-2xl font-bold text-success">$0</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: "0%" }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">${trip.estimatedCost.toLocaleString()} remaining</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Trip not found</p>
              <Button variant="outline" onClick={handleBack} className="mt-4">Go Back</Button>
            </div>
          )}
        </main>

        {/* Slide-out Editor */}
        {trip && (
          <TripSlideEditor
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
            tripData={{
              destination: trip.destination,
              purpose: trip.purpose || "",
              startDate: trip.startDate,
              endDate: trip.endDate,
              estimatedCost: trip.estimatedCost,
              flight: trip.flight,
              hotel: trip.hotel,
            }}
            onSave={handleEditorSave}
            onChangeHotel={() => setHotelPickerOpen(true)}
            isSaving={isSaving}
          />
        )}

        {/* Hotel Detail Modal */}
        {hotelInfoForModal && (
          <HotelDetailModal
            hotel={hotelInfoForModal}
            isOpen={hotelModalOpen}
            onClose={() => setHotelModalOpen(false)}
            onChangeHotel={() => {
              setHotelModalOpen(false);
              setHotelPickerOpen(true);
            }}
            nights={nights}
          />
        )}

        {/* Hotel Picker (full-screen selection) */}
        <HotelSelectionPage
          open={hotelPickerOpen}
          onClose={() => setHotelPickerOpen(false)}
          hotels={hotelOptions}
          selectedHotel={null}
          onSelect={handleSelectHotel}
          nights={nights}
          venueName={trip?.destination || "destination"}
        />

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
