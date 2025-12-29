import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Plane, MapPin, Trash2, Sparkles, DollarSign } from "lucide-react";
import { CalendarSyncDialog } from "@/components/calendar/CalendarSyncDialog";
import { CalendarEventsDisplay } from "@/components/calendar/CalendarEventsDisplay";
import { FlightSearchDialog } from "@/components/flights/FlightSearchDialog";
import { TripCard, type Trip } from "@/components/trips/TripCard";
import { TripDetailPanel } from "@/components/trips/TripDetailPanel";
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

export default function Trips() {
  const { user } = useAuth();
  const { trips: localTrips, updateTrip: updateLocalTrip, confirmTrip: confirmLocalTrip, cancelTrip: cancelLocalTrip } = useTrips();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(isCalendarConnected());
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<LocalTrip | null>(null);

  // Filter draft trips from local storage
  const draftTrips = localTrips.filter(t => t.status === "draft");

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
    toast.info(`Creating trip for: ${event.title}`);
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
    setSelectedTrip(trip);
    setDetailPanelOpen(true);
  };

  const handleConfirmTrip = async (tripId: string) => {
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
            style={{ backgroundColor: '#a3c5e0' }}
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

      <TripDetailPanel
        trip={selectedTrip}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
        onConfirm={handleConfirmTrip}
        onCancel={handleCancelTrip}
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

      {/* Trips List */}
      <div className="space-y-4">
        {trips.length === 0 && draftTrips.length === 0 ? (
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
                className="mt-2 bg-gradient-accent hover:opacity-90 text-accent-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip, index) => (
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
          </div>
        )}
      </div>

      {/* Draft Trips Section */}
      {draftTrips.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Draft Trips</h2>
            <Badge variant="outline" className="text-xs">
              {draftTrips.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {draftTrips.map((draft, index) => (
              <Card 
                key={draft.id}
                className={cn(
                  "border-dashed border-2 border-border/60 bg-muted/10",
                  "hover:border-primary/30 hover:bg-muted/20",
                  "transition-all duration-200 cursor-pointer",
                  "animate-slide-up"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedDraft(draft)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                          Draft
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Saved {format(new Date(draft.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/70" />
                        <h3 className="font-medium text-foreground">
                          {draft.destination}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{format(new Date(draft.startDate), "MMM d")} – {format(new Date(draft.endDate), "MMM d")}</span>
                        {draft.purpose && <span>• {draft.purpose}</span>}
                      </div>
                      {draft.flight && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md w-fit">
                          <Plane className="w-3.5 h-3.5" />
                          <span>{draft.flight.airline}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Est. cost</p>
                      <p className="font-medium text-foreground">
                        ${draft.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                  onClick={() => {
                    cancelLocalTrip(selectedDraft.id);
                    setSelectedDraft(null);
                    toast.success("Draft deleted");
                  }}
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
