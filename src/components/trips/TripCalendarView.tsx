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

type ViewMode = "month" | "week" | "timeline";

interface TripCalendarViewProps {
  open: boolean;
  onClose: () => void;
  trips: LocalTrip[];
  onConfirmTrip?: (tripId: string) => void;
}

interface TripConflict {
  tripA: LocalTrip;
  tripB: LocalTrip;
  overlapStart: Date;
  overlapEnd: Date;
}

export function TripCalendarView({ open, onClose, trips, onConfirmTrip }: TripCalendarViewProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => {
    // Auto-navigate to the month of the earliest upcoming trip
    const activeTrips = trips.filter(t => t.status !== "cancelled" && t.status !== "archived");
    if (activeTrips.length > 0) {
      const sorted = [...activeTrips].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      const earliest = new Date(sorted[0].startDate);
      if (earliest > new Date()) return earliest;
    }
    return new Date();
  });
  const [selectedTrip, setSelectedTrip] = useState<LocalTrip | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // All trips shown on calendar - drafts shown as tentative
  const calendarTrips = useMemo(() => {
    return trips.filter(t => 
      t.status !== "cancelled" && t.status !== "archived"
    );
  }, [trips]);

  // Tentative trips (draft or pending approval)
  const tentativeTripIds = useMemo(() => {
    const ids = new Set<string>();
    calendarTrips.forEach(t => {
      if (t.status === "draft" || t.approvalStatus === "pending") {
        ids.add(t.id);
      }
    });
    return ids;
  }, [calendarTrips]);

  // Pending approval trips kept for backward compat
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
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    if (viewMode === "timeline") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, viewMode]);

  // Get trips for a specific day
  const getTripsForDay = useCallback((day: Date) => {
    const dayTrips: { trip: LocalTrip; isStart: boolean; isEnd: boolean; isPending: boolean }[] = [];
    
    calendarTrips.forEach(trip => {
      const start = parseISO(trip.startDate);
      const end = parseISO(trip.endDate);
      
      if (isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)) {
        dayTrips.push({
          trip,
          isStart: isSameDay(day, start),
          isEnd: isSameDay(day, end),
          isPending: tentativeTripIds.has(trip.id),
        });
      }
    });
    
    return dayTrips;
  }, [calendarTrips, tentativeTripIds]);

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
                {calendarTrips.length} trip{calendarTrips.length !== 1 ? 's' : ''}
                {tentativeTripIds.size > 0 && ` · ${tentativeTripIds.size} tentative`}
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
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "timeline"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Calendar grid / Timeline */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === "timeline" ? (
          /* Timeline View */
          <div className="space-y-1">
            {/* Date header row */}
            <div className="flex">
              <div className="w-44 shrink-0 pr-3" />
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${calendarDays.length}, minmax(0, 1fr))` }}>
                {calendarDays.map((day) => (
                  <div key={day.toISOString()} className={cn(
                    "text-center text-[10px] font-medium pb-2 border-b border-border/30",
                    isSameDay(day, new Date()) ? "text-primary font-bold" : "text-muted-foreground"
                  )}>
                    <div>{format(day, "EEE")}</div>
                    <div className={cn(
                      "w-6 h-6 mx-auto flex items-center justify-center rounded-full text-xs",
                      isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Trip rows */}
            {calendarTrips.map((trip) => {
              const tripStart = parseISO(trip.startDate);
              const tripEnd = parseISO(trip.endDate);
              const monthStart = startOfMonth(currentDate);
              const monthEnd = endOfMonth(currentDate);
              const totalDays = calendarDays.length;

              // Calculate position
              const startCol = Math.max(0, differenceInDays(tripStart, monthStart));
              const endCol = Math.min(totalDays - 1, differenceInDays(tripEnd, monthStart));
              
              if (endCol < 0 || startCol >= totalDays) return null;
              
              const clampedStart = Math.max(0, startCol);
              const span = endCol - clampedStart + 1;
              const isPending = tentativeTripIds.has(trip.id);
              const initials = trip.destination.slice(0, 2).toUpperCase();

              return (
                <div key={trip.id} className="flex items-center h-12 group">
                  <div className="w-44 shrink-0 pr-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{trip.destination}</p>
                      <p className="text-[10px] text-muted-foreground">{format(tripStart, "MMM d")} – {format(tripEnd, "MMM d")}</p>
                    </div>
                  </div>
                  <div className="flex-1 grid relative h-full" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(0, 1fr))` }}>
                    {calendarDays.map((day) => (
                      <div key={day.toISOString()} className="border-l border-border/10 h-full" />
                    ))}
                    <button
                      onClick={(e) => handleTripClick(trip, e)}
                      className={cn(
                        "absolute top-1.5 bottom-1.5 rounded-lg flex items-center px-3 text-xs font-medium transition-all",
                        "hover:shadow-md hover:brightness-110 cursor-pointer",
                        trip.status === "draft"
                          ? "bg-muted/40 text-muted-foreground border border-dashed border-border/60"
                          : trip.status === "confirmed" && trip.approvalStatus !== "pending"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : isPending
                              ? "bg-warning/20 text-warning border border-warning/30"
                              : "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25"
                      )}
                      style={{
                        left: `${(clampedStart / totalDays) * 100}%`,
                        width: `${(span / totalDays) * 100}%`,
                      }}
                    >
                      <Plane className="w-3 h-3 mr-1.5 shrink-0" />
                      <span className="truncate">{trip.destination}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {calendarTrips.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No trips this month</p>
              </div>
            )}
          </div>
        ) : (
        /* Month/Week Grid View */
        <div className={cn(
          "grid gap-px bg-border/50 rounded-2xl overflow-hidden border border-border/40 shadow-sm",
          "grid-cols-7"
        )}>
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-muted/30 px-3 py-2.5 text-xs font-semibold text-muted-foreground text-center"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayTrips = getTripsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = viewMode === "month" ? isSameMonth(day, currentDate) : true;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "bg-card min-h-[110px] p-2.5 transition-all relative group/cell hover:bg-muted/20",
                  viewMode === "week" && "min-h-[200px]",
                  !isCurrentMonth && "bg-muted/10"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1.5 w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                    isToday && "bg-primary text-primary-foreground shadow-sm",
                    !isCurrentMonth && "text-muted-foreground/40",
                    !isToday && isCurrentMonth && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>

                <div className="space-y-1">
                  {dayTrips.slice(0, viewMode === "month" ? 3 : 6).map(({ trip, isStart, isEnd, isPending }) => {
                    const hasConflict = conflictingTripIds.has(trip.id);
                    const hasSynced = !!trip.calendarEventId;
                    const initials = trip.destination.slice(0, 2).toUpperCase();

                    return (
                      <button
                        key={trip.id}
                        onClick={(e) => handleTripClick(trip, e)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-all group/trip",
                          "hover:shadow-sm hover:scale-[1.02]",
                          trip.status === "draft"
                            ? "bg-muted/60 text-muted-foreground border border-dashed border-border/60 opacity-80"
                            : trip.status === "confirmed" && trip.approvalStatus !== "pending"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : isPending 
                                ? "bg-warning/15 text-warning border border-warning/20 opacity-70"
                                : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10",
                          hasConflict && "ring-2 ring-destructive/40",
                          isStart && "rounded-l-xl pl-2.5",
                          isEnd && "rounded-r-xl pr-2.5"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                            trip.status === "draft" ? "bg-muted-foreground/20" : "bg-primary/20"
                          )}>
                            {initials.charAt(0)}
                          </div>
                          {hasConflict && (
                            <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                          )}
                          {trip.status === "draft" && !hasConflict && (
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                          {trip.status === "confirmed" && !hasConflict && (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          <span className="truncate">{trip.destination}</span>
                        </div>
                      </button>
                    );
                  })}
                  {dayTrips.length > (viewMode === "month" ? 3 : 6) && (
                    <div className="text-[10px] text-muted-foreground px-2 font-medium">
                      +{dayTrips.length - (viewMode === "month" ? 3 : 6)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Trip preview popover */}
      <AnimatePresence>
        {selectedTrip && (
          <CalendarTripPreview
            trip={selectedTrip}
            position={previewPosition}
            onClose={() => setSelectedTrip(null)}
            onViewTrip={() => handleViewTrip(selectedTrip.id)}
            onConfirmTrip={onConfirmTrip}
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
        trips={calendarTrips}
        conflicts={conflicts}
        dateRange={dateRangeLabel}
      />

      {/* Share modal */}
      <CalendarShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        trips={calendarTrips}
        conflicts={conflicts}
        dateRange={dateRangeLabel}
      />
    </motion.div>
  );

  return createPortal(content, document.body);
}
