import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Plane } from "lucide-react";
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

export default function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(isCalendarConnected());
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

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
        {trips.length === 0 ? (
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
    </div>
  );
}
