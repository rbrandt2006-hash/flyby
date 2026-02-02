import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface TripDatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date;
  endDate: Date;
  onSelect: (start: Date, end: Date) => void;
}

export function TripDatePicker({
  open,
  onOpenChange,
  startDate,
  endDate,
  onSelect,
}: TripDatePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  });

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      onSelect(dateRange.from, dateRange.to);
    }
  };

  const handleClose = () => {
    setDateRange({ from: startDate, to: endDate });
    onOpenChange(false);
  };

  const nights = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[60] w-auto sm:w-fit bg-background rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Edit dates</h2>
                    <p className="text-sm text-muted-foreground">
                      {dateRange?.from && dateRange?.to
                        ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")} (${nights} nights)`
                        : "Select dates"
                      }
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-y-auto p-4">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-border bg-background flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-cta hover:bg-cta-hover text-cta-foreground"
                onClick={handleConfirm}
                disabled={!dateRange?.from || !dateRange?.to}
              >
                Confirm dates
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
