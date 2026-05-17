import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Building2, MapPin, Calendar, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
  purpose: string | null;
  total_estimated_cost: number | null;
  flight_details?: {
    airline?: string;
    flightNumber?: string;
    departure?: string;
    arrival?: string;
  } | null;
  hotel_details?: {
    name?: string;
    address?: string;
    checkIn?: string;
    checkOut?: string;
  } | null;
}

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onDelete?: (tripId: string) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
      };
    case "pending":
      return {
        label: "Upcoming",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
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

export function TripCard({ trip, onClick, onDelete }: TripCardProps) {
  const statusConfig = getStatusConfig(trip.status);
  const hasFlightDetails = trip.flight_details && Object.keys(trip.flight_details).length > 0;
  const hasHotelDetails = trip.hotel_details && Object.keys(trip.hotel_details).length > 0;
  const isCancelled = trip.status === "cancelled";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(trip.id);
    }
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer border border-border/50 bg-card relative",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-300 ease-out",
        isCancelled && "opacity-70"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Main info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header row */}
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium", statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary/70" />
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {trip.destination}
              </h3>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
              </span>
            </div>

            {/* Travel icons */}
            <div className="flex items-center gap-3 pt-1">
              {hasFlightDetails && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  <Plane className="w-3.5 h-3.5" />
                  <span>{trip.flight_details?.airline || "Flight"}</span>
                </div>
              )}
              {hasHotelDetails && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{trip.hotel_details?.name || "Hotel"}</span>
                </div>
              )}
              {!hasFlightDetails && !hasHotelDetails && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 bg-muted/30 px-2 py-1 rounded-md border border-dashed border-border">
                    <Plane className="w-3.5 h-3.5" />
                    <span>No flight</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 bg-muted/30 px-2 py-1 rounded-md border border-dashed border-border">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>No hotel</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side - Cost + Delete for cancelled */}
          <div className="flex items-start gap-3">
            {trip.total_estimated_cost && trip.total_estimated_cost > 0 && (
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Est. cost</p>
                <p className="font-semibold text-lg text-foreground">
                  ${trip.total_estimated_cost.toLocaleString()}
                </p>
              </div>
            )}
            
            {/* Delete button - only for cancelled trips */}
            {isCancelled && onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Delete trip"
                    onClick={handleDeleteClick}
                    className="p-2 rounded-full text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted active:bg-destructive/10 active:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete trip</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
