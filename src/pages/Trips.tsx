import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { Plus, Calendar, Plane, MapPin, Trash2, Sparkles, DollarSign, ChevronDown, ChevronUp, Archive, RotateCcw, Check, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CalendarSyncDialog } from "@/components/calendar/CalendarSyncDialog";
import { CalendarEventsDisplay } from "@/components/calendar/CalendarEventsDisplay";
import { FlightSearchDialog, type FlightSelectionDraft } from "@/components/flights/FlightSearchDialog";
import { NewTripWizard, type NewTripWizardResult } from "@/components/trips/NewTripWizard";
import { TripCard, type Trip } from "@/components/trips/TripCard";
import { TripEditDrawer } from "@/components/trips/TripEditDrawer";
import { TripConfirmationModal } from "@/components/trips/TripConfirmationModal";
import { UndoConfirmationToast, useUndoConfirmation } from "@/components/trips/UndoConfirmationToast";
import { ManagerApprovalPanel } from "@/components/trips/ManagerApprovalPanel";
import { toast } from "sonner";
import { TripCalendarView } from "@/components/trips/TripCalendarView";
import { 
  fetchCalendarEvents, 
  isCalendarConnected, 
  getConnectedEmail, 
  disconnectCalendar,
  createCalendarEvent,
  type CalendarEvent 
} from "@/services/mockCalendarService";
import { cn } from "@/lib/utils";
import { useTrips, type LocalTrip } from "@/hooks/useTrips";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TripPlanningModal, type TripProposal } from "@/components/home/TripPlanningModal";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { usePreferences } from "@/hooks/usePreferences";
import { buildAutoDraftFromEvent } from "@/services/autoPlanService";

