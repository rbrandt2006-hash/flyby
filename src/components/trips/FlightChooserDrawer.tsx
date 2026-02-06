import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";

interface FlightOption {
  id: string;
  airline: string;
  departTime: string;
  arriveTime: string;
  returnDepartTime: string;
  returnArriveTime: string;
  price: number;
  stops: number;
  duration: string;
  tags: string[];
}

interface FlightChooserDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flights: FlightOption[];
  selectedFlight: FlightOption | null;
  onSelect: (flight: FlightOption) => void;
}

type SortOption = "recommended" | "cheapest" | "fastest" | "nonstop";

// Note: Using Plane icons instead of emoji logos

export function FlightChooserDrawer({
  open,
  onOpenChange,
  flights,
  selectedFlight,
  onSelect,
}: FlightChooserDrawerProps) {
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case "cheapest":
        return a.price - b.price;
      case "fastest":
        const aDuration = parseInt(a.duration.replace(/[^0-9]/g, ""));
        const bDuration = parseInt(b.duration.replace(/[^0-9]/g, ""));
        return aDuration - bDuration;
      case "nonstop":
        return a.stops - b.stops;
      default:
        // Recommended: prioritize flights with "Recommended" tag
        const aHasRec = a.tags.includes("Recommended") ? 0 : 1;
        const bHasRec = b.tags.includes("Recommended") ? 0 : 1;
        return aHasRec - bHasRec;
    }
  });

  const handleSelect = (flight: FlightOption) => {
    onSelect(flight);
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

          {/* Drawer/Sheet */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-background shadow-2xl flex flex-col",
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh]"
                : "right-0 top-0 h-full w-full max-w-md border-l"
            )}
          >
            {/* Handle for mobile */}
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
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Choose a flight</h2>
                    <p className="text-sm text-muted-foreground">{flights.length} options available</p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Sort tabs */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {(["recommended", "cheapest", "fastest", "nonstop"] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                      sortBy === option
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Flight list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {sortedFlights.map((flight) => (
                <button
                  key={flight.id}
                  onClick={() => handleSelect(flight)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    selectedFlight?.id === flight.id
                      ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
                      : "bg-card border-border/60 hover:border-primary/30 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Airline logo */}
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Plane className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{flight.airline}</p>
                        <p className="text-lg font-bold text-primary">${flight.price}</p>
                      </div>

                      {/* Times */}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="font-medium">{flight.departTime}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <div className="w-8 h-px bg-border" />
                          <ArrowRight className="w-3 h-3" />
                          <div className="w-8 h-px bg-border" />
                        </div>
                        <span className="font-medium">{flight.arriveTime}</span>
                      </div>

                      {/* Duration and stops */}
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {flight.duration}
                        </span>
                        <span>•</span>
                        <span>{flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {flight.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={tag === "Recommended" ? "default" : tag === "Fastest" ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
