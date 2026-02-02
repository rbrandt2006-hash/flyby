import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Search, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlightOption, SeatOption } from "@/components/chats/booking/types";

interface TripFlightPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flights: FlightOption[];
  selectedFlight: FlightOption | null;
  selectedSeat: SeatOption | null;
  onSelect: (flight: FlightOption, seat: SeatOption | null) => void;
}

type SortOption = "recommended" | "cheapest" | "fastest" | "nonstop";

export function TripFlightPicker({
  open,
  onOpenChange,
  flights,
  selectedFlight,
  selectedSeat,
  onSelect,
}: TripFlightPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const filteredFlights = useMemo(() => {
    if (!searchQuery.trim()) return flights;
    const query = searchQuery.toLowerCase();
    return flights.filter(f => 
      f.airline.toLowerCase().includes(query) ||
      f.origin.toLowerCase().includes(query) ||
      f.destination.toLowerCase().includes(query)
    );
  }, [flights, searchQuery]);

  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
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
          const aHasRec = a.tags.includes("Recommended") ? 0 : 1;
          const bHasRec = b.tags.includes("Recommended") ? 0 : 1;
          return aHasRec - bHasRec;
      }
    });
  }, [filteredFlights, sortBy]);

  const handleSelect = (flight: FlightOption) => {
    onSelect(flight, null);
  };

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

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
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[60] w-auto sm:w-full sm:max-w-lg bg-background rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Change flight</h2>
                    <p className="text-sm text-muted-foreground">{flights.length} options</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search airline..."
                  className="pl-9"
                />
              </div>

              {/* Sort tabs */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {(["recommended", "cheapest", "fastest", "nonstop"] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedFlights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No flights found</p>
                </div>
              ) : (
                sortedFlights.map((flight) => {
                  const isSelected = selectedFlight?.id === flight.id;
                  return (
                    <button
                      key={flight.id}
                      onClick={() => handleSelect(flight)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{flight.airlineLogo}</span>
                          <span className="font-medium text-sm">{flight.airline}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">${flight.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="font-semibold text-sm">{flight.departTime}</p>
                          <p className="text-xs text-muted-foreground">{flight.origin}</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <p className="text-xs text-muted-foreground mb-1">{flight.duration}</p>
                          <div className="w-full flex items-center gap-1">
                            <div className="flex-1 border-t border-dashed border-border" />
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <div className="flex-1 border-t border-dashed border-border" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop`}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm">{flight.arriveTime}</p>
                          <p className="text-xs text-muted-foreground">{flight.destination}</p>
                        </div>
                      </div>
                      {flight.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-3">
                          {flight.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
