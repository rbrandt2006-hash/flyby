import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Shield,
  Check,
  X,
  Clock,
  Calendar,
  Plane,
  Building2,
  DollarSign,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LocalTrip, ApprovalStatus } from "@/hooks/useTrips";
import { isCalendarConnected, createCalendarEvent } from "@/services/mockCalendarService";

interface ManagerApprovalPanelProps {
  trips: LocalTrip[];
  onApprove: (tripId: string) => void;
  onReject: (tripId: string, reason?: string) => void;
  onCalendarSync: (tripId: string) => Promise<void>;
}

export function ManagerApprovalPanel({
  trips,
  onApprove,
  onReject,
  onCalendarSync,
}: ManagerApprovalPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const pendingTrips = trips.filter(
    (t) => t.status === "confirmed" && t.approvalStatus === "pending"
  );

  const approvedTrips = trips.filter(
    (t) => t.status === "confirmed" && t.approvalStatus === "approved"
  );

  const rejectedTrips = trips.filter(
    (t) => t.status === "confirmed" && t.approvalStatus === "rejected"
  );

  if (pendingTrips.length === 0 && approvedTrips.length === 0 && rejectedTrips.length === 0) {
    return null;
  }

  const handleApprove = async (tripId: string) => {
    setProcessingId(tripId);
    await new Promise((r) => setTimeout(r, 500));
    onApprove(tripId);
    setProcessingId(null);
  };

  const handleReject = async (tripId: string) => {
    setProcessingId(tripId);
    await new Promise((r) => setTimeout(r, 500));
    onReject(tripId);
    setProcessingId(null);
  };

  const handleRetrySync = async (tripId: string) => {
    setSyncingId(tripId);
    await onCalendarSync(tripId);
    setSyncingId(null);
  };

  const formatDates = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "TBD";
      return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
    } catch {
      return "TBD";
    }
  };

  const renderTripCard = (trip: LocalTrip, showActions: boolean = true) => (
    <div
      key={trip.id}
      className="p-4 rounded-xl border border-border/60 bg-card space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-foreground">{trip.destination}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDates(trip.startDate, trip.endDate)} • {trip.purpose}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-foreground">
            ${trip.estimatedCost.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {trip.flight && (
          <span className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md">
            <Plane className="w-3 h-3" />
            {trip.flight.airline}
          </span>
        )}
        {trip.hotel && (
          <span className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md">
            <Building2 className="w-3 h-3" />
            {trip.hotel.name}
          </span>
        )}
      </div>

      {/* Calendar sync error */}
      {trip.approvalStatus === "approved" && trip.calendarSyncError && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-warning/10 text-warning text-sm">
          <span>{trip.calendarSyncError}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRetrySync(trip.id)}
            disabled={syncingId === trip.id}
            className="h-7 text-warning hover:text-warning"
          >
            {syncingId === trip.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </>
            )}
          </Button>
        </div>
      )}

      {/* Calendar synced success */}
      {trip.approvalStatus === "approved" && trip.calendarEventId && !trip.calendarSyncError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 text-success text-sm">
          <Check className="w-4 h-4" />
          <span>Added to calendar</span>
        </div>
      )}

      {showActions && trip.approvalStatus === "pending" && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReject(trip.id)}
            disabled={processingId === trip.id}
            className="flex-1 text-destructive hover:text-destructive hover:border-destructive/50"
          >
            {processingId === trip.id ? (
              <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-1" />
                Reject
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => handleApprove(trip.id)}
            disabled={processingId === trip.id}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
          >
            {processingId === trip.id ? (
              <div className="w-4 h-4 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Approve
              </>
            )}
          </Button>
        </div>
      )}

      {trip.approvalStatus === "rejected" && (
        <Badge variant="destructive" className="w-fit">
          Rejected
        </Badge>
      )}
    </div>
  );

  return (
    <Card className="border-primary/20 bg-primary/5">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Manager Approval</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {pendingTrips.length} pending approval
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingTrips.length > 0 && (
                  <Badge className="bg-warning/10 text-warning border-warning/20">
                    {pendingTrips.length} pending
                  </Badge>
                )}
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Demo: As a manager, approve or reject pending trips. Calendar sync
              occurs only after approval.
            </p>

            {/* Pending */}
            {pendingTrips.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  Pending Approval
                </h4>
                {pendingTrips.map((trip) => renderTripCard(trip, true))}
              </div>
            )}

            {/* Approved */}
            {approvedTrips.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Approved
                </h4>
                {approvedTrips.map((trip) => renderTripCard(trip, false))}
              </div>
            )}

            {/* Rejected */}
            {rejectedTrips.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <X className="w-4 h-4 text-destructive" />
                  Rejected
                </h4>
                {rejectedTrips.map((trip) => renderTripCard(trip, false))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}