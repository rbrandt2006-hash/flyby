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
  onClose,
  reasons,
}: BookingResultsPanelProps) {
  const topFlight = flights[0];
  const topHotel = hotels[0];
  const topGround = ground[0];

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
                  <Button size="sm" variant="default" className="mt-1" onClick={() => onSelectFlight(f)}>Select</Button>
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

      {/* Hotels */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <HotelIcon className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Hotels</h3>
          <Badge variant="secondary" className="text-xs">{hotels.length}</Badge>
          {chips.anchor && (
            <span className="text-xs text-muted-foreground ml-auto">Sorted by distance to {chips.anchor}</span>
          )}
        </div>
        <CardContent className="p-0 divide-y divide-border">
          {hotels.slice(0, 3).map((h, i) => (
            <div key={h.id} className="p-4 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{h.name}</span>
                    {i === 0 && <Badge variant="secondary" className="text-xs">Top pick</Badge>}
                    {h.tags.slice(0, 2).map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{h.area}</span>
                    <span>·</span>
                    <span>{h.distanceToVenue} away</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" />{h.rating}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">${h.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/night</span></p>
                  <Button size="sm" variant="outline" className="mt-1" onClick={() => onSelectHotel(h)}>Select</Button>
                </div>
              </div>
              {i === 0 && reasons.hotel && <WhyPicked text={reasons.hotel} />}
            </div>
          ))}
          {hotels.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">No hotels found.</div>
          )}
        </CardContent>
      </Card>

      {/* Ground transport */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Car className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Ground transport</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {chips.toCode} airport → hotel
          </span>
        </div>
        <CardContent className="p-0 divide-y divide-border">
          {ground.slice(0, 3).map((g, i) => (
            <div key={g.id} className="p-4 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{g.provider} {g.rideType}</span>
                    {i === 0 && <Badge variant="secondary" className="text-xs">Top pick</Badge>}
                    {g.tags.slice(0, 1).map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {g.description} · ETA {g.eta} · {g.seats} seats
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">${g.priceMin}–${g.priceMax}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">estimate</p>
                </div>
              </div>
              {i === 0 && reasons.ground && <WhyPicked text={reasons.ground} />}
            </div>
          ))}
          {ground.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">No ground options.</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