export default function Trips() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { demoMode } = useDemoMode();
  const { preferences } = usePreferences();
  const { 
    trips: localTrips, 
    createTrip, 
    updateTrip: updateLocalTrip, 
    confirmTrip: confirmLocalTrip,
    revertToDraft,
    approveTrip,
    rejectTrip,
    setCalendarEventId,
    setCalendarSyncError,
    cancelTrip: cancelLocalTrip, 
    deleteTrip: deleteLocalTrip,
    archiveTrip: archiveLocalTrip,
    unarchiveTrip: unarchiveLocalTrip
  } = useTrips();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(isCalendarConnected());
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<LocalTrip | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<LocalTrip | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [tripToArchive, setTripToArchive] = useState<LocalTrip | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [calendarViewOpen, setCalendarViewOpen] = useState(false);

  // Auto-open calendar view when navigated to /trips?view=calendar
  useEffect(() => {
    if (searchParams.get("view") === "calendar") {
      setCalendarViewOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  // Trip planning modal state
  const [planningModalOpen, setPlanningModalOpen] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  
  // Trip confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tripToConfirm, setTripToConfirm] = useState<LocalTrip | null>(null);
  const [pendingUndoTripId, setPendingUndoTripId] = useState<string | null>(null);

  // Undo confirmation hook
  const undoConfirmation = useUndoConfirmation({
    onUndo: () => {
      if (pendingUndoTripId) {
        revertToDraft(pendingUndoTripId);
        toast.success("Trip reverted to draft");
        setPendingUndoTripId(null);
      }
    },
    onTimeout: () => {
      setPendingUndoTripId(null);
    },
    duration: 10,
  });

  // Filter trips by status - cancelled trips are separate from upcoming
  // When demo mode is OFF, hide seeded demo trips (ids starting with "demo_")
  const visibleLocalTrips = useMemo(
    () => demoMode ? localTrips : localTrips.filter(t => !t.id.startsWith("demo_")),
    [localTrips, demoMode]
  );
  const draftTrips = visibleLocalTrips.filter(t => t.status === "draft");
  const confirmedTrips = visibleLocalTrips.filter(t => t.status === "confirmed");
  const cancelledTrips = visibleLocalTrips.filter(t => t.status === "cancelled");
  const archivedTrips = visibleLocalTrips.filter(t => t.status === "archived");

  // Backend trips - filter out cancelled ones from upcoming
  const upcomingBackendTrips = trips.filter(t => t.status !== "cancelled" && t.status !== "archived");
  const cancelledBackendTrips = trips.filter(t => t.status === "cancelled");

  // Merge local + backend trips for the calendar view
  const allCalendarTrips = useMemo(() => {
    const localIds = new Set(localTrips.map(t => t.id));
    const backendAsLocal: import("@/hooks/useTrips").LocalTrip[] = trips
      .filter(t => !localIds.has(t.id))
      .map(t => ({
        id: t.id,
        destination: t.destination,
        startDate: t.start_date,
        endDate: t.end_date,
        purpose: t.purpose || "",
        status: (t.status === "confirmed" || t.status === "draft" || t.status === "pending" || t.status === "cancelled" || t.status === "archived" ? t.status : "confirmed") as LocalTrip["status"],
        approvalStatus: "none" as const,
        calendarEventId: null,
        calendarSyncError: null,
        participants: [],
        chatId: null,
        flight: t.flight_details ? {
          airline: (t.flight_details as any)?.airline || "",
          departTime: (t.flight_details as any)?.departureTime || "",
          returnTime: (t.flight_details as any)?.arrivalTime || "",
        } : null,
        hotel: t.hotel_details ? {
          name: (t.hotel_details as any)?.name || "",
          location: (t.hotel_details as any)?.address || "",
        } : null,
        groundTransport: null,
        estimatedCost: t.total_estimated_cost || 0,
        confidenceLevel: 90,
        aiReasoning: {
          costEfficiency: { score: 85, label: "Good", detail: "" },
          timeEfficiency: { score: 85, label: "Good", detail: "" },
          policyCompliance: { score: 100, label: "Compliant", detail: "" },
          riskLevel: { score: 15, label: "Low", detail: "" },
          summary: "",
        },
        timeline: [],
        decisions: [],
        createdAt: t.start_date,
        updatedAt: t.start_date,
      }));
    return [...localTrips, ...backendAsLocal];
  }, [localTrips, trips]);

  // Handle calendar sync for an approved trip
  const handleCalendarSync = useCallback(async (tripId: string) => {
    const trip = localTrips.find(t => t.id === tripId);
    if (!trip) return;

    // Build calendar event details
    const title = `Business Trip — ${trip.destination}`;
    const location = trip.hotel?.location || trip.destination;
    let description = trip.purpose || "";
    if (trip.flight) {
      description += `\n\nFlight: ${trip.flight.airline} - Depart ${trip.flight.departTime}`;
    }
    if (trip.hotel) {
      description += `\nHotel: ${trip.hotel.name}`;
    }

    const result = await createCalendarEvent(tripId, {
      title,
      location,
      startDate: trip.startDate,
      endDate: trip.endDate,
      description: description || null,
    });

    if (result.success) {
      setCalendarEventId(tripId, result.eventId);
      toast.success("Trip added to calendar");
    } else {
      setCalendarSyncError(tripId, result.error || "Failed to sync");
      toast.error(result.error || "Failed to sync with calendar");
    }
  }, [localTrips, setCalendarEventId, setCalendarSyncError]);

  // Handle manager approval with calendar sync
  const handleApproveTrip = useCallback(async (tripId: string) => {
    approveTrip(tripId);
    toast.success("Trip approved!");
    
    // Automatically sync to calendar after approval
    if (isCalendarConnected()) {
      await handleCalendarSync(tripId);
    }
  }, [approveTrip, handleCalendarSync]);

  const handleRejectTrip = useCallback((tripId: string) => {
    rejectTrip(tripId);
    toast.info("Trip rejected");
  }, [rejectTrip]);

  // Handle draft trip confirmation
  const handleOpenConfirmModal = (trip: LocalTrip) => {
    setTripToConfirm(trip);
    setConfirmModalOpen(true);
  };

  const handleConfirmDraftTrip = (tripId: string) => {
    confirmLocalTrip(tripId);
    const trip = localTrips.find(t => t.id === tripId);
    setPendingUndoTripId(tripId);
    undoConfirmation.show(trip?.destination || "Trip");
  };

  const handleNewTrip = () => {
    setBookingDialogOpen(true);
  };

  const handleCalendarConnected = async () => {
    toast.success("Calendar synced! Detecting travel-related meetings...");
    setCalendarConnected(true);
    try {
      const events = await fetchCalendarEvents();
      setCalendarEvents(events);
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectCalendar();
    setCalendarConnected(false);
    setCalendarEvents([]);
    toast.success("Calendar disconnected");
  };

  // Map calendar event id -> existing draft trip (auto-generated or otherwise)
  const draftsByEventId = useMemo(() => {
    const map: Record<string, LocalTrip> = {};
    for (const t of localTrips) {
      if (t.sourceCalendarEventId) map[t.sourceCalendarEventId] = t;
    }
    return map;
  }, [localTrips]);

  const handleCreateTrip = (event: CalendarEvent) => {
    // If we already auto-generated a draft for this event, open it for review.
    const existing = draftsByEventId[event.id];
    if (existing) {
      if (existing.status !== "draft") {
        navigate(`/trips/${existing.id}`);
        return;
      }
      setSelectedDraft(existing);
      setDetailPanelOpen(true);
      return;
    }
    // Fallback: generate on demand, then open it.
    try {
      const draft = buildAutoDraftFromEvent(event, preferences);
      const newTrip = createTrip({
        destination: draft.destination,
        startDate: draft.startDate,
        endDate: draft.endDate,
        purpose: draft.purpose,
        flight: draft.flight,
        hotel: draft.hotel,
        groundTransport: null,
        estimatedCost: draft.estimatedCost,
        confidenceLevel: 88,
        sourceCalendarEventId: draft.sourceCalendarEventId,
        sourceCalendarEventTitle: draft.sourceCalendarEventTitle,
        rationale: draft.rationale,
        autoGenerated: true,
      });
      setSelectedDraft(newTrip);
      setDetailPanelOpen(true);
    } catch (e) {
      console.error("Auto-plan failed:", e);
      toast.error("Couldn't auto-generate a draft for this event");
    }
  };



  const handleConfirmTrip = (tripData: TripProposal) => {
    // Parse dates from the proposal
    const [startDateStr, endDateStr] = tripData.dates.split(" - ");
    const startDate = new Date(startDateStr).toISOString();
    const endDate = new Date(endDateStr).toISOString();

    // Create the trip with confirmed status
    const newTrip = createTrip({
      destination: tripData.destination,
      startDate,
      endDate,
      purpose: tripData.purpose,
      flight: {
        airline: tripData.flight.airline,
        departTime: tripData.flight.departTime,
        returnTime: tripData.flight.returnDepartTime,
      },
      hotel: {
        name: tripData.hotel.name,
        location: tripData.hotel.area,
      },
      groundTransport: null,
      estimatedCost: tripData.estimatedCost,
      confidenceLevel: 92,
    });

    // Immediately confirm the trip
    confirmLocalTrip(newTrip.id);
    toast.success("Trip confirmed!");
  };

  const handleSaveDraft = (tripData: TripProposal) => {
    // Parse dates from the proposal
    const [startDateStr, endDateStr] = tripData.dates.split(" - ");
    const startDate = new Date(startDateStr).toISOString();
    const endDate = new Date(endDateStr).toISOString();

    // Create the trip as draft
    createTrip({
      destination: tripData.destination,
      startDate,
      endDate,
      purpose: tripData.purpose,
      flight: {
        airline: tripData.flight.airline,
        departTime: tripData.flight.departTime,
        returnTime: tripData.flight.returnDepartTime,
      },
      hotel: {
        name: tripData.hotel.name,
        location: tripData.hotel.area,
      },
      groundTransport: null,
      estimatedCost: tripData.estimatedCost,
      confidenceLevel: 87,
    });

    toast.success("Trip saved as draft");
  };

  const fetchTrips = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("start_date", { ascending: false });

    if (!error && data) {
      setTrips(data as Trip[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const handleWizardComplete = async ({ flight: selection, hotel }: NewTripWizardResult) => {
    const hotelCost = hotel?.totalPrice ?? 0;
    const newTrip = createTrip({
      destination: selection.destination,
      startDate: selection.departureDate,
      endDate: selection.returnDate,
      purpose: `${selection.flight.airline} ${selection.flight.flightNumber}`,
      flight: {
        airline: selection.flight.airline,
        departTime: selection.flight.departureTime,
        returnTime: selection.flight.arrivalTime,
        flightNumber: selection.flight.flightNumber,
        departureAirport: selection.flight.origin,
        arrivalAirport: selection.flight.destination,
        arrivalTime: selection.flight.arrivalTime,
        duration: selection.flight.duration,
        stops: selection.flight.stops,
        cabinClass: selection.flight.cabinClass,
        price: selection.flight.price,
        emissions: selection.flight.co2Emissions,
      },
      hotel: hotel ? { name: hotel.name, location: hotel.destination } : null,
      groundTransport: null,
      estimatedCost: selection.flight.price + hotelCost,
      confidenceLevel: 84,
    });

    confirmLocalTrip(newTrip.id);
    setSelectedDraft(newTrip);
    toast.success("Trip created — pending approval");

    // Auto-sync booked trip to connected calendar
    if (isCalendarConnected()) {
      const title = `Business Trip — ${selection.destination}`;
      const location = hotel?.destination || selection.destination;
      const descriptionParts = [
        `Flight: ${selection.flight.airline} ${selection.flight.flightNumber} — Depart ${selection.flight.departureTime}`,
      ];
      if (hotel) descriptionParts.push(`Hotel: ${hotel.name}`);

      const result = await createCalendarEvent(newTrip.id, {
        title,
        location,
        startDate: selection.departureDate,
        endDate: selection.returnDate,
        description: descriptionParts.join("\n"),
      });

      if (result.success) {
        setCalendarEventId(newTrip.id, result.eventId);
        toast.success("Trip added to your calendar");
        // Refresh calendar events list so it appears in the synced events display
        try {
          const events = await fetchCalendarEvents();
          setCalendarEvents(events);
        } catch (e) {
          // non-fatal
        }
      } else if (result.error) {
        setCalendarSyncError(newTrip.id, result.error);
      }
    }
  };

  const handleTripClick = (trip: Trip) => {
    navigate(`/trips/${trip.id}`);
  };

  const handleConfirmTripFromPanel = async (tripId: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ status: "confirmed" })
      .eq("id", tripId);

    if (error) {
      toast.error("Failed to confirm trip");
      return;
    }

    toast.success("Trip confirmed!");
    fetchTrips();
    setDetailPanelOpen(false);
  };

  const handleCancelTrip = async (tripId: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ status: "cancelled" })
      .eq("id", tripId);

    if (error) {
      toast.error("Failed to cancel trip");
      return;
    }

    toast.success("Trip cancelled");
    fetchTrips();
    setDetailPanelOpen(false);
  };

  const handleDeleteClick = (trip: LocalTrip, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTripToDelete(trip);
    setDeleteConfirmOpen(true);
  };

  const handleArchiveClick = (trip: LocalTrip, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTripToArchive(trip);
    setArchiveConfirmOpen(true);
  };

  const handleConfirmArchive = () => {
    if (tripToArchive) {
      archiveLocalTrip(tripToArchive.id);
      toast.success("Trip archived");
      setArchiveConfirmOpen(false);
      setTripToArchive(null);
    }
  };

  const handleUnarchive = (trip: LocalTrip, e?: React.MouseEvent) => {
    e?.stopPropagation();
    unarchiveLocalTrip(trip.id);
    toast.success("Trip restored to cancelled");
  };

  // Discard a draft — no confirmation, no booking, no charge.
  const handleDiscardDraft = (draft: LocalTrip, e?: React.MouseEvent) => {
    e?.stopPropagation();
    deleteLocalTrip(draft.id);
    if (selectedDraft?.id === draft.id) setSelectedDraft(null);
    toast.success("Draft discarded");
  };


  const handleConfirmDelete = () => {
    if (tripToDelete) {
      deleteLocalTrip(tripToDelete.id);
      toast.success("Trip deleted");
      setDeleteConfirmOpen(false);
      setTripToDelete(null);
      setSelectedDraft(null);
    }
  };

  useEffect(() => {
    async function restoreCalendarEvents() {
      if (isCalendarConnected()) {
        setCalendarConnected(true);
        try {
          const events = await fetchCalendarEvents();
          setCalendarEvents(events);
        } catch (error) {
          console.error("Failed to restore calendar events:", error);
        }
      }
    }
    restoreCalendarEvents();
  }, []);

  // Auto-generate a draft itinerary for every synced calendar event that
  // doesn't already have one. No user input required — drafts are saved with
  // status "draft" so the user can review (not booked, no charge).
  useEffect(() => {
    if (!calendarEvents.length) return;
    const existingEventIds = new Set(
      localTrips.map(t => t.sourceCalendarEventId).filter(Boolean) as string[]
    );
    for (const event of calendarEvents) {
      if (existingEventIds.has(event.id)) continue;
      try {
        const draft = buildAutoDraftFromEvent(event, preferences);
        createTrip({
          destination: draft.destination,
          startDate: draft.startDate,
          endDate: draft.endDate,
          purpose: draft.purpose,
          flight: draft.flight,
          hotel: draft.hotel,
          groundTransport: null,
          estimatedCost: draft.estimatedCost,
          confidenceLevel: 88,
          sourceCalendarEventId: draft.sourceCalendarEventId,
          sourceCalendarEventTitle: draft.sourceCalendarEventTitle,
          rationale: draft.rationale,
          autoGenerated: true,
        });
      } catch (e) {
        console.error("Auto-plan failed for event", event.id, e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderTripCard = (trip: LocalTrip, index: number, showArchiveAction = false, showUnarchiveAction = false, showConfirmAction = false) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
      confirmed: { label: "Confirmed", className: "bg-success/10 text-success border-success/20" },
      cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
      pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
      archived: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
    };
    
    const approvalConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      pending: { label: "Pending approval", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
      approved: { label: "Approved", className: "bg-success/10 text-success border-success/20", icon: Check },
      rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20", icon: Clock },
    };
    
    const status = statusConfig[trip.status] || statusConfig.draft;
    const approval = trip.approvalStatus !== "none" ? approvalConfig[trip.approvalStatus] : null;
    const isDraft = trip.status === "draft";
    const isCancelled = trip.status === "cancelled";
    const isArchived = trip.status === "archived";
    const isConfirmed = trip.status === "confirmed";

    return (
      <Card 
        key={trip.id}
        className={cn(
          "transition-all duration-200 cursor-pointer",
          isDraft && "border-dashed border-2 border-border/60 bg-muted/10 hover:border-primary/30 hover:bg-muted/20",
          isCancelled && "opacity-70 bg-muted/5",
          isArchived && "opacity-50 bg-muted/5",
          !isDraft && !isCancelled && !isArchived && "hover:shadow-md hover:border-primary/20",
          "animate-slide-up"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => {
          navigate(`/trips/${trip.id}`);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", status.className)}>
                  {status.label}
                </Badge>
                {/* Approval status badge for confirmed trips */}
                {isConfirmed && approval && (
                  <Badge variant="outline" className={cn("text-xs gap-1", approval.className)}>
                    {approval.label === "Pending approval" && <Clock className="w-3 h-3" />}
                    {approval.label === "Approved" && <Check className="w-3 h-3" />}
                    {approval.label}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(trip.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary/70" />
                <h3 className="font-medium text-foreground">
                  {trip.destination}
                </h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d")}</span>
                {trip.purpose && <span>• {trip.purpose}</span>}
              </div>
              {trip.flight && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md w-fit">
                  <Plane className="w-3.5 h-3.5" />
                  <span>{trip.flight.airline}</span>
                </div>
              )}
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Est. cost</p>
                <p className="font-medium text-foreground">
                  ${trip.estimatedCost.toLocaleString()}
                </p>
              </div>
              {/* Confirm button for drafts */}
              {showConfirmAction && isDraft && (
                <Button 
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenConfirmModal(trip);
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirm
                </Button>
              )}
              {showArchiveAction && (
                <Button 
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                  onClick={(e) => handleArchiveClick(trip, e)}
                  title="Archive this trip"
                >
                  <Archive className="w-4 h-4" />
                </Button>
              )}
              {showUnarchiveAction && (
                <Button 
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                  onClick={(e) => handleUnarchive(trip, e)}
                  title="Restore this trip"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={(e) => handleDeleteClick(trip, e)}
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Trips</h1>
          <p className="text-muted-foreground">Manage your business travel</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCalendarViewOpen(true)}
            className="transition-smooth hover:border-primary/30"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCalendarDialogOpen(true)}
            className="transition-smooth hover:border-primary/30"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Sync Calendar
          </Button>
          <Button 
            onClick={handleNewTrip}
            className="hover:opacity-90 text-white font-medium transition-smooth"
            style={{ backgroundColor: '#9aafe6' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <CalendarSyncDialog 
        open={calendarDialogOpen} 
        onOpenChange={setCalendarDialogOpen}
        onConnected={handleCalendarConnected}
      />

      <NewTripWizard
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onComplete={handleWizardComplete}
      />

      <TripEditDrawer
        trip={selectedTrip}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
        onConfirm={handleConfirmTripFromPanel}
        onCancel={handleCancelTrip}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this trip?</DialogTitle>
            <DialogDescription>
              This will cancel your booking and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Remove trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary" />
              Remove this canceled trip from your list?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will archive the trip to <span className="font-medium text-foreground">{tripToArchive?.destination}</span>.
              <br />
              <span className="text-muted-foreground mt-2 block">
                This will not affect expense records or audit history.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setArchiveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmArchive} className="bg-primary hover:bg-primary/90">
              <Archive className="w-4 h-4 mr-2" />
              Remove trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TripPlanningModal
        open={planningModalOpen}
        onOpenChange={setPlanningModalOpen}
        event={selectedCalendarEvent}
        onConfirm={handleConfirmTrip}
        onSaveDraft={handleSaveDraft}
      />
      
      {/* Trip Confirmation Modal */}
      <TripConfirmationModal
        trip={tripToConfirm}
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        onConfirm={handleConfirmDraftTrip}
      />

      {/* Trip Calendar View - merge local + backend trips */}
      <TripCalendarView
        open={calendarViewOpen}
        onClose={() => setCalendarViewOpen(false)}
        trips={allCalendarTrips}
        onConfirmTrip={(tripId) => {
          confirmLocalTrip(tripId);
          const trip = localTrips.find(t => t.id === tripId);
          setPendingUndoTripId(tripId);
          undoConfirmation.show(trip?.destination || "Trip");
          toast.success("Flight confirmed!");
        }}
      />

      {/* Manager Approval Panel (for demo) */}
      <ManagerApprovalPanel
        trips={localTrips}
        onApprove={handleApproveTrip}
        onReject={handleRejectTrip}
        onCalendarSync={handleCalendarSync}
      />

      {/* Calendar Events */}
      {calendarConnected && calendarEvents.length > 0 && (
        <CalendarEventsDisplay 
          events={calendarEvents}
          connectedEmail={getConnectedEmail()}
          onDisconnect={handleDisconnect}
          onCreateTrip={handleCreateTrip}
          onViewTrip={(tripId) => navigate(`/trips/${tripId}`)}
          draftsByEventId={Object.fromEntries(
            Object.entries(draftsByEventId).map(([k, v]) => [k, {
              id: v.id,
              estimatedCost: v.estimatedCost,
              status: v.status,
              approvalStatus: v.approvalStatus,
            }])
          )}
        />

      )}

      {/* Confirmed/Upcoming Trips Section - excludes cancelled and archived */}
      {(upcomingBackendTrips.length > 0 || confirmedTrips.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Trips</h2>
            <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
              {upcomingBackendTrips.length + confirmedTrips.length}
            </Badge>
          </div>
          <div className="grid gap-4">
            {/* Backend trips (non-cancelled) */}
            {upcomingBackendTrips.map((trip, index) => (
              <div 
                key={trip.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TripCard 
                  trip={trip} 
                  onClick={() => handleTripClick(trip)} 
                  onDelete={(tripId) => handleDeleteClick(trips.find(t => t.id === tripId) as unknown as LocalTrip)}
                />
              </div>
            ))}
            {/* Local confirmed trips */}
            {confirmedTrips.map((trip, index) => renderTripCard(trip, index))}
          </div>
        </div>
      )}

      {/* Empty state when no active trips at all */}
      {upcomingBackendTrips.length === 0 && confirmedTrips.length === 0 && draftTrips.length === 0 && cancelledTrips.length === 0 && (
        <Card className="border-dashed border-2 border-border/50 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Plane className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="text-foreground font-medium">No trips yet.</p>
              <p className="text-muted-foreground text-sm">
                Connect your calendar to let Flyby detect upcoming travel, or plan one manually.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => setCalendarDialogOpen(true)}
                className="hover:opacity-90 text-white font-medium"
                style={{ backgroundColor: '#9aafe6' }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
              <Button variant="outline" onClick={handleNewTrip}>
                <Plus className="w-4 h-4 mr-2" />
                Plan manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drafts Section */}
      {draftTrips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Drafts</h2>
            <Badge variant="outline" className="text-xs">
              {draftTrips.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Auto-generated itineraries from your calendar — review, then Confirm &amp; Book or Discard.
          </p>
          <div className="grid gap-3">
            {draftTrips.map((draft, index) => (
              <Card
                key={draft.id}
                className="border-dashed border-2 border-border/60 bg-muted/10 hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedDraft(draft)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary gap-1">
                          <Sparkles className="w-3 h-3" />
                          Draft
                        </Badge>
                        {draft.sourceCalendarEventTitle && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Calendar className="w-3 h-3" />
                            From: {draft.sourceCalendarEventTitle}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/70" />
                        <h3 className="font-medium text-foreground">{draft.destination}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(draft.startDate), "MMM d")} – {format(new Date(draft.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {draft.flight && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <Plane className="w-3.5 h-3.5" />
                            <span>{draft.flight.airline}</span>
                          </div>
                        )}
                        {draft.hotel && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{draft.hotel.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Est. cost</p>
                        <p className="font-medium text-foreground">
                          ${draft.estimatedCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDiscardDraft(draft, e)}
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenConfirmModal(draft);
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm &amp; Book
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}


      {/* Cancelled Trips Section - with archive action */}
      {(cancelledTrips.length > 0 || cancelledBackendTrips.length > 0) && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCancelled ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <h2 className="text-sm font-medium">
              Cancelled Trips ({cancelledTrips.length + cancelledBackendTrips.length})
            </h2>
          </button>
          {showCancelled && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Cancelled trips can be archived to remove them from this list. This won't affect expense records or history.
              </p>
              <div className="grid gap-3">
                {cancelledTrips.map((trip, index) => renderTripCard(trip, index, true, false))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Archived Trips Section */}
      {archivedTrips.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <Archive className="w-4 h-4" />
            <h2 className="text-sm font-medium">Archived Trips ({archivedTrips.length})</h2>
          </button>
          {showArchived && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Archived trips are hidden from your main view. You can restore them if needed.
              </p>
              <div className="grid gap-3">
                {archivedTrips.map((trip, index) => renderTripCard(trip, index, false, true))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Draft Trip Detail Modal */}
      {selectedDraft && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedDraft(null)}
        >
          <Card 
            className="w-full max-w-lg bg-card border shadow-xl animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Draft Trip</CardTitle>
                </div>
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  {selectedDraft.confidenceLevel}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <p className="text-xl font-semibold">{selectedDraft.destination}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedDraft.startDate), "MMM d")} – {format(new Date(selectedDraft.endDate), "MMM d, yyyy")}
                </p>
                {selectedDraft.sourceCalendarEventTitle && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>From calendar event: <span className="text-foreground">{selectedDraft.sourceCalendarEventTitle}</span></span>
                  </div>
                )}
              </div>

              {selectedDraft.flight && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Plane className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {selectedDraft.flight.airline}
                      {selectedDraft.flight.flightNumber && (
                        <span className="text-muted-foreground font-normal"> · {selectedDraft.flight.flightNumber}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Depart: {selectedDraft.flight.departTime}
                      {selectedDraft.flight.arrivalTime && ` → ${selectedDraft.flight.arrivalTime}`}
                      {selectedDraft.flight.returnTime && ` • Return: ${selectedDraft.flight.returnTime}`}
                    </p>
                    {(selectedDraft.flight.duration || typeof selectedDraft.flight.stops === "number") && (
                      <p className="text-xs text-muted-foreground">
                        {selectedDraft.flight.duration}
                        {typeof selectedDraft.flight.stops === "number" && (
                          <> · {selectedDraft.flight.stops === 0 ? "Nonstop" : `${selectedDraft.flight.stops} stop${selectedDraft.flight.stops > 1 ? "s" : ""}`}</>
                        )}
                      </p>
                    )}
                    {typeof selectedDraft.flight.price === "number" && (
                      <p className="text-xs font-medium text-foreground mt-1">${selectedDraft.flight.price.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedDraft.hotel && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{selectedDraft.hotel.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedDraft.hotel.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Estimated Total</span>
                </div>
                <span className="text-lg font-bold text-primary">${selectedDraft.estimatedCost.toLocaleString()}</span>
              </div>

              {selectedDraft.rationale && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Why I picked this
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedDraft.rationale}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const draft = selectedDraft;
                    setSelectedDraft(null);
                    handleOpenConfirmModal(draft);
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Confirm &amp; Book
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDiscardDraft(selectedDraft)}
                >
                  Discard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDraft(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>

          </Card>
        </div>
      )}

      {/* Undo Confirmation Toast */}
      <UndoConfirmationToast
        visible={undoConfirmation.visible}
        tripDestination={undoConfirmation.tripDestination}
        countdown={undoConfirmation.countdown}
        onUndo={undoConfirmation.handleUndo}
        onDismiss={undoConfirmation.handleDismiss}
      />
    </div>
  );
}
