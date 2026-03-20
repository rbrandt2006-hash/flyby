import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ExternalLink, 
  Plane, 
  Building2,
   
  MapPin,
  Calendar,
  DollarSign,
  Check,
  Clock,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import type { LocalTrip } from "@/hooks/useTrips";

interface CalendarTripPreviewProps {
  trip: LocalTrip;
  position: { x: number; y: number };
  onClose: () => void;
  onViewTrip: () => void;
  onConfirmTrip?: (tripId: string) => void;
  hasConflict: boolean;
}

export function CalendarTripPreview({ 
  trip, 
  position, 
  onClose, 
  onViewTrip,
  hasConflict 
}: CalendarTripPreviewProps) {
  const startDate = parseISO(trip.startDate);
  const endDate = parseISO(trip.endDate);
  const nights = differenceInDays(endDate, startDate);
  const isPending = trip.approvalStatus === "pending";
  const isApproved = trip.approvalStatus === "approved";
  const hasSynced = !!trip.calendarEventId;

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 400),
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50"
      />

      {/* Preview card */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
        className="fixed z-50 w-80 bg-card rounded-xl border border-border shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <h3 className="font-semibold text-foreground truncate">{trip.destination}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{trip.purpose || "Business trip"}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasConflict && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="w-3 h-3" />
                Conflict
              </Badge>
            )}
            {isPending && (
              <Badge variant="outline" className="text-xs gap-1 bg-warning/10 text-warning border-warning/30">
                <Clock className="w-3 h-3" />
                Awaiting approval
              </Badge>
            )}
            {isApproved && (
              <Badge variant="outline" className="text-xs gap-1 bg-success/10 text-success border-success/30">
                <Check className="w-3 h-3" />
                Approved
              </Badge>
            )}
            {hasSynced && (
              <Badge variant="outline" className="text-xs gap-1">
                <Calendar className="w-3 h-3" />
                Synced
              </Badge>
            )}
          </div>
        </div>

        {/* Itinerary preview */}
        <div className="p-4 space-y-3">
          {/* Dates */}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>
              {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
            </span>
            <span className="text-muted-foreground">({nights} night{nights !== 1 ? 's' : ''})</span>
          </div>

          {/* Flight */}
          {trip.flight && (
            <div className="flex items-center gap-3 text-sm">
              <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{trip.flight.airline}</span>
              <span className="text-muted-foreground">{trip.flight.departTime}</span>
            </div>
          )}

          {/* Hotel */}
          {trip.hotel && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{trip.hotel.name}</span>
            </div>
          )}


          {/* Cost */}
          <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/40">
            <DollarSign className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold">${trip.estimatedCost.toLocaleString()}</span>
            <span className="text-muted-foreground">estimated</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-muted/30">
          <Button className="w-full" size="sm" onClick={onViewTrip}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Trip Details
          </Button>
        </div>
      </motion.div>
    </>
  );
}
