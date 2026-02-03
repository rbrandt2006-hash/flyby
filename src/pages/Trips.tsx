import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Plane, MapPin, Trash2, Sparkles, DollarSign, ChevronDown, ChevronUp, Archive, RotateCcw } from "lucide-react";
import { CalendarSyncDialog } from "@/components/calendar/CalendarSyncDialog";
import { CalendarEventsDisplay } from "@/components/calendar/CalendarEventsDisplay";
import { FlightSearchDialog } from "@/components/flights/FlightSearchDialog";
import { TripCard, type Trip } from "@/components/trips/TripCard";
import { TripEditDrawer } from "@/components/trips/TripEditDrawer";
import { toast } from "sonner";
import { 
  fetchCalendarEvents, 
  isCalendarConnected, 
  getConnectedEmail, 
  disconnectCalendar,
  type CalendarEvent 
} from "@/services/mockCalendarService";
import { cn } from "@/lib/utils";
import { useTrips, type LocalTrip } from "@/hooks/useTrips";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TripPlanningModal, type TripProposal } from "@/components/home/TripPlanningModal";

export default function Trips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    trips: localTrips, 
    createTrip, 
    updateTrip: updateLocalTrip, 
    confirmTrip: confirmLocalTrip, 
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
  
  // Trip planning modal state
  const [planningModalOpen, setPlanningModalOpen] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);

  // Filter trips by status - cancelled trips are separate from upcoming
  const draftTrips = localTrips.filter(t => t.status === "draft");
  const confirmedTrips = localTrips.filter(t => t.status === "confirmed");
  const cancelledTrips = localTrips.filter(t => t.status === "cancelled");
  const archivedTrips = localTrips.filter(t => t.status === "archived");
  
  // Backend trips - filter out cancelled ones from upcoming
  const upcomingBackendTrips = trips.filter(t => t.status !== "cancelled" && t.status !== "archived");
  const cancelledBackendTrips = trips.filter(t => t.status === "cancelled");

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

  const handleCreateTrip = (event: CalendarEvent) => {
    setSelectedCalendarEvent(event);
    setPlanningModalOpen(true);
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
      groundTransport: tripData.ground.provider,
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
      groundTransport: tripData.ground.provider,
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

  const handleTripCreated = () => {
    fetchTrips();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderTripCard = (trip: LocalTrip, index: number, showArchiveAction = false, showUnarchiveAction = false) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
      confirmed: { label: "Confirmed", className: "bg-success/10 text-success border-success/20" },
      cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
      pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
      archived: { label: "Archived", className: "bg-muted/50 text-muted-foreground border-border/50" },
    };
    const status = statusConfig[trip.status] || statusConfig.draft;
    const isDraft = trip.status === "draft";
    const isCancelled = trip.status === "cancelled";
    const isArchived = trip.status === "archived";

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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", status.className)}>
                  {status.label}
                </Badge>
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

      <FlightSearchDialog 
        open={bookingDialogOpen} 
        onOpenChange={setBookingDialogOpen}
        onTripCreated={handleTripCreated}
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
            <DialogTitle>Delete this trip?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The trip to {tripToDelete?.destination} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
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

      {/* Calendar Events */}
      {calendarConnected && calendarEvents.length > 0 && (
        <CalendarEventsDisplay 
          events={calendarEvents}
          connectedEmail={getConnectedEmail()}
          onDisconnect={handleDisconnect}
          onCreateTrip={handleCreateTrip}
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
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Plane className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground font-medium">No trips planned yet</p>
              <p className="text-muted-foreground text-sm">
                Create your first trip to get started
              </p>
            </div>
            <Button 
              onClick={handleNewTrip}
              className="mt-2 hover:opacity-90 text-white font-medium"
              style={{ backgroundColor: '#9aafe6' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Trip
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Draft Trips Section */}
      {draftTrips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Draft Trips</h2>
            <Badge variant="outline" className="text-xs">
              {draftTrips.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {draftTrips.map((draft, index) => renderTripCard(draft, index))}
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
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xl font-semibold">{selectedDraft.destination}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedDraft.startDate), "MMM d")} – {format(new Date(selectedDraft.endDate), "MMM d, yyyy")}
                </p>
              </div>
              
              {selectedDraft.flight && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Plane className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{selectedDraft.flight.airline}</p>
                    <p className="text-xs text-muted-foreground">
                      Depart: {selectedDraft.flight.departTime} • Return: {selectedDraft.flight.returnTime}
                    </p>
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

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    confirmLocalTrip(selectedDraft.id);
                    setSelectedDraft(null);
                    toast.success("Trip confirmed!");
                  }}
                >
                  Confirm & Book
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedDraft(null)}
                >
                  Close
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(selectedDraft)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
