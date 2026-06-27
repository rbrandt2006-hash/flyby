import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Hotel, ClipboardCheck, Check, CalendarIcon, Search, Star, MapPin } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import { FlightSearchDialog, type FlightSelectionDraft } from "@/components/flights/FlightSearchDialog";
import { CompanyPicker } from "@/components/trips/CompanyPicker";
import type { ClientCompany } from "@/hooks/useCompanies";
import { toast } from "sonner";

export interface HotelSelection {
  id: string;
  name: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  distance?: string;
  checkIn: string; // yyyy-MM-dd
  checkOut: string;
  guests: number;
  rooms: number;
  destination: string;
  near?: string;
  nights: number;
}

export interface NewTripWizardResult {
  flight: FlightSelectionDraft;
  hotel: HotelSelection | null;
  clientCompany: ClientCompany | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: NewTripWizardResult) => void;
}

type Step = 1 | 2 | 3;

const HOTEL_BRANDS = [
  { name: "The Grand Plaza", rating: 5, basePrice: 389 },
  { name: "Hyatt Regency Downtown", rating: 4, basePrice: 279 },
  { name: "Marriott Courtyard", rating: 4, basePrice: 219 },
  { name: "Hilton Garden Inn", rating: 4, basePrice: 199 },
  { name: "Holiday Inn Express", rating: 3, basePrice: 149 },
  { name: "Kimpton Boutique Hotel", rating: 5, basePrice: 349 },
];

function deriveCity(destination: string): string {
  if (!destination) return "";
  // Strip airport codes / parentheticals
  const cleaned = destination.replace(/\([^)]*\)/g, "").trim();
  // If "City, ST" or "City — XXX", take first segment
  return cleaned.split(/[,—–-]/)[0].trim();
}

function generateHotels(destination: string, nights: number, near?: string): HotelSelection[] {
  return HOTEL_BRANDS.slice(0, 5).map((h, i) => {
    const variance = (i - 2) * 12;
    const ppn = Math.max(99, h.basePrice + variance);
    return {
      id: `hotel_${i}_${Date.now()}`,
      name: `${h.name} ${destination ? `— ${destination}` : ""}`.trim(),
      rating: h.rating,
      pricePerNight: ppn,
      totalPrice: ppn * Math.max(1, nights),
      distance: near ? `${(0.3 + i * 0.4).toFixed(1)} mi from ${near}` : `${(0.2 + i * 0.3).toFixed(1)} mi from city center`,
      checkIn: "",
      checkOut: "",
      guests: 1,
      rooms: 1,
      destination,
      near,
      nights,
    };
  });
}

