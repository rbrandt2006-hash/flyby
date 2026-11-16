import { useState } from "react";
import { hotelUnavailableMessage, type HotelSearchFailure } from "@/services/duffelStays";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel as HotelIcon, Car, MapPin, Calendar, X, ChevronDown, Sparkles, Star, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Flight } from "@/components/flights/FlightResults";
import type { HotelOption } from "@/components/chats/booking/types";
import { FlightBookingModal } from "@/components/booking/FlightBookingModal";
import { UnitedHandoff } from "@/components/flights/UnitedHandoff";
import { UNITED, type ExternalBooking, type HandoffSearch } from "@/services/airlineHandoff";
import type { DateHint, FlightAdvice, RankingSummary } from "@/services/duffelFlights";

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
  /** The search to hand to united.com, when United can't be shown here. */
  handoff?: HandoffSearch;
  onAddExternalBooking?: (search: HandoffSearch, booking: ExternalBooking) => void | Promise<void>;
  /** Why the first flight is the pick. Shown only while it still is the first flight. */
  advice?: FlightAdvice;
  /** What the ranking required of a flight, and anything it couldn't satisfy. */
  ranking?: RankingSummary;
  /** Other dates that cost meaningfully less, when Flyby chose the dates itself. */
  dateHint?: DateHint;
  onUseDates?: (hint: DateHint) => void;
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

/**
 * The recommendation: one line on why this flight, the reasons behind it, and
 * what the traveler gives up by taking it. Says who made the call — Flyby AI
 * (Gemini, choosing among the top-ranked real flights) or the ranking alone.
 */
export function PickAdvice({ advice }: { advice: FlightAdvice }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left"
      >
        <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {advice.engine === "gemini" ? "Flyby AI recommends" : "Why this flight"}
          </span>
          <span className="block text-sm font-medium text-foreground">{advice.headline}</span>
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 mt-1 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-2 space-y-1 pl-[22px] text-xs leading-relaxed text-muted-foreground list-disc marker:text-primary/50">
              {advice.why.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            {advice.tradeoff && (
              <p className="mt-2 pl-[22px] text-xs leading-relaxed text-foreground/80">
                <span className="font-medium">Worth knowing:</span> {advice.tradeoff}
              </p>
            )}
            {advice.tip && (
              <p className="mt-1 pl-[22px] text-xs leading-relaxed text-muted-foreground">{advice.tip}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * "You didn't give dates — these other dates are $315 less."
 *
 * Shown only when Flyby picked the dates itself and a real search of nearby
 * dates found the same trip for meaningfully less. Both prices are real fares
 * from the same moment; the button searches those dates properly.
 */
export function DateHintRow({ hint, shownDates, onUse, busy }: {
  hint: DateHint;
  /** The dates currently shown, e.g. "Nov 22 – 25". */
  shownDates?: string;
  onUse?: (hint: DateHint) => void;
  busy?: boolean;
}) {
  const { option } = hint;
  const stops = (n?: number | null) => (n === 0 ? "nonstop" : n == null ? "" : `${n} stop${n > 1 ? "s" : ""}`);
  const both = option.returnStops != null && option.returnStops !== option.stops
    ? `${stops(option.stops)} out, ${stops(option.returnStops)} back`
    : stops(option.stops);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-success/25 bg-success/[0.06] p-3">
      <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-success" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">
          {hint.label} is ${Math.round(hint.saving).toLocaleString()} cheaper
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You didn't give dates, so Flyby suggested {shownDates || "these"}. The same trip {hint.label} is currently $
          {Math.round(option.price).toLocaleString()}{option.airline ? ` on ${option.airline}` : ""}{both ? `, ${both}` : ""}.
        </p>
      </div>
      {onUse && (
        <Button size="sm" variant="outline" className="shrink-0" disabled={busy} onClick={() => onUse(hint)}>
          Use {hint.label}
        </Button>
      )}
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
  handoff,
  onAddExternalBooking,
  advice,
  ranking,
  dateHint,
  onUseDates,
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

      {flights.length > 0 && dateHint && (
        <DateHintRow hint={dateHint} shownDates={chips.dateLabel} onUse={onUseDates} />
      )}

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
        {/* What the trip required of a flight, and anything no flight could meet. */}
        {flights.length > 0 && ranking && (ranking.requirements.length > 0 || ranking.notes.length > 0) && (
          <div className="px-4 py-2 text-xs border-b border-border space-y-1">
            {ranking.requirements.length > 0 && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground/80">Ranked for:</span> {ranking.requirements.join(" · ")}
              </p>
            )}
            {ranking.notes.map((note) => (
              <p key={note} className="text-warning flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
                <span>{note}</span>
              </p>
            ))}
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
                    {/* "Best overall" is the top pick, already labelled. */}
                    {(f.ranking?.badges ?? []).filter((b) => b !== "Best overall").map((badge) => (
                      <Badge key={badge} variant="outline" className="text-xs font-normal">{badge}</Badge>
                    ))}
                    {f.fareBrand && <span className="text-xs text-muted-foreground">· {f.fareBrand}</span>}
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
                  {/* A requirement this flight misses, in the ranking's own words. */}
                  {(f.ranking?.issues ?? []).map((issue) => (
                    <p key={issue} className="text-xs text-destructive mt-1 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
                      <span>{issue}</span>
                    </p>
                  ))}
                  {/* For the alternatives, the one drawback that explains why they aren't the pick. */}
                  {i > 0 && f.ranking && f.ranking.issues.length === 0 && f.ranking.notes[0] && (
                    <p className="text-xs text-muted-foreground mt-1">{f.ranking.notes[0]}</p>
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
              {i === 0 && (advice && advice.pickId === f.id
                ? <PickAdvice advice={advice} />
                : reasons.flight && !advice && <WhyPicked text={reasons.flight} />)}
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

      {/* United isn't sold through the flight provider. If that ever changes and
          United fares appear above, this steps aside. */}
      {handoff && onAddExternalBooking && emptyReason !== "past_date"
        && !flights.some((f) => f.airline === UNITED.name || f.flightNumber.startsWith(UNITED.code)) && (
        <UnitedHandoff search={handoff} onAddBooking={onAddExternalBooking} />
      )}

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
