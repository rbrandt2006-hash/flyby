import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";
import { format, differenceInDays, isWithinInterval, isBefore, isAfter } from "date-fns";

interface DatePickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date | null;
  endDate: Date | null;
  onSelect: (start: Date, end: Date) => void;
  conferenceStart?: Date;
  conferenceEnd?: Date;
  eventName?: string;
}

export function DatePickerDrawer({
  open,
  onOpenChange,
  startDate: initialStart,
  endDate: initialEnd,
  onSelect,
  conferenceStart,
  conferenceEnd,
  eventName = "Conference",
}: DatePickerDrawerProps) {
  const isMobile = useIsMobile();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: initialStart || undefined,
    to: initialEnd || undefined,
  });

  // Reset when drawer opens with new dates
  useEffect(() => {
    if (open) {
      setDateRange({
        from: initialStart || undefined,
        to: initialEnd || undefined,
      });
    }
  }, [open, initialStart, initialEnd]);

  const handleConfirm = () => {
    if (dateRange.from && dateRange.to) {
      onSelect(dateRange.from, dateRange.to);
      onOpenChange(false);
    }
  };

  const nights = dateRange.from && dateRange.to
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;

  // Check if selected dates miss the conference
  const missesConference = conferenceStart && conferenceEnd && dateRange.from && dateRange.to && (
    isAfter(dateRange.from, conferenceEnd) || isBefore(dateRange.to, conferenceStart)
  );

  // Check if dates partially cover conference
  const partialCoverage = conferenceStart && conferenceEnd && dateRange.from && dateRange.to && !missesConference && (
    isAfter(dateRange.from, conferenceStart) || isBefore(dateRange.to, conferenceEnd)
  );

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-background shadow-2xl flex flex-col",
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]"
                : "right-0 top-0 h-full w-full max-w-md border-l"
            )}
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 shrink-0 px-5 py-4 border-b border-border/40 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Select dates</h2>
                    <p className="text-sm text-muted-foreground">
                      {nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : "Choose travel dates"}
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Conference info */}
              {conferenceStart && conferenceEnd && (
                <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(conferenceStart, "MMM d")} – {format(conferenceEnd, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date selection summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
                  <p className="text-xs text-muted-foreground mb-1">Check-in</p>
                  <p className="font-medium">
                    {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "Select date"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
                  <p className="text-xs text-muted-foreground mb-1">Check-out</p>
                  <p className="font-medium">
                    {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "Select date"}
                  </p>
                </div>
              </div>

              {/* Warning messages */}
              {missesConference && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Dates miss the event</p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        The selected dates don't overlap with {eventName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {partialCoverage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Partial coverage</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        You may miss part of {eventName}. Consider arriving earlier or staying later.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Calendar */}
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={isMobile ? 1 : 1}
                  disabled={(date) => date < new Date()}
                  modifiers={{
                    ...(conferenceStart && conferenceEnd ? {
                      conference: { from: conferenceStart, to: conferenceEnd } as const,
                    } : {}),
                  }}
                  modifiersStyles={{
                    conference: {
                      backgroundColor: "hsl(var(--primary) / 0.15)",
                      borderRadius: 0,
                    },
                  }}
                  className="rounded-xl border border-border/40 p-3 pointer-events-auto"
                />
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <span className="text-xs text-muted-foreground">{eventName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span className="text-xs text-muted-foreground">Selected</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-background">
              <Button
                className="w-full h-11 rounded-xl"
                onClick={handleConfirm}
                disabled={!dateRange.from || !dateRange.to}
              >
                Confirm Dates
                {nights > 0 && ` (${nights} night${nights !== 1 ? 's' : ''})`}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
