import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  X, 
  AlertTriangle, 
  ExternalLink,
  MapPin,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import type { LocalTrip } from "@/hooks/useTrips";

interface TripConflict {
  tripA: LocalTrip;
  tripB: LocalTrip;
  overlapStart: Date;
  overlapEnd: Date;
}

interface TripConflictPanelProps {
  open: boolean;
  onClose: () => void;
  conflicts: TripConflict[];
  onViewTrip: (tripId: string) => void;
}

export function TripConflictPanel({ 
  open, 
  onClose, 
  conflicts,
  onViewTrip 
}: TripConflictPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-border/40 flex items-center justify-between bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Trip Conflicts</h2>
                  <p className="text-sm text-muted-foreground">
                    {conflicts.length} overlapping trip{conflicts.length !== 1 ? 's' : ''} detected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Conflict list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conflicts.map((conflict, index) => {
                const overlapDays = differenceInDays(conflict.overlapEnd, conflict.overlapStart) + 1;

                return (
                  <div
                    key={`${conflict.tripA.id}-${conflict.tripB.id}`}
                    className="rounded-xl border border-destructive/30 bg-card p-4 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Trips overlap by {overlapDays} day{overlapDays !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Overlap: {format(conflict.overlapStart, "MMM d")} – {format(conflict.overlapEnd, "MMM d, yyyy")}
                    </div>

                    {/* Trip A */}
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{conflict.tripA.destination}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTrip(conflict.tripA.id)}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(parseISO(conflict.tripA.startDate), "MMM d")} – {format(parseISO(conflict.tripA.endDate), "MMM d")}
                        </span>
                      </div>
                    </div>

                    {/* Trip B */}
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">{conflict.tripB.destination}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTrip(conflict.tripB.id)}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(parseISO(conflict.tripB.startDate), "MMM d")} – {format(parseISO(conflict.tripB.endDate), "MMM d")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {conflicts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No conflicts detected</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-6 border-t border-border/40">
              <p className="text-xs text-muted-foreground text-center">
                Resolve conflicts by adjusting trip dates or canceling one of the overlapping trips.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
