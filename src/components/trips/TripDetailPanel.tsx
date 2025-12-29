import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plane, 
  Building2, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Video,
  ChevronDown,
  History
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LocalRecommendations } from "./LocalRecommendations";
import { AIReasoningPanel } from "./AIReasoningPanel";
import { DecisionTimeline } from "./DecisionTimeline";
import type { Trip } from "./TripCard";
import type { TripTimelineEvent } from "@/hooks/useTrips";

interface TripDetailPanelProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tripId: string) => void;
  onCancel: (tripId: string) => void;
  timeline?: TripTimelineEvent[];
}

// Mock meetings data
const mockMeetings = [
  {
    id: "1",
    title: "Q4 Strategy Review",
    time: "10:00 AM",
    duration: "2 hours",
    attendees: 5,
    type: "in-person",
  },
  {
    id: "2",
    title: "Client Presentation",
    time: "2:00 PM",
    duration: "1.5 hours",
    attendees: 8,
    type: "in-person",
  },
  {
    id: "3",
    title: "Team Sync",
    time: "4:30 PM",
    duration: "30 min",
    attendees: 3,
    type: "video",
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      };
    case "pending":
      return {
        label: "Upcoming",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      };
    case "draft":
      return {
        label: "Draft",
        className: "bg-muted text-muted-foreground border-border",
      };
    case "cancelled":
      return {
        label: "Canceled",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

export function TripDetailPanel({ 
  trip, 
  open, 
  onOpenChange,
  onConfirm,
  onCancel,
  timeline = []
}: TripDetailPanelProps) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  
  if (!trip) return null;

  const statusConfig = getStatusConfig(trip.status);
  const isConfirmed = trip.status === "confirmed";
  const isCancelled = trip.status === "cancelled";

  // Generate mock timeline if none provided
  const now = new Date().toISOString();
  const displayTimeline = timeline.length > 0 ? timeline : [
    { id: "1", type: "created" as const, description: "Trip created", timestamp: now },
    { id: "2", type: "ai_recommendation" as const, description: "AI generated travel recommendations", timestamp: now },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs font-medium", statusConfig.className)}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-primary" />
            {trip.destination}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(trip.start_date), "MMMM d")} – {format(new Date(trip.end_date), "MMMM d, yyyy")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Flight Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-foreground">Flight</h4>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {trip.flight_details?.airline ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{trip.flight_details.airline}</span>
                    <span className="text-xs text-muted-foreground">{trip.flight_details.flightNumber || "AA 1234"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">SFO</p>
                      <p className="text-xs text-muted-foreground">8:00 AM</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 border-t border-dashed border-border" />
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 border-t border-dashed border-border" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{trip.destination.slice(0, 3).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">11:30 AM</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No flight booked yet
                </p>
              )}
            </div>
          </section>

          <Separator />

          {/* Hotel Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-foreground">Hotel</h4>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {trip.hotel_details?.name ? (
                <>
                  <p className="text-sm font-medium">{trip.hotel_details.name}</p>
                  {trip.hotel_details.address && (
                    <p className="text-xs text-muted-foreground">{trip.hotel_details.address}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>Check-in: 3:00 PM</span>
                    <span>Check-out: 11:00 AM</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No hotel booked yet
                </p>
              )}
            </div>
          </section>

          <Separator />

          {/* Meetings */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-foreground">Meetings</h4>
            </div>
            <div className="space-y-2">
              {mockMeetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className={cn(
                    "bg-muted/50 rounded-lg p-3",
                    "hover:bg-muted/70 transition-colors cursor-pointer"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        {meeting.title}
                        {meeting.type === "video" && (
                          <Video className="w-3.5 h-3.5 text-primary" />
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meeting.time}
                        </span>
                        <span>{meeting.duration}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.attendees}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Decision Timeline */}
          <section className="space-y-3">
            <button
              onClick={() => setIsTimelineOpen(!isTimelineOpen)}
              className="w-full flex items-center justify-between hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-foreground">Trip Timeline</h4>
              </div>
              <motion.div
                animate={{ rotate: isTimelineOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isTimelineOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <DecisionTimeline events={displayTimeline} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <Separator />

          {/* AI Reasoning Panel */}
          <AIReasoningPanel destination={trip.destination} />

          <Separator />

          {/* Local Recommendations */}
          <LocalRecommendations />

          {/* Action Buttons */}
          {!isCancelled && (
            <div className="flex gap-3 pt-4">
              {!isConfirmed && (
                <Button 
                  className="flex-1 bg-gradient-accent hover:opacity-90 text-accent-foreground font-medium"
                  onClick={() => onConfirm(trip.id)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Trip
                </Button>
              )}
              <Button 
                variant="outline"
                className={cn(
                  "flex-1 border-destructive/30 text-destructive",
                  "hover:bg-destructive/10 hover:border-destructive/50"
                )}
                onClick={() => onCancel(trip.id)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Trip
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
