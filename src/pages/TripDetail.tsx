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
import { backend } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { HotelDetailModal, type HotelInfo } from "@/components/trips/HotelDetailModal";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { searchLiveHotels, hotelUnavailableMessage } from "@/services/duffelStays";
import { HotelBookingModal } from "@/components/booking/HotelBookingModal";
import { findAirports } from "@/data/globalAirports";
import { ItineraryEditor } from "@/components/itinerary/ItineraryEditor";
import { TripSlideEditor } from "@/components/trips/TripSlideEditor";
import { toast } from "sonner";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { useExpenses } from "@/hooks/useExpenses";
import { useTravelPolicy } from "@/hooks/useTravelPolicy";
import { PolicyBadge } from "@/components/trips/PolicyBadge";
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
    arrivalAirport?: string;
    arriveDayOffset?: number;
    /** The airline's confirmation code. Present only on a ticketed flight. */
    bookingReference?: string;
    tripType?: "one_way" | "round_trip";
    returnFlightNumber?: string;
    returnDepartTime?: string;
    returnArrivalTime?: string;
    returnArriveDayOffset?: number;
  };
  hotel?: {
    name?: string;
    location?: string;
    /** True only once the hotel has confirmed a reservation. */
    reserved?: boolean;
    bookingReference?: string | null;
    bookingId?: string;
    totalPrice?: number;
    nights?: number;
    currency?: string;
    dueAtAccommodation?: number;
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
  const { policy: travelPolicy } = useTravelPolicy();

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

  // Hotels for this trip come from the live supplier, searched when the picker
  // is opened. Choosing one opens a real reservation — it is added to the trip
  // only once the hotel confirms. (This used to list generated hotels and write
  // the chosen one onto the trip as if it had been booked.)
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [searchingHotels, setSearchingHotels] = useState(false);
  const [hotelToReserve, setHotelToReserve] = useState<HotelOption | null>(null);

  const openHotelPicker = useCallback(async () => {
    if (!trip || searchingHotels) return;
    if (trip.hotel?.reserved) {
      toast.info("This hotel is already reserved", {
        description: `${trip.hotel.bookingReference ? `Confirmation ${trip.hotel.bookingReference}. ` : ""}To change it, cancel the reservation with the hotel first — reserving another here would leave you with two.`,
      });
      return;
    }
    const destinationCode =
      (trip.flight?.arrivalAirport && /^[A-Z]{3}$/.test(trip.flight.arrivalAirport) ? trip.flight.arrivalAirport : null)
      ?? findAirports(trip.destination.split(",")[0].trim())[0]?.code;
    if (!destinationCode) {
      toast.error("We couldn't work out where to search for hotels for this trip.");
      return;
    }
    setSearchingHotels(true);
    const loading = toast.loading("Searching live hotels…");
    try {
      const outcome = await searchLiveHotels({
        destinationCode,
        destinationCity: trip.destination.split(",")[0].trim(),
        // Local calendar dates — slicing the ISO string would shift the day
        // for anyone east of UTC.
        checkIn: format(new Date(trip.startDate), "yyyy-MM-dd"),
        checkOut: format(new Date(trip.endDate), "yyyy-MM-dd"),
      });
      if (!outcome.hotels) {
        toast.error(hotelUnavailableMessage(outcome.reason));
        return;
      }
      setHotelOptions(outcome.hotels);
      setHotelPickerOpen(true);
    } finally {
      toast.dismiss(loading);
      setSearchingHotels(false);
    }
  }, [trip, searchingHotels]);

  const handleSelectHotel = useCallback((hotel: HotelOption) => {
    // Not added to the trip yet — that happens when the hotel confirms.
    setHotelPickerOpen(false);
    setHotelToReserve(hotel);
  }, []);

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

  // No sample trip details — a trip's details come from the real trip record.
  const demoTrips: Record<string, TripData> = {};

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
        const { data, error } = await backend
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
                    <PolicyBadge trip={trip as any} policy={travelPolicy} />
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
                                      Departs: {trip.flight.departTime} • Arrives: {trip.flight.returnTime || "—"}
                                      {trip.flight.arriveDayOffset ? ` (+${trip.flight.arriveDayOffset})` : ""}
                                    </p>
                                  )}
                                  {trip.flight.tripType === "round_trip" && trip.flight.returnDepartTime && (
                                    <p className="text-xs text-muted-foreground">
                                      Return{trip.flight.returnFlightNumber ? ` ${trip.flight.returnFlightNumber}` : ""}: {trip.flight.returnDepartTime} → {trip.flight.returnArrivalTime || "—"}
                                      {trip.flight.returnArriveDayOffset ? ` (+${trip.flight.returnArriveDayOffset})` : ""}
                                    </p>
                                  )}
                                  {trip.flight.tripType === "one_way" && (
                                    <p className="text-xs text-warning">One-way — no return flight on this ticket</p>
                                  )}
                                  {/* The airline's confirmation is what makes this a
                                      booking. Without one, nothing was ticketed. */}
                                  {trip.flight.bookingReference ? (
                                    <p className="text-xs text-success mt-1 font-medium">
                                      Ticketed · airline confirmation <span className="font-mono">{trip.flight.bookingReference}</span>
                                    </p>
                                  ) : trip.status !== "draft" ? (
                                    <p className="text-xs text-muted-foreground mt-1">No airline confirmation on record for this trip</p>
                                  ) : null}
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
                          void openHotelPicker();
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
                                    {trip.hotel.reserved ? (
                                      <p className="text-xs text-success mt-1 font-medium">
                                        Reserved{trip.hotel.bookingReference ? <> · confirmation <span className="font-mono">{trip.hotel.bookingReference}</span></> : null}
                                      </p>
                                    ) : trip.hotel.reserved === false ? (
                                      <p className="text-xs text-warning mt-1">Not reserved — chosen but not booked. Use Change to reserve a room.</p>
                                    ) : null}
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
                                      onClick={(e) => { e.stopPropagation(); void openHotelPicker(); }}
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
                                    onClick={(e) => { e.stopPropagation(); void openHotelPicker(); }}
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
            onChangeHotel={() => void openHotelPicker()}
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
              void openHotelPicker();
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

        {/* Reserve the chosen hotel for real */}
        <HotelBookingModal
          open={hotelToReserve !== null}
          hotel={hotelToReserve}
          onOpenChange={(open) => { if (!open) setHotelToReserve(null); }}
          onBooked={(result) => {
            if (!result.ok || !result.booking || !trip || !hotelToReserve) return;
            const reserved = result.booking;
            const hotel = {
              name: reserved.hotelName || hotelToReserve.name,
              location: hotelToReserve.area,
              pricePerNight: hotelToReserve.pricePerNight,
              totalPrice: reserved.totalPrice,
              nights,
              currency: reserved.currency,
              dueAtAccommodation: hotelToReserve.dueAtAccommodation,
              reserved: true,
              bookingReference: reserved.reference,
              bookingId: reserved.id,
            };
            setTrip({ ...trip, hotel: { ...hotel, images: hotelToReserve.images, rating: hotelToReserve.rating } });
            if (localTrips.find(t => t.id === trip.id)) updateTrip(trip.id, { hotel });
            try {
              addExpense({
                merchant: hotel.name,
                description: `${nights} night${nights > 1 ? "s" : ""} in ${trip.destination}`,
                date: trip.startDate,
                amount: reserved.totalPrice,
                category: "hotel",
                status: "pending",
                location: hotel.location || trip.destination,
                paymentMethod: "Booked in Flyby",
                reimbursable: true,
                tripId: trip.id,
                tripName: trip.destination,
              });
            } catch (expenseErr) {
              console.warn("Hotel expense import failed (non-fatal):", expenseErr);
            }
          }}
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
