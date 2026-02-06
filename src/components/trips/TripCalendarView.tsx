import { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  CalendarDays,
  AlertTriangle,
  Check,
  Clock,
  FileDown,
  Share2,
  Plane,
  Building2,
  Car,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  isWithinInterval,
  parseISO,
  differenceInDays
} from "date-fns";
import { useNavigate } from "react-router-dom";
import type { LocalTrip } from "@/hooks/useTrips";
import { CalendarTripPreview } from "./CalendarTripPreview";
import { TripConflictPanel } from "./TripConflictPanel";
import { CalendarExportModal } from "./CalendarExportModal";
import { CalendarShareModal } from "./CalendarShareModal";

type ViewMode = "month" | "week";

interface TripCalendarViewProps {
  open: boolean;
  onClose: () => void;
  trips: LocalTrip[];
}

interface TripConflict {
  tripA: LocalTrip;
  tripB: LocalTrip;
  overlapStart: Date;
  overlapEnd: Date;
}

export function TripCalendarView({ open, onClose, trips }: TripCalendarViewProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrip, setSelectedTrip] = useState<LocalTrip | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Filter only confirmed/approved trips (exclude Draft and Pending Approval)
  const calendarTrips = useMemo(() => {
    return trips.filter(t => 
      t.status === "confirmed" && 
      (t.approvalStatus === "approved" || t.approvalStatus === "none")
    );
  }, [trips]);

  // Pending approval trips (shown muted)
  const pendingTrips = useMemo(() => {
    return trips.filter(t => 
      t.status === "confirmed" && 
      t.approvalStatus === "pending"
    );
  }, [trips]);

  // Detect conflicts between trips
  const conflicts = useMemo(() => {
    const conflictList: TripConflict[] = [];
    const allTrips = [...calendarTrips, ...pendingTrips];
    
    for (let i = 0; i < allTrips.length; i++) {
      for (let j = i + 1; j < allTrips.length; j++) {
        const tripA = allTrips[i];
        const tripB = allTrips[j];
        
        const startA = parseISO(tripA.startDate);
        const endA = parseISO(tripA.endDate);
        const startB = parseISO(tripB.startDate);
        const endB = parseISO(tripB.endDate);
        
        // Check for overlap
        if (startA <= endB && endA >= startB) {
          conflictList.push({
            tripA,
            tripB,
            overlapStart: startA > startB ? startA : startB,
            overlapEnd: endA < endB ? endA : endB,
          });
        }
      }
    }
    
    return conflictList;
  }, [calendarTrips, pendingTrips]);

  // Get trips that have conflicts
  const conflictingTripIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach(c => {
      ids.add(c.tripA.id);
      ids.add(c.tripB.id);
    });
    return ids;
  }, [conflicts]);

  // Calendar navigation
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  // Get trips for a specific day
  const getTripsForDay = useCallback((day: Date) => {
    const dayTrips: { trip: LocalTrip; isStart: boolean; isEnd: boolean; isPending: boolean }[] = [];
    
    [...calendarTrips, ...pendingTrips].forEach(trip => {
      const start = parseISO(trip.startDate);
      const end = parseISO(trip.endDate);
      
      if (isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)) {
        dayTrips.push({
          trip,
          isStart: isSameDay(day, start),
          isEnd: isSameDay(day, end),
          isPending: trip.approvalStatus === "pending",
        });
      }
    });
    
    return dayTrips;
  }, [calendarTrips, pendingTrips]);

  // Handle trip click
  const handleTripClick = (trip: LocalTrip, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewPosition({ x: rect.left, y: rect.bottom + 8 });
    setSelectedTrip(trip);
  };

  // Navigate to trip detail
  const handleViewTrip = (tripId: string) => {
    onClose();
    navigate(`/trips/${tripId}`);
  };

  // Get date range label for header
  const dateRangeLabel = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (format(weekStart, "MMM") === format(weekEnd, "MMM")) {
        return `${format(weekStart, "MMM d")} – ${format(weekEnd, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
    }
  }, [currentDate, viewMode]);

  if (!open) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border/40 bg-background flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Trip Calendar</h1>
              <p className="text-sm text-muted-foreground">
                {calendarTrips.length} confirmed trip{calendarTrips.length !== 1 ? 's' : ''}
                {pendingTrips.length > 0 && ` • ${pendingTrips.length} pending`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Conflict alert */}
          {conflicts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConflictPanel(true)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
            </Button>
          )}

          {/* Export PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          {/* Share with manager */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Calendar controls */}
      <div className="shrink-0 px-6 py-3 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center border rounded-lg">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-muted transition-colors rounded-l-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-muted transition-colors rounded-r-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-lg font-semibold ml-2">{dateRangeLabel}</span>
        </div>

        <div className="flex items-center gap-1 border rounded-lg p-1">
          <button
            onClick={() => setViewMode("month")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "month"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "week"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className={cn(
          "grid gap-px bg-border rounded-xl overflow-hidden border border-border",
          viewMode === "month" ? "grid-cols-7" : "grid-cols-7"
        )}>
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground text-center"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dayTrips = getTripsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = viewMode === "month" ? isSameMonth(day, currentDate) : true;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-card min-h-[100px] p-2 transition-colors relative",
                  viewMode === "week" && "min-h-[200px]",
                  !isCurrentMonth && "bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}
                >
                  {format(day, "d")}
                </div>

                <div className="space-y-1">
                  {dayTrips.slice(0, viewMode === "month" ? 3 : 6).map(({ trip, isStart, isEnd, isPending }) => {
                    const hasConflict = conflictingTripIds.has(trip.id);
                    const hasSynced = !!trip.calendarEventId;

                    return (
                      <button
                        key={trip.id}
                        onClick={(e) => handleTripClick(trip, e)}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-all group relative",
                          isPending 
                            ? "bg-warning/20 text-warning border border-warning/30 opacity-60"
                            : "bg-primary/10 text-primary hover:bg-primary/20",
                          hasConflict && "ring-2 ring-destructive/50",
                          isStart && "rounded-l-full pl-3",
                          isEnd && "rounded-r-full pr-3"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {hasConflict && (
                            <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                          )}
                          {hasSynced && !hasConflict && (
                            <Check className="w-3 h-3 text-success shrink-0" />
                          )}
                          <span className="truncate">{trip.destination}</span>
                        </div>
                      </button>
                    );
                  })}
                  {dayTrips.length > (viewMode === "month" ? 3 : 6) && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dayTrips.length - (viewMode === "month" ? 3 : 6)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trip preview popover */}
      <AnimatePresence>
        {selectedTrip && (
          <CalendarTripPreview
            trip={selectedTrip}
            position={previewPosition}
            onClose={() => setSelectedTrip(null)}
            onViewTrip={() => handleViewTrip(selectedTrip.id)}
            hasConflict={conflictingTripIds.has(selectedTrip.id)}
          />
        )}
      </AnimatePresence>

      {/* Conflict panel */}
      <TripConflictPanel
        open={showConflictPanel}
        onClose={() => setShowConflictPanel(false)}
        conflicts={conflicts}
        onViewTrip={handleViewTrip}
      />

      {/* Export modal */}
      <CalendarExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        trips={[...calendarTrips, ...pendingTrips]}
        conflicts={conflicts}
        dateRange={dateRangeLabel}
      />

      {/* Share modal */}
      <CalendarShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        trips={[...calendarTrips, ...pendingTrips]}
        conflicts={conflicts}
        dateRange={dateRangeLabel}
      />
    </motion.div>
  );

  return createPortal(content, document.body);
}
