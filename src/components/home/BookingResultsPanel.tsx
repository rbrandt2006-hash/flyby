import { useState } from "react";
import { hotelUnavailableMessage, type HotelSearchFailure } from "@/services/duffelStays";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel as HotelIcon, Car, MapPin, Calendar, X, ChevronDown, Sparkles, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Flight } from "@/components/flights/FlightResults";
import type { HotelOption } from "@/components/chats/booking/types";
import { FlightBookingModal } from "@/components/booking/FlightBookingModal";

export interface ParsedChips {
  fromCity?: string;
  fromCode?: string;
  toCity?: string;
  toCode?: string;
  dateLabel?: string;
  anchor?: string;
}

interface BookingResultsPanelProps {
  chips: ParsedChips;
  flights: Flight[];
  hotels: HotelOption[];
  onSelectFlight: (f: Flight) => void;
  onSelectHotel: (h: HotelOption) => void;
  onEditChip: () => void;
  /** Why live fares are missing, so the banner can say what actually happened. */
  flightNote?: "past_date" | "no_results" | "unreachable";
  hotelNote?: HotelSearchFailure;
  returnUnavailable?: boolean;
  onClose: () => void;
  reasons: { flight?: string; hotel?: string };
}

function WhyPicked({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Sparkles className="w-3 h-3" />
        Why I picked this
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-xs text-muted-foreground mt-1 leading-relaxed overflow-hidden"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BookingResultsPanel({
  chips,
  flights,
  hotels,
  onSelectFlight,
  onSelectHotel,
  onEditChip,
  flightNote,
  hotelNote,
  returnUnavailable,
  onClose,
  reasons,
}: BookingResultsPanelProps) {
  // Only flights from the live airline feed are ever shown. Real Duffel offers
  // have ids starting with "off_"; anything else was generated locally and
  // describes a flight that may not exist. Filtering here, at the point of
  // display, also covers conversations saved in the browser from before the
  // generated fallback was removed.
  const allFlights = flights;
  flights = allFlights.filter((f) => f.id.startsWith("off_"));
  const hidInvented = allFlights.length > 0 && flights.length === 0;
  const topFlight = flights[0];
  const topHotel = hotels[0];
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);

  // Why there's nothing to show, when there isn't. An older saved conversation
  // carries no reason, so it gets the "couldn't reach" explanation.
  const emptyReason = flightNote ?? (hidInvented ? "unreachable" : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto space-y-4"
    >
      {/* Parsed chips */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.fromCity && (
          <button onClick={onEditChip} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm">
            <Plane className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">From:</span>
            <span className="font-medium">{chips.fromCity} ({chips.fromCode})</span>
          </button>
        )}
        {chips.toCity && (
          <button onClick={onEditChip} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">{chips.toCity} ({chips.toCode})</span>
          </button>
        )}
        {chips.dateLabel && (
          <button onClick={onEditChip} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{chips.dateLabel}</span>
          </button>
        )}
        {chips.anchor && (
          <button onClick={onEditChip} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Near:</span>
            <span className="font-medium">{chips.anchor}</span>
          </button>
        )}
        <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto text-muted-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Flights */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Flights</h3>
          <Badge variant="secondary" className="text-xs">{flights.length}</Badge>
        </div>
        {returnUnavailable && flights.length > 0 && (
          <div className="px-4 py-2 text-xs text-warning bg-warning/5 border-b border-border">
            No airline is selling this as a round trip for your dates, so these are one-way fares for the
            outbound flight only. The flight home is not included and would need booking separately.
          </div>
        )}
        <CardContent className="p-0 divide-y divide-border">
          {flights.slice(0, 3).map((f, i) => (
            <div key={f.id} className="p-4 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{f.airline}</span>
                    <span className="text-xs text-muted-foreground">{f.flightNumber}</span>
                    {i === 0 && <Badge variant="secondary" className="text-xs">Top pick</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {f.departureTime} → {f.arrivalTime}{f.arriveDayOffset ? ` (+${f.arriveDayOffset} day${f.arriveDayOffset > 1 ? "s" : ""})` : ""} · {f.duration} · {f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}${f.stopCities?.length ? ` via ${f.stopCities.join(", ")}` : ""}`} · {f.origin}→{f.destination}
                  </p>
                  {f.tripType === "round_trip" && (
                    <p className="text-sm text-muted-foreground">
                      Back {f.returnFlightNumber}: {f.returnDepartureTime} → {f.returnArrivalTime}{f.returnArriveDayOffset ? ` (+${f.returnArriveDayOffset} day${f.returnArriveDayOffset > 1 ? "s" : ""})` : ""} · {f.returnDuration} · {f.returnStops === 0 ? "Nonstop" : `${f.returnStops} stop${(f.returnStops ?? 0) > 1 ? "s" : ""}${f.returnStopCities?.length ? ` via ${f.returnStopCities.join(", ")}` : ""}`} · {f.returnOrigin}→{f.returnDestination}
                      {f.returnDestination && f.returnDestination !== f.origin && (
                        <span className="text-warning"> · returns to {f.returnDestination}, not {f.origin}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">${f.price}</p>
                  <p className="text-[11px] text-muted-foreground">{f.tripType === "round_trip" ? "round trip" : "one way"}</p>
                  <div className="flex items-center gap-1.5 mt-1 justify-end">
                    <Button size="sm" variant={f.id.startsWith("off_") ? "outline" : "default"} onClick={() => onSelectFlight(f)}>Select</Button>
                    {/* Real Duffel offers can be booked directly. */}
                    {f.id.startsWith("off_") && (
                      <Button size="sm" onClick={() => setBookingFlight(f)}>Book</Button>
                    )}
                  </div>
                </div>
              </div>
              {i === 0 && reasons.flight && <WhyPicked text={reasons.flight} />}
            </div>
          ))}
          {flights.length === 0 && (
            <div className="p-6 text-sm text-center space-y-1">
              <p className="font-medium">
                {emptyReason === "past_date"
                  ? "That departure date has already passed"
                  : emptyReason === "no_results"
                    ? "No flights on sale for this route and date"
                    : emptyReason === "unreachable"
                      ? "Can't reach live flight search right now"
                      : "No flights found"}
              </p>
              <p className="text-muted-foreground">
                {emptyReason === "past_date"
                  ? "Pick a future date to see real, bookable flights."
                  : emptyReason === "no_results"
                    ? "Try nearby dates or a different airport."
                    : emptyReason === "unreachable"
                      ? "Flyby only shows real flights from the airlines, so there's nothing to show until the connection is back. Some school and office networks block the flight provider — another network or a hotspot usually fixes it."
                      : "Try different dates or airports."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* When there are no real hotels to offer, say so here rather than letting
          the hotel step silently not appear. */}
      {flights.length > 0 && hotels.length === 0 && hotelNote && hotelNote !== "day_trip" && (
        <p className="text-xs text-muted-foreground px-1">{hotelUnavailableMessage(hotelNote)}</p>
      )}

      {/* Hotels are intentionally NOT shown in this initial
          panel. The trip flow is flight-first: selecting a flight opens the
          dedicated hotel step (HotelSelectionPage), then the confirm/refine step.
          Listing hotels here let people pick one before a flight and skip that
          step, which was confusing. Flights only here keeps the flow clear. */}

      <FlightBookingModal
        open={bookingFlight !== null}
        onOpenChange={(open) => { if (!open) setBookingFlight(null); }}
        flight={bookingFlight}
      />
    </motion.div>
  );
}
