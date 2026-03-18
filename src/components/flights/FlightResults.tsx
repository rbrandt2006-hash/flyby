import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Clock, ArrowRight, Briefcase, Leaf } from "lucide-react";
import { format } from "date-fns";

export interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopCity?: string;
  price: number;
  cabinClass: string;
  origin: string;
  destination: string;
  co2Emissions: string;
  isLowest?: boolean;
  isFastest?: boolean;
}

interface FlightResultsProps {
  flights: Flight[];
  departureDate: Date;
  returnDate?: Date;
  tripType: string;
  passengers: number;
  selectingFlightId?: string | null;
  onSelect: (flight: Flight) => void | Promise<void>;
  onBack: () => void;
}

export function FlightResults({ 
  flights, 
  departureDate, 
  returnDate, 
  tripType, 
  passengers,
  selectingFlightId,
  onSelect,
  onBack 
}: FlightResultsProps) {
  const sortedFlights = [...flights].sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          ← Back to search
        </Button>
        <p className="text-sm text-muted-foreground">
          {sortedFlights.length} flights found
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <span className="font-medium">{flights[0]?.origin}</span>
          <ArrowRight className="w-4 h-4" />
          <span className="font-medium">{flights[0]?.destination}</span>
          <span className="text-muted-foreground mx-2">•</span>
          <span className="text-muted-foreground">
            {format(departureDate, "EEE, MMM d")}
            {tripType === "roundtrip" && returnDate && ` - ${format(returnDate, "EEE, MMM d")}`}
          </span>
          <span className="text-muted-foreground mx-2">•</span>
          <span className="text-muted-foreground">
            {passengers} {passengers === 1 ? "passenger" : "passengers"}
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {sortedFlights.map((flight) => {
          const isSelecting = selectingFlightId === flight.id;

          return (
            <Card 
              key={flight.id} 
              className="p-4 transition-colors cursor-pointer hover:border-primary/50"
              onClick={() => !isSelecting && onSelect(flight)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">
                    {flight.airlineLogo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{flight.airline}</span>
                      <span className="text-xs text-muted-foreground">{flight.flightNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-lg font-medium text-foreground">{flight.departureTime}</div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">{flight.duration}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-px bg-border" />
                          <Plane className="w-3 h-3 text-muted-foreground" />
                          <div className="w-16 h-px bg-border" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          {flight.stopCity && ` (${flight.stopCity})`}
                        </span>
                      </div>
                      <div className="text-lg font-medium text-foreground">{flight.arrivalTime}</div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {flight.isLowest && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Lowest
                      </Badge>
                    )}
                    {flight.isFastest && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Fastest
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground">${flight.price}</div>
                  <div className="text-xs text-muted-foreground">{tripType === "roundtrip" ? "round trip" : "one way"}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                    <Leaf className="w-3 h-3" />
                    {flight.co2Emissions}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="w-3 h-3" />
                  {flight.cabinClass}
                </div>
                <Button
                  size="sm"
                  className="ml-auto"
                  disabled={isSelecting}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isSelecting) {
                      void onSelect(flight);
                    }
                  }}
                >
                  {isSelecting ? "Selecting..." : "Select Flight"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
