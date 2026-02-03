import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface TripDateSelectionPageProps {
  open: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  onSelect: (start: Date, end: Date) => void;
  tripDestination?: string;
}

export function TripDateSelectionPage({
  open,
  onClose,
  startDate,
  endDate,
  onSelect,
  tripDestination,
}: TripDateSelectionPageProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  // Reset date range when modal opens
  useEffect(() => {
    if (open) {
      setDateRange({ from: startDate, to: endDate });
    }
  }, [open, startDate, endDate]);

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      onSelect(dateRange.from, dateRange.to);
      onClose();
    }
  };

  const handleClose = () => {
    setDateRange({ from: startDate, to: endDate });
    onClose();
  };

  const nights = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 shrink-0 bg-background border-b border-border">
            <div className="px-4 sm:px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {/* Back button and title */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleClose}
                    className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Back to trip
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-semibold truncate">
                          Select Travel Dates
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {tripDestination ? `Trip to ${tripDestination}` : "Choose your trip dates"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              {/* Selected dates summary */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/60 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected dates</p>
                    <p className="text-lg font-semibold">
                      {dateRange?.from && dateRange?.to
                        ? `${format(dateRange.from, "EEE, MMM d")} – ${format(dateRange.to, "EEE, MMM d, yyyy")}`
                        : "Select start and end dates"
                      }
                    </p>
                  </div>
                  {nights > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-lg font-semibold text-primary">
                        {nights} {nights === 1 ? "night" : "nights"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar */}
              <div className="flex justify-center">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </div>
              </div>

              {/* Quick select options */}
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Quick select</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "2 nights", nights: 2 },
                    { label: "3 nights", nights: 3 },
                    { label: "5 nights", nights: 5 },
                    { label: "1 week", nights: 7 },
                  ].map((option) => (
                    <button
                      key={option.nights}
                      onClick={() => {
                        if (dateRange?.from) {
                          const newEnd = new Date(dateRange.from);
                          newEnd.setDate(newEnd.getDate() + option.nights);
                          setDateRange({ from: dateRange.from, to: newEnd });
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        nights === option.nights
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-20 bg-background border-t border-border">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {dateRange?.from && dateRange?.to ? (
                    <span>
                      {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d")} ({nights} nights)
                    </span>
                  ) : (
                    <span>Select dates to continue</span>
                  )}
                </div>
                <Button
                  onClick={handleConfirm}
                  disabled={!dateRange?.from || !dateRange?.to}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Dates
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
