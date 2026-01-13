import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Clock, ArrowRight, ChevronLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { createPortal } from "react-dom";
import type { FlightOption, SeatOption } from "./types";
import { SeatMapView } from "./SeatMapView";
import { generateSeatMap } from "./mockBookingData";

interface FlightSelectorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flights: FlightOption[];
  selectedFlight: FlightOption | null;
  selectedSeat: SeatOption | null;
  onSelect: (flight: FlightOption, seat: SeatOption | null) => void;
  basePrice: number;
}

type SortOption = "recommended" | "cheapest" | "fastest" | "nonstop";

export function FlightSelectorDrawer({
  open,
  onOpenChange,
  flights,
  selectedFlight,
  selectedSeat: initialSeat,
  onSelect,
  basePrice,
}: FlightSelectorDrawerProps) {
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [viewState, setViewState] = useState<"list" | "seats">("list");
  const [pendingFlight, setPendingFlight] = useState<FlightOption | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatOption | null>(initialSeat);
  const [seatMap] = useState<SeatOption[]>(() => generateSeatMap());

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
        const aHasRec = a.tags.includes("Recommended") ? 0 : 1;
        const bHasRec = b.tags.includes("Recommended") ? 0 : 1;
        return aHasRec - bHasRec;
    }
  });

  const handleFlightClick = (flight: FlightOption) => {
    setPendingFlight(flight);
    setSelectedSeat(null);
    setViewState("seats");
  };

  const handleSeatSelect = (seat: SeatOption) => {
    setSelectedSeat(seat);
  };

  const handleConfirmSelection = () => {
    if (pendingFlight) {
      onSelect(pendingFlight, selectedSeat);
      setViewState("list");
      setPendingFlight(null);
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    setViewState("list");
    setPendingFlight(null);
    setSelectedSeat(null);
  };

  const handleClose = () => {
    setViewState("list");
    setPendingFlight(null);
    setSelectedSeat(null);
    onOpenChange(false);
  };

  const currentFlightPrice = pendingFlight?.price || selectedFlight?.price || basePrice;
  const seatPrice = selectedSeat?.price || 0;
  const totalFlightCost = currentFlightPrice + seatPrice;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                : "right-0 top-0 h-full w-full max-w-lg border-l"
            )}
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>
            )}

            <AnimatePresence mode="wait">
              {viewState === "list" ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
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
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>

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

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {sortedFlights.map((flight) => (
                      <button
                        key={flight.id}
                        onClick={() => handleFlightClick(flight)}
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all group",
                          selectedFlight?.id === flight.id
                            ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
                            : "bg-card border-border/60 hover:border-primary/30 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                            {flight.airlineLogo}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-foreground">{flight.airline}</p>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">${flight.price}</p>
                                {flight.priceDiff !== 0 && (
                                  <p className={cn(
                                    "text-xs font-medium",
                                    flight.priceDiff! < 0 ? "text-green-600" : "text-orange-600"
                                  )}>
                                    {flight.priceDiff! > 0 ? "+" : ""}${flight.priceDiff}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="font-medium">{flight.departTime}</span>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <div className="w-8 h-px bg-border" />
                                <ArrowRight className="w-3 h-3" />
                                <div className="w-8 h-px bg-border" />
                              </div>
                              <span className="font-medium">{flight.arriveTime}</span>
                            </div>

                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {flight.duration}
                              </span>
                              <span>•</span>
                              <span>
                                {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                                {flight.stopCity && ` (${flight.stopCity})`}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {flight.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={tag === "Recommended" ? "default" : tag === "Cheapest" ? "secondary" : "outline"}
                                  className="text-[10px]"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* AI suggestion */}
                            {flight.priceDiff && flight.priceDiff < -50 && (
                              <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/40">
                                <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                  {flight.airline} is ${Math.abs(flight.priceDiff)} cheaper
                                  {flight.stops > 0 && ` but has ${flight.stops} stop`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="seats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <div className="sticky top-0 z-10 shrink-0 px-5 py-4 border-b border-border/40 bg-background">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-foreground">Select your seat</h2>
                        <p className="text-sm text-muted-foreground">
                          {pendingFlight?.airline} • {pendingFlight?.departTime}
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <SeatMapView
                      seats={seatMap}
                      selectedSeat={selectedSeat}
                      onSelectSeat={handleSeatSelect}
                    />
                  </div>

                  <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-background">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Flight + Seat</p>
                        <p className="text-lg font-bold text-foreground">
                          ${totalFlightCost}
                          {seatPrice > 0 && (
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              (+${seatPrice} seat)
                            </span>
                          )}
                        </p>
                      </div>
                      {selectedSeat && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Selected</p>
                          <p className="font-semibold">Seat {selectedSeat.id}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full h-11 rounded-xl"
                      onClick={handleConfirmSelection}
                    >
                      Confirm Selection
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
