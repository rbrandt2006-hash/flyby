import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Plane, Hotel, Car, Star, MapPin, Clock, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTravelSearch, SearchFlightResult, SearchHotelResult, SearchGroundResult } from "@/hooks/useTravelSearch";

interface SearchTabContentProps {
  activeCategory: string;
  destination: string;
  onSelectFlight?: (flight: SearchFlightResult) => void;
  onSelectHotel?: (hotel: SearchHotelResult) => void;
  onSelectGround?: (ground: SearchGroundResult) => void;
  selectedFlightId?: string;
  selectedHotelId?: string;
  selectedGroundId?: string;
}

export function SearchTabContent({
  activeCategory,
  destination,
  onSelectFlight,
  onSelectHotel,
  onSelectGround,
  selectedFlightId,
  selectedHotelId,
  selectedGroundId,
}: SearchTabContentProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, clearResults, results, isSearching, error } = useTravelSearch();

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Trigger search when query changes
  useEffect(() => {
    const searchType = activeCategory === "flights" 
      ? "flights" 
      : activeCategory === "hotels" 
        ? "hotels" 
        : activeCategory === "ground" 
          ? "ground" 
          : "all";

    search({
      query,
      type: searchType as any,
      city: destination,
      dest: destination.slice(0, 3).toUpperCase(),
    });
  }, [query, activeCategory, destination, search]);

  const handleClear = () => {
    setQuery("");
    clearResults();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  const hasResults = results.flights.length > 0 || results.hotels.length > 0 || results.ground.length > 0;
  const showGroupedResults = activeCategory === "search" || !activeCategory;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search flights, hotels, or ground transportation"
          className="pl-10 pr-10 h-12 text-base"
          aria-label="Search travel options"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!query && !hasResults && !isSearching && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Start typing to search your trip options</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Search by city, hotel name, airline, or keyword
          </p>
        </div>
      )}

      {/* No Results State */}
      {query && !hasResults && !isSearching && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No results found for "{query}"</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try a different search term
          </p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Flights Section */}
            {results.flights.length > 0 && (activeCategory === "flights" || activeCategory === "search" || !activeCategory) && (
              <section>
                {showGroupedResults && (
                  <div className="flex items-center gap-2 mb-3">
                    <Plane className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Flights</h3>
                    <Badge variant="secondary" className="text-xs">{results.flights.length}</Badge>
                  </div>
                )}
                <div className="space-y-2">
                  {results.flights.slice(0, showGroupedResults ? 5 : 20).map((flight) => (
                    <FlightResultCard
                      key={flight.id}
                      flight={flight}
                      isSelected={selectedFlightId === flight.id}
                      onSelect={() => onSelectFlight?.(flight)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Hotels Section */}
            {results.hotels.length > 0 && (activeCategory === "hotels" || activeCategory === "search" || !activeCategory) && (
              <section>
                {showGroupedResults && (
                  <div className="flex items-center gap-2 mb-3">
                    <Hotel className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Hotels</h3>
                    <Badge variant="secondary" className="text-xs">{results.hotels.length}</Badge>
                  </div>
                )}
                <div className="space-y-2">
                  {results.hotels.slice(0, showGroupedResults ? 5 : 20).map((hotel) => (
                    <HotelResultCard
                      key={hotel.id}
                      hotel={hotel}
                      isSelected={selectedHotelId === hotel.id}
                      onSelect={() => onSelectHotel?.(hotel)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ground Section */}
            {results.ground.length > 0 && (activeCategory === "ground" || activeCategory === "search" || !activeCategory) && (
              <section>
                {showGroupedResults && (
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Ground Transport</h3>
                    <Badge variant="secondary" className="text-xs">{results.ground.length}</Badge>
                  </div>
                )}
                <div className="space-y-2">
                  {results.ground.map((ground) => (
                    <GroundResultCard
                      key={ground.id}
                      ground={ground}
                      isSelected={selectedGroundId === ground.id}
                      onSelect={() => onSelectGround?.(ground)}
                    />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Flight Result Card
function FlightResultCard({ 
  flight, 
  isSelected, 
  onSelect 
}: { 
  flight: SearchFlightResult; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border-2 cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30"
      )}
    >
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{flight.airlineLogo}</span>
            <p className="font-semibold">{flight.airline}</p>
            {flight.flightNumber && (
              <span className="text-xs text-muted-foreground">{flight.flightNumber}</span>
            )}
            {flight.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {flight.departTime} → {flight.arriveTime}
            </span>
            <span>{flight.duration}</span>
            <span>{flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-lg font-bold">${flight.price}</p>
          <p className="text-xs text-muted-foreground">per person</p>
          {isSelected && (
            <Check className="w-5 h-5 text-primary mt-1" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hotel Result Card
function HotelResultCard({ 
  hotel, 
  isSelected, 
  onSelect 
}: { 
  hotel: SearchHotelResult; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border-2 cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30"
      )}
    >
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{hotel.name}</p>
            {hotel.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {hotel.area}
            </span>
            <span>{hotel.distanceToVenue} to center</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-warning text-warning" />
              {hotel.rating} ({hotel.reviewCount.toLocaleString()} reviews)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {hotel.amenities.slice(0, 4).map(amenity => (
              <span key={amenity} className="bg-muted px-2 py-0.5 rounded">{amenity}</span>
            ))}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-lg font-bold">${hotel.pricePerNight}</p>
          <p className="text-xs text-muted-foreground">per night</p>
          {isSelected && (
            <Check className="w-5 h-5 text-primary mt-1" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Ground Transport Result Card
function GroundResultCard({ 
  ground, 
  isSelected, 
  onSelect 
}: { 
  ground: SearchGroundResult; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border-2 cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30"
      )}
    >
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{ground.provider}</p>
            <Badge variant="outline" className="text-xs">{ground.type}</Badge>
            {ground.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{ground.description}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-lg font-bold">${ground.price}</p>
          <p className="text-xs text-muted-foreground">each way</p>
          {isSelected && (
            <Check className="w-5 h-5 text-primary mt-1" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
