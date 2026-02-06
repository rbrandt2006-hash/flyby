import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Plane,
  Clock,
  ArrowRight,
  Check,
  Sparkles,
  X,
  ChevronDown,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface FlightOption {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber?: string;
  departTime: string;
  arriveTime: string;
  returnDepartTime?: string;
  returnArriveTime?: string;
  duration: string;
  stops: number;
  stopCity?: string;
  price: number;
  priceDiff?: number;
  tags: string[];
  origin?: string;
  destination?: string;
  co2Emissions?: string;
}

interface FlightSelectionPageProps {
  open: boolean;
  onClose: () => void;
  flights: FlightOption[];
  selectedFlight: FlightOption | null;
  onSelect: (flight: FlightOption) => void;
  origin?: string;
  destination?: string;
}

type SortOption = "recommended" | "cheapest" | "fastest" | "earliest";

// Airline list for filter chips (no emoji logos - use Plane icons instead)


const allAirlines = [
  "Delta",
  "United",
  "American",
  "JetBlue",
  "Alaska",
  "Southwest",
  "Spirit",
  "Frontier",
];

export function FlightSelectionPage({
  open,
  onClose,
  flights,
  selectedFlight,
  onSelect,
  origin,
  destination,
}: FlightSelectionPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [nonstopOnly, setNonstopOnly] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Get unique airlines from flights
  const availableAirlines = useMemo(() => {
    const airlines = new Set<string>();
    flights.forEach((f) => {
      // Normalize airline name
      const normalized = f.airline.replace(" Airlines", "").replace(" Airways", "").replace(" Air Lines", "");
      airlines.add(normalized);
    });
    return allAirlines.filter((a) => airlines.has(a) || airlines.has(a + " Airlines") || airlines.has(a + " Airways"));
  }, [flights]);

  // Filter and sort flights
  const filteredFlights = useMemo(() => {
    let result = [...flights];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.airline.toLowerCase().includes(query) ||
          (f.flightNumber && f.flightNumber.toLowerCase().includes(query)) ||
          f.departTime.toLowerCase().includes(query) ||
          f.arriveTime.toLowerCase().includes(query)
      );
    }

    // Nonstop filter
    if (nonstopOnly) {
      result = result.filter((f) => f.stops === 0);
    }

    // Airline filter
    if (selectedAirlines.length > 0) {
      result = result.filter((f) => {
        const normalized = f.airline.replace(" Airlines", "").replace(" Airways", "").replace(" Air Lines", "");
        return selectedAirlines.includes(normalized) || selectedAirlines.includes(f.airline);
      });
    }

    // Sort
    switch (sortBy) {
      case "cheapest":
        result.sort((a, b) => a.price - b.price);
        break;
      case "fastest":
        result.sort((a, b) => {
          const aDuration = parseDuration(a.duration);
          const bDuration = parseDuration(b.duration);
          return aDuration - bDuration;
        });
        break;
      case "earliest":
        result.sort((a, b) => {
          const aTime = parseTime(a.departTime);
          const bTime = parseTime(b.departTime);
          return aTime - bTime;
        });
        break;
      default:
        // Recommended: prioritize flights with "Recommended" tag, then by price
        result.sort((a, b) => {
          const aHasRec = a.tags.includes("Recommended") ? 0 : 1;
          const bHasRec = b.tags.includes("Recommended") ? 0 : 1;
          if (aHasRec !== bHasRec) return aHasRec - bHasRec;
          return a.price - b.price;
        });
    }

    return result;
  }, [flights, searchQuery, sortBy, nonstopOnly, selectedAirlines]);

  const handleSelectFlight = (flight: FlightOption) => {
    onSelect(flight);
    setSearchQuery("");
    setSelectedAirlines([]);
    setNonstopOnly(false);
    setSortBy("recommended");
    onClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedAirlines([]);
    setNonstopOnly(false);
    setSortBy("recommended");
    onClose();
  };

  const toggleAirline = (airline: string) => {
    setSelectedAirlines((prev) =>
      prev.includes(airline)
        ? prev.filter((a) => a !== airline)
        : [...prev, airline]
    );
  };

  const sortLabels: Record<SortOption, string> = {
    recommended: "Recommended",
    cheapest: "Lowest price",
    fastest: "Shortest flight",
    earliest: "Earliest departure",
  };

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
                <div className="flex items-center gap-4 mb-4">
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
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-semibold truncate">
                          Choose a flight
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {origin && destination && `${origin} → ${destination} • `}
                          {flights.length} option{flights.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search airline, flight number, or time"
                    className="pl-12 h-12 text-base rounded-xl"
                  />
                </div>

                {/* Filters row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Nonstop toggle */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                    <Switch
                      id="nonstop"
                      checked={nonstopOnly}
                      onCheckedChange={setNonstopOnly}
                    />
                    <label
                      htmlFor="nonstop"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Nonstop only
                    </label>
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
                    >
                      Sort: {sortLabels[sortBy]}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          showSortDropdown && "rotate-180"
                        )}
                      />
                    </button>
                    {showSortDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowSortDropdown(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                          {(
                            Object.keys(sortLabels) as SortOption[]
                          ).map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setSortBy(option);
                                setShowSortDropdown(false);
                              }}
                              className={cn(
                                "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between",
                                sortBy === option && "text-primary font-medium"
                              )}
                            >
                              {sortLabels[option]}
                              {sortBy === option && (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Airline chips */}
                {availableAirlines.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {availableAirlines.map((airline) => (
                      <button
                        key={airline}
                        onClick={() => toggleAirline(airline)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          selectedAirlines.includes(airline)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        )}
                      >
                        <Plane className="w-4 h-4" />
                        {airline}
                      </button>
                    ))}
                    {selectedAirlines.length > 0 && (
                      <button
                        onClick={() => setSelectedAirlines([])}
                        className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flight List */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              {filteredFlights.length === 0 ? (
                <div className="text-center py-16">
                  <Plane className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No matches found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search term
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedAirlines([]);
                      setNonstopOnly(false);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFlights.map((flight) => {
                    const isSelected = selectedFlight?.id === flight.id;
                    const priceDiff =
                      selectedFlight && flight.priceDiff !== undefined
                        ? flight.priceDiff
                        : selectedFlight
                        ? flight.price - selectedFlight.price
                        : 0;

                    return (
                      <button
                        key={flight.id}
                        onClick={() => handleSelectFlight(flight)}
                        className={cn(
                          "w-full p-4 sm:p-5 rounded-xl border text-left transition-all",
                          isSelected
                            ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
                            : "bg-card border-border/60 hover:border-primary/30 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Airline logo */}
                          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <Plane className="w-7 h-7 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">
                                  {flight.airline}
                                </p>
                                {flight.flightNumber && (
                                  <span className="text-xs text-muted-foreground">
                                    {flight.flightNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">
                                  ${flight.price}
                                </p>
                                {priceDiff !== 0 && !isSelected && (
                                  <p
                                    className={cn(
                                      "text-xs",
                                      priceDiff > 0
                                        ? "text-red-500"
                                        : "text-green-600"
                                    )}
                                  >
                                    {priceDiff > 0 ? "+" : ""}${priceDiff}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Flight times */}
                            <div className="mt-3 flex items-center gap-3">
                              <div className="text-lg font-medium text-foreground">
                                {flight.departTime}
                              </div>
                              <div className="flex flex-col items-center flex-1 min-w-0">
                                <span className="text-xs text-muted-foreground">
                                  {flight.duration}
                                </span>
                                <div className="flex items-center gap-1 w-full">
                                  <div className="flex-1 h-px bg-border" />
                                  <Plane className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <div className="flex-1 h-px bg-border" />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {flight.stops === 0
                                    ? "Nonstop"
                                    : `${flight.stops} stop${
                                        flight.stops > 1 ? "s" : ""
                                      }`}
                                  {flight.stopCity && ` (${flight.stopCity})`}
                                </span>
                              </div>
                              <div className="text-lg font-medium text-foreground">
                                {flight.arriveTime}
                              </div>
                            </div>

                            {/* Return times if available */}
                            {flight.returnDepartTime && (
                              <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-3">
                                <div className="text-sm font-medium text-muted-foreground">
                                  {flight.returnDepartTime}
                                </div>
                                <div className="flex items-center gap-1 flex-1">
                                  <div className="flex-1 h-px bg-border/60" />
                                  <span className="text-[10px] text-muted-foreground">
                                    Return
                                  </span>
                                  <div className="flex-1 h-px bg-border/60" />
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">
                                  {flight.returnArriveTime}
                                </div>
                              </div>
                            )}

                            {/* Tags and emissions */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {flight.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={
                                    tag === "Recommended"
                                      ? "default"
                                      : tag === "Cheapest" ||
                                        tag === "Budget"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className={cn(
                                    "text-xs",
                                    tag === "Recommended" &&
                                      "bg-primary/10 text-primary border-primary/20"
                                  )}
                                >
                                  {tag === "Recommended" && (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                  )}
                                  {tag}
                                </Badge>
                              ))}
                              {flight.co2Emissions && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                  <Leaf className="w-3 h-3" />
                                  {flight.co2Emissions}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Select button */}
                        {isSelected && (
                          <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between">
                            <span className="text-sm font-medium text-primary flex items-center gap-1.5">
                              <Check className="w-4 h-4" />
                              Currently selected
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// Helper functions
function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)h\s*(\d+)?m?/);
  if (match) {
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    return hours * 60 + minutes;
  }
  return 999;
}

function parseTime(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 999;
}
