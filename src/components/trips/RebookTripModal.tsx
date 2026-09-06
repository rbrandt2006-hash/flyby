import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plane, Loader2, Check, Search, ArrowRight, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { LocalTrip } from "@/hooks/useTrips";
import type { Flight } from "@/components/flights/FlightResults";
import { searchRealFlights } from "@/services/duffelFlights";
import { generateMockFlights } from "@/services/mockFlightService";
import { findAirports } from "@/data/globalAirports";

/**
 * Rebook a trip you already planned in Flyby.
 *
 * The point is convenience: the trip already knows its route and dates, so this
 * re-runs a live flight search for exactly that itinerary and lets you swap the
 * flight in one click — nothing to re-type.
 *
 * Trips created before the route was stored won't have airport codes, so the
 * origin falls back to an editable field rather than failing.
 */

interface RebookTripModalProps {
  trip: LocalTrip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Applies the new flight to the trip (useTrips -> rebookTrip). */
  onRebook: (
    tripId: string,
    flight: { airline: string; flightNumber?: string; departTime: string; arrivalTime?: string; price: number },
  ) => void;
}

const toISODate = (value: string) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Best-effort airport code for a destination like "London, United Kingdom". */
const codeForPlace = (place: string): string => {
  if (!place) return "";
  const matches = findAirports(place.split(",")[0].trim());
  return matches[0]?.code || "";
};

export function RebookTripModal({ trip, open, onOpenChange, onRebook }: RebookTripModalProps) {
  const [origin, setOrigin] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [searched, setSearched] = useState(false);

  const destination = useMemo(
    () => trip?.flight?.arrivalAirport || codeForPlace(trip?.destination || ""),
    [trip],
  );
  const departureDate = useMemo(() => toISODate(trip?.startDate || ""), [trip]);
  const currentPrice = trip?.flight?.price ?? 0;

  // Prefill the origin from the flight that was originally booked.
  useEffect(() => {
    if (!open || !trip) return;
    setOrigin(trip.flight?.departureAirport || "");
    setFlights([]);
    setSearched(false);
  }, [open, trip]);

  const runSearch = useCallback(async () => {
    if (!trip) return;
    const from = origin.trim().toUpperCase();
    if (!from || !destination || !departureDate) return;

    setLoading(true);
    setSearched(true);
    try {
      const real = await searchRealFlights({
        origin: from,
        destination,
        departureDate,
        passengers: 1,
        cabinClass: trip.flight?.cabinClass || "economy",
      });
      if (real && real.length > 0) {
        setIsLive(true);
        setFlights(real);
      } else {
        // Duffel unavailable — show clearly-labelled estimates rather than nothing.
        setIsLive(false);
        setFlights(generateMockFlights(from, destination, "economy", 1));
      }
    } finally {
      setLoading(false);
    }
  }, [trip, origin, destination, departureDate]);

  // Search as soon as the trip already knows its route.
  useEffect(() => {
    if (open && trip && origin && destination && departureDate && !searched) {
      runSearch();
    }
  }, [open, trip, origin, destination, departureDate, searched, runSearch]);

  const handlePick = (f: Flight) => {
    if (!trip) return;
    onRebook(trip.id, {
      airline: f.airline,
      flightNumber: f.flightNumber,
      departTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      price: f.price,
    });
    toast.success("Trip rebooked", {
      description: `${f.airline} ${f.flightNumber} · departs ${f.departureTime}`,
    });
    onOpenChange(false);
  };

  if (!trip) return null;

  const dateLabel = (() => {
    const d = new Date(trip.startDate);
    return isNaN(d.getTime()) ? trip.startDate : format(d, "EEE, MMM d");
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Rebook this trip
          </DialogTitle>
          <DialogDescription>
            {trip.destination} · {dateLabel}
            {trip.flight?.airline ? ` · currently on ${trip.flight.airline}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Route — editable origin so older trips (no stored route) still work */}
        <div className="flex items-end gap-3 rounded-xl border border-border/60 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="SAN"
              maxLength={3}
              className="w-24 uppercase"
            />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground mb-3" />
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input value={destination} readOnly className="w-24 uppercase bg-muted/50" />
          </div>
          <Button onClick={runSearch} disabled={loading || !origin.trim()} className="ml-auto gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search flights
          </Button>
        </div>

        {!isLive && flights.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Couldn't reach live flight search, so these are approximate fares — times and
              prices may differ, and they can't be booked.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {loading && (
            <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Searching flights for {origin || "…"} → {destination}…</p>
            </div>
          )}

          {!loading && searched && flights.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No flights found for {origin} → {destination} on {dateLabel}. Try a different
              departure airport.
            </div>
          )}

          {!loading &&
            flights.slice(0, 8).map((f, i) => {
              const diff = currentPrice ? f.price - currentPrice : 0;
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{f.airline}</span>
                      <span className="text-xs text-muted-foreground">{f.flightNumber}</span>
                      {i === 0 && <Badge variant="secondary" className="text-xs">Best match</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {f.departureTime} → {f.arrivalTime} · {f.duration} ·{" "}
                      {f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">${f.price.toLocaleString()}</p>
                    {currentPrice > 0 && diff !== 0 && (
                      <p
                        className={cn(
                          "text-xs",
                          diff < 0 ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {diff < 0 ? `$${Math.abs(diff)} cheaper` : `$${diff} more`}
                      </p>
                    )}
                    <Button size="sm" className="mt-1 gap-1" onClick={() => handlePick(f)}>
                      <Check className="w-3.5 h-3.5" />
                      Rebook
                    </Button>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
