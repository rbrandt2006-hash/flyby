import { useState } from "react";
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
import type { GroundTransportOption } from "@/services/mockGroundTransportService";

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
  ground: GroundTransportOption[];
  onSelectFlight: (f: Flight) => void;
  onSelectHotel: (h: HotelOption) => void;
  onEditChip: () => void;
  /** Why live fares are missing, so the banner can say what actually happened. */
  flightNote?: "past_date" | "no_results" | "unreachable";
  onClose: () => void;
  reasons: { flight?: string; hotel?: string; ground?: string };
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
  ground,
  onSelectFlight,
  onSelectHotel,
  onEditChip,
  flightNote,
  onClose,
  reasons,
}: BookingResultsPanelProps) {
  const topFlight = flights[0];
  const topHotel = hotels[0];
  const topGround = ground[0];
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);

  // Real Duffel offers have ids starting with "off_" and can be booked. If none
  // do, these are estimated fares from the local fallback (live search couldn't
  // be reached) — say so rather than passing them off as bookable live prices.
  const flightsAreEstimates = flights.length > 0 && !flights.some((f) => f.id.startsWith("off_"));

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
          {flightsAreEstimates && (
            <Badge variant="outline" className="text-xs border-warning/40 text-warning ml-auto">Estimated fares</Badge>
          )}
        </div>
        {flightsAreEstimates && (
          <div className="px-4 py-2 text-xs text-muted-foreground bg-warning/5 border-b border-border">
            {flightNote === "past_date"
              ? "That departure date has already passed, so live fares can't be searched. Pick a future date to see real, bookable flights — the fares below are estimates."
              : flightNote === "no_results"
                ? "No live fares came back for this route on these dates, so the fares below are estimates — they can't be booked. Try nearby dates or a different airport."
                : "Couldn't reach live flight search, so these are approximate fares — times and prices may differ, and they can't be booked. Try again when you're back online."}
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
                    {f.departureTime} → {f.arrivalTime} · {f.duration} · {f.stops === 0 ? "Nonstop" : `${f.stops} stop`} · {f.origin}→{f.destination}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">${f.price}</p>
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
            <div className="p-6 text-sm text-muted-foreground text-center">No flights found.</div>
          )}
        </CardContent>
      </Card>

      {/* Hotels and ground transport are intentionally NOT shown in this initial
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
