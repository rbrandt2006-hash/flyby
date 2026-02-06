import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  X,
  Plane,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  Check,
  Clock,
  MapPin,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LocalTrip } from "@/hooks/useTrips";

interface TripConfirmationModalProps {
  trip: LocalTrip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tripId: string) => void;
}

interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

function validateTrip(trip: LocalTrip): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!trip.flight) {
    issues.push({
      field: "flight",
      message: "No flight selected",
      severity: "error",
    });
  }

  if (!trip.hotel) {
    issues.push({
      field: "hotel",
      message: "No hotel selected",
      severity: "warning",
    });
  }

  if (!trip.startDate || !trip.endDate) {
    issues.push({
      field: "dates",
      message: "Trip dates are missing",
      severity: "error",
    });
  }

  const start = new Date(trip.startDate);
  const now = new Date();
  if (start < now) {
    issues.push({
      field: "dates",
      message: "Trip start date is in the past",
      severity: "warning",
    });
  }

  return issues;
}

export function TripConfirmationModal({
  trip,
  open,
  onOpenChange,
  onConfirm,
}: TripConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setIsConfirming(false);
    }
  }, [open]);

  if (!trip) return null;

  const issues = validateTrip(trip);
  const hasErrors = issues.some((i) => i.severity === "error");
  const hasWarnings = issues.some((i) => i.severity === "warning");

  const formatDates = () => {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "TBD";
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    } catch {
      return "TBD";
    }
  };

  const handleConfirm = async () => {
    if (hasErrors) return;

    setIsConfirming(true);
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500));
    onConfirm(trip.id);
    onOpenChange(false);
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-background rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Confirm Trip
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review details before confirming
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Destination */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {trip.destination}
                    </h3>
                  </div>
                  {trip.purpose && (
                    <p className="text-sm text-muted-foreground ml-7">
                      {trip.purpose}
                    </p>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  {/* Dates */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Dates
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDates()}
                      </p>
                    </div>
                  </div>

                  {/* Flight */}
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      trip.flight ? "bg-muted/50" : "bg-destructive/5 border border-destructive/20"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        trip.flight ? "bg-background" : "bg-destructive/10"
                      )}
                    >
                      <Plane
                        className={cn(
                          "w-4 h-4",
                          trip.flight ? "text-muted-foreground" : "text-destructive"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Flight
                      </p>
                      {trip.flight ? (
                        <p className="text-sm text-muted-foreground">
                          {trip.flight.airline} • Depart {trip.flight.departTime}
                        </p>
                      ) : (
                        <p className="text-sm text-destructive">
                          No flight selected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hotel */}
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl",
                      trip.hotel ? "bg-muted/50" : "bg-warning/5 border border-warning/20"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        trip.hotel ? "bg-background" : "bg-warning/10"
                      )}
                    >
                      <Building2
                        className={cn(
                          "w-4 h-4",
                          trip.hotel ? "text-muted-foreground" : "text-warning"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Hotel
                      </p>
                      {trip.hotel ? (
                        <p className="text-sm text-muted-foreground">
                          {trip.hotel.name} • {trip.hotel.location}
                        </p>
                      ) : (
                        <p className="text-sm text-warning">
                          No hotel selected (optional)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ground Transport */}
                  {trip.groundTransport && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Ground Transport
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trip.groundTransport}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Cost */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">
                      Estimated Total
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    ${trip.estimatedCost.toLocaleString()}
                  </span>
                </div>

                {/* Validation Issues */}
                {issues.length > 0 && (
                  <div className="space-y-2">
                    {issues.map((issue, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-2 p-3 rounded-lg text-sm",
                          issue.severity === "error"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        )}
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approval Notice */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 text-info border border-info/20">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Pending manager approval</p>
                    <p className="text-info/80">
                      Your trip will be confirmed but won't be added to your
                      calendar until approved by your manager.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={hasErrors || isConfirming}
                  className="flex-1 gap-2"
                >
                  {isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm Trip
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}