export function NewTripWizard({ open, onOpenChange, onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [flight, setFlight] = useState<FlightSelectionDraft | null>(null);
  const [hotel, setHotel] = useState<HotelSelection | null>(null);
  const [clientCompany, setClientCompany] = useState<ClientCompany | null>(null);

  // Step 2 form state
  const [hotelDestination, setHotelDestination] = useState("");
  const [hotelDestinationTouched, setHotelDestinationTouched] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState("1");
  const [rooms, setRooms] = useState("1");
  const [near, setNear] = useState("");
  const [hotelResults, setHotelResults] = useState<HotelSelection[]>([]);
  const [searchingHotels, setSearchingHotels] = useState(false);

  const [discardOpen, setDiscardOpen] = useState(false);

  const flightCity = useMemo(() => (flight ? deriveCity(flight.destination) : ""), [flight]);

  // Auto-prefill hotel destination from flight when it changes (unless user edited)
  useEffect(() => {
    if (!hotelDestinationTouched && flightCity) {
      setHotelDestination(flightCity);
    }
  }, [flightCity, hotelDestinationTouched]);

  // Prefill check-in/out from flight dates when first entering step 2
  useEffect(() => {
    if (step === 2 && flight) {
      if (!checkIn) setCheckIn(new Date(flight.departureDate));
      if (!checkOut) setCheckOut(new Date(flight.returnDate));
    }
  }, [step, flight, checkIn, checkOut]);

  const resetAll = () => {
    setStep(1);
    setFlight(null);
    setHotel(null);
    setClientCompany(null);
    setHotelDestination("");
    setHotelDestinationTouched(false);
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests("1");
    setRooms("1");
    setNear("");
    setHotelResults([]);
  };

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen && (flight || hotel)) {
      setDiscardOpen(true);
      return;
    }
    if (!nextOpen) resetAll();
    onOpenChange(nextOpen);
  };

  const confirmDiscard = () => {
    setDiscardOpen(false);
    resetAll();
    onOpenChange(false);
  };

  const handleFlightSelected = (selection: FlightSelectionDraft) => {
    setFlight(selection);
    setStep(2);
  };

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(1, differenceInCalendarDays(checkOut, checkIn));
  }, [checkIn, checkOut]);

  const handleSearchHotels = async () => {
    if (!hotelDestination || !checkIn || !checkOut) return;
    setSearchingHotels(true);
    await new Promise((r) => setTimeout(r, 700));
    setHotelResults(generateHotels(hotelDestination, nights, near || undefined));
    setSearchingHotels(false);
  };

  const handleSelectHotel = (h: HotelSelection) => {
    if (!checkIn || !checkOut) return;
    const selected: HotelSelection = {
      ...h,
      checkIn: format(checkIn, "yyyy-MM-dd"),
      checkOut: format(checkOut, "yyyy-MM-dd"),
      guests: parseInt(guests),
      rooms: parseInt(rooms),
      nights,
    };
    setHotel(selected);
    setStep(3);
    toast.success("Hotel selected", { description: h.name });
  };

  const handleSkipHotel = () => {
    setHotel(null);
    setStep(3);
  };

  const handleConfirmTrip = () => {
    if (!flight) return;
    onComplete({ flight, hotel, clientCompany });
    resetAll();
    onOpenChange(false);
  };

  const stepTitle = step === 1 ? "Search Flights" : step === 2 ? "Search Hotels" : "Review your trip";
  const tripTotal = (flight?.flight.price ?? 0) + (hotel?.totalPrice ?? 0);

  return (
    <>
      <Dialog open={open} onOpenChange={handleRequestClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plane className="w-5 h-5 text-primary" />
              {stepTitle}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <StepIndicator
            step={step}
            onJump={(s) => {
              if (s < step) setStep(s);
            }}
          />

          {step === 1 && (
            <FlightSearchDialog
              open={true}
              onOpenChange={() => {}}
              embedded
              initialSelection={flight}
              onFlightSelected={handleFlightSelected}
            />
          )}

          {step === 2 && (
            <div className="space-y-5 py-2">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Destination (city or hotel name)</Label>
                <Input
                  value={hotelDestination}
                  onChange={(e) => {
                    setHotelDestination(e.target.value);
                    setHotelDestinationTouched(true);
                  }}
                  placeholder="e.g., New York"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Check-in</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full h-11 justify-start text-left font-normal", !checkIn && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "EEE, MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus className="pointer-events-auto" disabled={(d) => d < new Date(new Date().toDateString())} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Check-out</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full h-11 justify-start text-left font-normal", !checkOut && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "EEE, MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus className="pointer-events-auto" disabled={(d) => d < (checkIn || new Date())} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Guests</Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Guest" : "Guests"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Rooms</Label>
                  <Select value={rooms} onValueChange={setRooms}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Room" : "Rooms"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Near (optional)</Label>
                <Input
                  value={near}
                  onChange={(e) => setNear(e.target.value)}
                  placeholder="e.g., near the Chase Bank building"
                />
              </div>

              <Button
                onClick={handleSearchHotels}
                className="w-full h-12 text-base"
                disabled={!hotelDestination || !checkIn || !checkOut || searchingHotels}
              >
                {searchingHotels ? (
                  <><div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />Searching...</>
                ) : (
                  <><Search className="w-5 h-5 mr-2" />Search Hotels</>
                )}
              </Button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  ← Back to flight
                </button>
                <button
                  type="button"
                  onClick={handleSkipHotel}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Skip — I don't need a hotel for this trip
                </button>
              </div>

              {hotelResults.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  {hotelResults.map((h) => (
                    <div key={h.id} className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:border-primary/40 transition-smooth">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Hotel className="w-4 h-4 text-primary" />
                          <span className="font-medium truncate">{h.name}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: h.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        {h.distance && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {h.distance}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">${h.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/night</span></div>
                        <div className="text-xs text-muted-foreground">${h.totalPrice} total · {nights} {nights === 1 ? "night" : "nights"}</div>
                        <Button size="sm" className="mt-2" onClick={() => handleSelectHotel(h)}>Select Hotel</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && flight && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <Plane className="w-4 h-4 text-primary" /> Flight
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline">Edit</button>
                </div>
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  <div>{flight.flight.airline} · {flight.flight.flightNumber} · <span className="capitalize">{flight.flight.cabinClass}</span></div>
                  <div>{flight.origin} → {flight.destination}</div>
                  <div>{format(new Date(flight.departureDate), "MMM d, yyyy")} – {format(new Date(flight.returnDate), "MMM d, yyyy")}</div>
                </div>
                <div className="mt-2 text-right font-semibold">${flight.flight.price}</div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <Hotel className="w-4 h-4 text-primary" /> Hotel
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs text-primary hover:underline">Edit</button>
                </div>
                {hotel ? (
                  <>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div>{hotel.name}</div>
                      <div>{format(new Date(hotel.checkIn), "MMM d")} – {format(new Date(hotel.checkOut), "MMM d, yyyy")}</div>
                      <div>{hotel.rooms} {hotel.rooms === 1 ? "room" : "rooms"} · {hotel.guests} {hotel.guests === 1 ? "guest" : "guests"} · {hotel.nights} {hotel.nights === 1 ? "night" : "nights"}</div>
                    </div>
                    <div className="mt-2 text-right font-semibold">${hotel.totalPrice}</div>
                  </>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">No hotel — day trip</div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="text-sm text-muted-foreground">Trip total</div>
                <div className="text-xl font-semibold">${tripTotal.toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={handleConfirmTrip}>Confirm trip</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              Your selected flight{hotel ? " and hotel" : ""} won't be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StepIndicator({ step, onJump }: { step: Step; onJump: (s: Step) => void }) {
  const steps: { n: Step; label: string; icon: React.ReactNode }[] = [
    { n: 1, label: "Flight", icon: <Plane className="w-3.5 h-3.5" /> },
    { n: 2, label: "Hotel", icon: <Hotel className="w-3.5 h-3.5" /> },
    { n: 3, label: "Review & Confirm", icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="flex items-center gap-2 pb-2 pt-1">
      {steps.map((s, i) => {
        const isDone = step > s.n;
        const isCurrent = step === s.n;
        const clickable = isDone;
        return (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(s.n)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-smooth border",
                isCurrent && "bg-primary text-primary-foreground border-primary",
                isDone && "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer",
                !isCurrent && !isDone && "bg-muted text-muted-foreground border-transparent"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/30">
                {isDone ? <Check className="w-3 h-3" /> : s.icon}
              </span>
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1", step > s.n ? "bg-primary/40" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
