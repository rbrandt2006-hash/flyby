import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, Sparkles, ArrowRight, Clock, DollarSign, Loader2, AlertCircle, Hotel, X, Brain, ChevronRight, Mic, Square, Check, Edit2, TrendingUp, TrendingDown, Users, Shield, ArrowUpRight, Building2, Trash2, CreditCard, CalendarClock, CalendarDays } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { PreferencesIndicator } from "@/components/trips/PreferencesIndicator";
import { useTrips } from "@/hooks/useTrips";
import { useExpenses } from "@/hooks/useExpenses";
import { useBookingMode } from "@/hooks/useAutoPlan";
import { useChats } from "@/hooks/useChats";
import { usePreferences } from "@/hooks/usePreferences";
import { AIRPORTS } from "@/data/globalAirports";
import { matchesPreferredAirline, matchedHotelBrand } from "@/services/preferenceMatching";
import { useTravelPreferences } from "@/hooks/useTravelPreferences";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parsePurpose } from "@/services/tripTemplates";
import { parseTravelRequest, parseTravelRequestSmart, parseTravelRequestCached, pinTravelDates, shiftTravelRequest } from "@/services/travelSearchParser";
import { takePlannerPrefill, proposalQuery, type CalendarTripContext, type TripProposal } from "@/services/calendarTrips";
import { useTripAgent } from "@/hooks/useTripAgent";
import { searchRealFlights, searchRealFlightsDetailed } from "@/services/duffelFlights";
import { FlightBookingModal } from "@/components/booking/FlightBookingModal";
import { FlightResults, type Flight } from "@/components/flights/FlightResults";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { searchLiveHotels, hotelUnavailableMessage, type HotelSearchFailure } from "@/services/duffelStays";
import { HotelBookingModal, type HotelGuestDefaults } from "@/components/booking/HotelBookingModal";
import { useTravelPolicy } from "@/hooks/useTravelPolicy";
import type { BookingResult, DateHint, DateOption, FlightAdvice, FlightSearchContext, RankingSummary } from "@/services/duffelFlights";
import { UNITED, bookedOnSite, type ExternalBooking, type HandoffSearch } from "@/services/airlineHandoff";
import type { LocalTripHotel } from "@/hooks/useTrips";
import { BookingChatThread, type ChatMsg, type ChatThreadMeta, type BookingResults } from "@/components/home/BookingChatThread";
import { ChatDock } from "@/components/home/ChatDock";
import { CalendarSyncDialog } from "@/components/calendar/CalendarSyncDialog";
import { DateHintRow, PickAdvice } from "@/components/home/BookingResultsPanel";
import type { HotelOption } from "@/components/chats/booking/types";
import { RefineModal } from "@/components/home/RefineModal";
import { KPIDrawer, type KPIType } from "@/components/home/KPIDrawer";
import type { CalendarEvent } from "@/services/mockCalendarService";
import { cn } from "@/lib/utils";
import { getRandomHeadline } from "@/data/heroHeadlines";
import { TravelerDetailPanel } from "@/components/home/TravelerDetailPanel";
import { TripSpendSlideOver, getTripSpendData } from "@/components/home/TripSpendSlideOver";
import { getTopHighCostDemoTrips } from "@/data/demoTrips";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useDemoMode } from "@/contexts/DemoModeContext";

interface TripPlan {
  destination: string;
  dates: string;
  startDate: Date;
  endDate: Date;
  datesAssumed: boolean;
  datesConfirmed: boolean;
  needsDateClarification: boolean;
  monthIntent?: {
    month: number;
    year: number;
    timing?: "early" | "mid" | "late";
  };
  purpose: string;
  flight: {
    airline: string;
    departTime: string;
    returnTime: string;
    /** Airport codes, shown so the traveler can see where the trip departs from. */
    from?: string;
    to?: string;
  };
  hotel: {
    name: string;
    location: string;
    pricePerNight?: number;
    totalPrice?: number;
    nights?: number;
    /** Live search result id — what a reservation is made from. */
    id?: string;
    currency?: string;
    dueAtAccommodation?: number;
  };
  estimatedCost: number;
  confidenceLevel: number;
  originalPrompt: string;
}

// Persist an in-progress booking flow across route changes so users can jump
// to another section (Trips, Team, Settings, etc.) without losing their place.
const BOOKING_FLOW_KEY = "flyby_booking_flow_v1";

interface PersistedBookingFlow {
  planResult: TripPlan | null;
  pendingPlanResult: TripPlan | null;
  selectedFlightFromResults: Flight | null;
  flightResults: Flight[];
  showHotelStep: boolean;
}

/** A flight that came from the live airline feed (a Duffel offer), not generated. */
const isLiveOffer = (flight: { id: string }) => typeof flight?.id === "string" && flight.id.startsWith("off_");

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const bookingFlowReviver = (_key: string, value: unknown) => {
  if (typeof value === "string" && isoDateRegex.test(value)) return new Date(value);
  return value;
};

const loadBookingFlow = (): PersistedBookingFlow | null => {
  try {
    const raw = sessionStorage.getItem(BOOKING_FLOW_KEY);
    if (!raw) return null;
    const flow = JSON.parse(raw, bookingFlowReviver) as PersistedBookingFlow;
    // A flow saved before invented flights were removed may still hold one.
    // Restoring it would put a flight that doesn't exist back on screen, so
    // start clean instead.
    const held = [flow.selectedFlightFromResults, ...(flow.flightResults || [])].filter(Boolean) as Flight[];
    const planFlights = [flow.planResult, flow.pendingPlanResult]
      .flatMap((plan) => (plan as (TripPlan & { _flights?: Flight[] }) | null)?._flights || []);
    if ([...held, ...planFlights].some((f) => !isLiveOffer(f))) {
      sessionStorage.removeItem(BOOKING_FLOW_KEY);
      return null;
    }
    // Same for hotels: one saved before the generated list was removed names a
    // property that may not exist and that nothing can reserve.
    const plans = [flow.planResult, flow.pendingPlanResult].filter(Boolean) as Array<TripPlan & { _hotels?: HotelOption[] }>;
    const staleHotel = plans.some(
      (plan) => (plan.hotel?.name && !plan.hotel.id) || (plan._hotels || []).some((h) => !h.live),
    );
    if (staleHotel) {
      sessionStorage.removeItem(BOOKING_FLOW_KEY);
      return null;
    }
    return flow;
  } catch { return null; }
};

const saveBookingFlow = (flow: PersistedBookingFlow) => {
  try { sessionStorage.setItem(BOOKING_FLOW_KEY, JSON.stringify(flow)); } catch { /* ignore */ }
};

const clearBookingFlow = () => {
  try { sessionStorage.removeItem(BOOKING_FLOW_KEY); } catch { /* ignore */ }
};

// Generate trip plan based on parsed destination
const generateTripPlan = async (
  prompt: string,
  /** The traveler's default departure airport from Settings, e.g. "SAN". */
  homeAirportCode?: string | null,
  options: {
    /** The meeting this trip is for, when it was planned from the calendar. */
    calendar?: CalendarTripContext | null;
    /** Preferences learned on this device, for when none are saved to the account. */
    hints?: Pick<FlightSearchContext, "preferredAirlines" | "avoidLayovers">;
  } = {},
): Promise<TripPlan | { needsDestination: true; flights?: never }> => {
  const calendar = options.calendar ?? null;

  // AI-first parse (Gemini) with the heuristic as an automatic fallback; the
  // result is cached so the synchronous follow-up sites reuse it.
  let parsed = await parseTravelRequestSmart(prompt);
  if (calendar) {
    // The travel days were worked out from the meeting itself; hold the parse
    // to them rather than to however the sentence happened to read.
    pinTravelDates(prompt, calendar.departDate, calendar.returnDate);
    parsed = parseTravelRequestCached(prompt);
  }
  const destAirport = parsed.destination?.airports[0];
  if (!destAirport) return { needsDestination: true };

  // Default origin to user's home airport when not parsed. Mark as inferred so
  // the chip displays "Nearest airport" instead of pretending we knew the origin.
  // A starting city the request names always wins; otherwise the traveler's
  // saved home airport; otherwise the long-standing fallback.
  const DEFAULT_HOME = { code: "SEA", city: "Nearest airport" };
  const savedHome = homeAirportCode
    ? AIRPORTS.find((a) => a.code === homeAirportCode.toUpperCase())
    : undefined;
  const originAirport = parsed.origin?.airports[0]
    || savedHome
    || { code: DEFAULT_HOME.code, city: DEFAULT_HOME.city } as any;
  const purpose = calendar?.title || parsePurpose(prompt);

  const now = new Date();
  const startDate = parsed.dates?.departure || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const datesAssumed = !parsed.dates?.departure;

  const destLabel = `${destAirport.city}, ${destAirport.country}`;
  const originCode = originAirport.code;
  const destCode = destAirport.code;
  const cabinClass = parsed.cabinClass || "economy";
  const passengers = parsed.passengers || 1;

  // Real flights and real hotels, searched together. Each carries the supplier
  // id needed to book it. Nothing is generated when a search comes back empty.
  const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // A departure date in the past is rejected outright by the flight provider
  // ("must be after <today>"), which used to surface as a misleading "couldn't
  // reach live flight search". Detect it here so the traveler is told the real
  // reason — and skip a request we know will fail.
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const departureIsPast = startDate < todayMidnight;

  let flightNote: "past_date" | "no_results" | "unreachable" | undefined;
  let realFlights: Flight[] | null = null;
  let ranking: RankingSummary | undefined;
  let advice: FlightAdvice | undefined;
  let dateOptions: DateOption[] | undefined;
  let returnUnavailable = false;
  let liveHotels: HotelOption[] = [];
  let hotelNote: HotelSearchFailure | undefined;
  // A trip has a way home. Unless the request says one-way, the return is
  // priced into the same fare — searching only the outbound used to "book" a
  // two-week trip with no flight back.
  const returnDate = parsed.tripType === "oneway" ? undefined : toISODate(endDate);
  // With no dates given, the ones Flyby suggests are a guess — and the week it
  // guesses can be an expensive one. So the same trip one and two weeks later
  // is priced at the same time, to be able to say when waiting saves real money.
  const laterBy = (days: number) => {
    const shift = (d: Date) => toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
    return { departureDate: shift(startDate), returnDate: returnDate ? shift(endDate) : undefined };
  };
  const alsoCheck = datesAssumed && !calendar ? [laterBy(7), laterBy(14)] : undefined;
  if (departureIsPast) {
    flightNote = "past_date";
  } else {
    const [outcome, stay] = await Promise.all([
      searchRealFlightsDetailed({
        origin: originCode,
        destination: destCode,
        departureDate: toISODate(startDate),
        returnDate,
        passengers,
        cabinClass,
        // What the traveler asked for and what the trip requires, for the
        // ranking. A meeting from the calendar outranks anything in the wording.
        context: {
          advise: true,
          requestText: calendar ? `${calendar.meetingLabel} in ${calendar.destinationCity}` : prompt,
          // Only a purpose the traveler actually gave. The default label
          // ("business meeting") is a display fallback, not a fact — passed
          // along, it had the advisor reasoning about a meeting nobody mentioned.
          purpose: calendar || purpose !== parsePurpose("") ? purpose : undefined,
          commitment: calendar?.meetingLabel ?? parsed.commitment,
          maxBudget: parsed.maxBudget,
          preferNonstop: parsed.preferNonstop,
          maxStops: parsed.maxStops,
          departWindow: parsed.departWindow,
          returnWindow: calendar ? calendar.returnWindow : parsed.returnWindow,
          arriveBy: calendar ? calendar.arriveBy : parsed.arriveBy,
          leaveAfter: calendar ? calendar.leaveAfter : parsed.leaveAfter,
          avoidRedEye: parsed.avoidRedEye,
          airline: parsed.airline,
          alsoCheck,
          ...options.hints,
        },
      }),
      searchLiveHotels({
        destinationCode: destCode,
        destinationCity: destAirport.city,
        checkIn: toISODate(startDate),
        checkOut: toISODate(endDate),
        guests: passengers,
      }),
    ]);
    realFlights = outcome.flights;
    ranking = outcome.ranking;
    advice = outcome.advice;
    dateOptions = outcome.dateOptions;
    if (!realFlights) flightNote = outcome.reason ?? "unreachable";
    returnUnavailable = Boolean(outcome.returnUnavailable);
    liveHotels = stay.hotels ?? [];
    if (!stay.hotels) hotelNote = stay.reason ?? "unreachable";
  }
  // Only flights that came back from the live airline feed. This used to fall
  // back to generated "estimates" when the feed was unreachable, which put
  // flights on screen that don't exist — a Qatar Airways nonstop from LAX to
  // Dubai, for one. No flight is better than an invented one: the traveler is
  // told why nothing came back (see _flightNote) instead.
  const flights: Flight[] = realFlights ?? [];

  return {
    destination: destLabel,
    dates: `${format(startDate, "MMM d")}–${format(endDate, "MMM d")}`,
    startDate,
    endDate,
    datesAssumed,
    datesConfirmed: !datesAssumed,
    needsDateClarification: false,
    purpose,
    flight: {
      airline: flights[0]?.airline || "",
      departTime: flights[0]?.departureTime || "",
      returnTime: flights[0]?.arrivalTime || "",
    },
    hotel: { name: "", location: "" },
    estimatedCost: flights[0]?.price ?? 0,
    // How fully the request pinned the trip down — not a measurement of
    // anything else. Lower when the dates were assumed, or when the best
    // flight still misses something that was asked for.
    confidenceLevel: flights[0]?.ranking?.eligible === false ? 70 : datesAssumed ? 85 : 95,
    originalPrompt: prompt,
    _flights: flights,
    _ranking: ranking,
    _advice: advice,
    _dateOptions: dateOptions,
    _flightNote: flightNote,
    _returnDate: returnDate,
    _returnUnavailable: returnUnavailable,
    _liveHotels: liveHotels,
    _hotelNote: hotelNote,
    _parsed: parsed,
    _originCode: originCode,
    _originCity: originAirport.city,
    _destCode: destCode,
    _destCity: destAirport.city,
  } as TripPlan & { _flights: Flight[]; _ranking?: RankingSummary; _advice?: FlightAdvice; _dateOptions?: DateOption[]; _flightNote?: "past_date" | "no_results" | "unreachable"; _returnDate?: string; _returnUnavailable: boolean; _liveHotels: HotelOption[]; _hotelNote?: HotelSearchFailure; _parsed: ReturnType<typeof parseTravelRequest>; _originCode: string; _originCity: string; _destCode: string; _destCity: string };
};

// Derive a short conversation title from the first user message + destination chip
function deriveThreadTitle(messages: ChatMsg[]): string {
  const firstResults = messages.find(m => m.role === "assistant" && m.kind === "results");
  if (firstResults && firstResults.role === "assistant" && firstResults.kind === "results") {
    const c = firstResults.results.chips;
    const dest = c.toCity || "Trip";
    return c.dateLabel ? `${dest} · ${c.dateLabel}` : dest;
  }
  const firstUser = messages.find(m => m.role === "user");
  if (firstUser && firstUser.role === "user") {
    return firstUser.text.length > 40 ? firstUser.text.slice(0, 40) + "…" : firstUser.text;
  }
  return "New trip";
}

// Parse a "2h 45m" style duration into minutes (0 when unparseable).
function parseDurationMins(d: string): number {
  const h = /(\d+)\s*h/.exec(d || "");
  const m = /(\d+)\s*m/.exec(d || "");
  return (h ? parseInt(h[1], 10) : 0) * 60 + (m ? parseInt(m[1], 10) : 0);
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// Follow-up phrases that are sort/filter intents, NOT an airline request.
// Anything that doesn't match here is treated as a possible carrier name so a
// live airline search can be attempted for ANY airline (not a fixed list).
const FOLLOWUP_INTENT_RE =
  /\b(nonstop|non-stop|direct|fastest|shortest|quickest|less time|shorter|fewer stops|fewest stops|less stops|reduce stops|cheap|cheaper|less expensive|lower price|budget|day after|next day|tomorrow|day before|day earlier|previous day|a day sooner|weeks? later|week after|next week|following week|week earlier|week before|previous week|push .*(day|week)|shift .*(day|week)|different hotel|other hotel|another hotel|new hotel|swap hotel)\b/i;

// Strip filler words so "show me any Lufthansa flights please" -> "lufthansa".
// The remaining phrase is used as a carrier filter (matched against airline
// name or IATA code by the backend / on-screen results), so it works for any
// airline without maintaining a hardcoded list.
const AIRLINE_FILLER_RE =
  /\b(show|me|please|can|could|i|see|find|get|give|any|only|just|the|a|an|with|on|for|of|flight|flights|airline|airlines|airways|carrier|option|options|book|search|want|need|from|to|no|not)\b/gi;

function cleanAirlineQuery(text: string): string {
  return text
    .replace(AIRLINE_FILLER_RE, " ")
    .replace(/[^a-z\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// "Day after" / "day before" change the dates, so they need a new live search —
// the fares and flights on screen belong to the old dates and can't be relabelled.
const DATE_SHIFT_RE = /day after|next day|tomorrow|day before|day earlier|previous day|a day sooner|weeks? later|week after|next week|following week|week earlier|week before|previous week|(push|shift).*(day|week)/i;
const DATE_SHIFT_EARLIER_RE = /day before|day earlier|previous day|a day sooner|week earlier|week before|previous week|(push|shift).*(earlier|back|sooner)/i;

/** How many days a "day after" / "two weeks later" follow-up moves the trip. */
function shiftDaysFor(text: string): number {
  const size = /\b(two|2)\s+weeks?\b/i.test(text) ? 14 : /week/i.test(text) ? 7 : 1;
  return DATE_SHIFT_EARLIER_RE.test(text) ? -size : size;
}

/** "one day later", "two weeks earlier", "10 days later". */
function shiftWords(days: number): string {
  const size = Math.abs(days);
  const amount = size === 1 ? "one day" : size === 7 ? "one week" : size === 14 ? "two weeks" : `${size} days`;
  return `${amount} ${days < 0 ? "earlier" : "later"}`;
}

/**
 * Other dates worth telling the traveler about: the cheapest of the ones priced
 * alongside the search, if it beats the pick by enough to matter ($40 and 10%).
 * A few dollars either way isn't a reason to move a trip.
 */
function cheaperDates(options: DateOption[] | undefined, pick: Flight | undefined, shownStart: Date): DateHint | undefined {
  if (!options?.length || !pick) return undefined;
  const best = [...options].sort((a, b) => a.price - b.price)[0];
  const saving = pick.price - best.price;
  if (saving < 40 || saving < pick.price * 0.1) return undefined;
  const day = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const out = day(best.departureDate);
  const back = best.returnDate ? day(best.returnDate) : null;
  const days = Math.round((out.getTime() - new Date(shownStart.getFullYear(), shownStart.getMonth(), shownStart.getDate()).getTime()) / 86400000);
  if (!days) return undefined;
  const label = !back ? format(out, "MMM d")
    : out.getMonth() === back.getMonth() ? `${format(out, "MMM d")} – ${format(back, "d")}`
      : `${format(out, "MMM d")} – ${format(back, "MMM d")}`;
  return { option: best, days, saving, label };
}

// True when the follow-up is a sort/filter intent rather than an airline name.
function isFollowUpIntent(text: string): boolean {
  return FOLLOWUP_INTENT_RE.test(text);
}

// Apply a follow-up intent to last results (client-side; used when a live
// airline search isn't available or returned nothing).
function applyFollowUp(text: string, prev: BookingResults): { results: BookingResults; note: string } {
  const t = text.toLowerCase();
  let results = { ...prev, flights: [...prev.flights], hotels: [...prev.hotels] };
  let note = "Refining your search…";

  if (/nonstop|non-stop|direct/.test(t)) {
    const nonstop = prev.flights.filter(f => f.stops === 0);
    results.flights = nonstop.length > 0 ? nonstop : prev.flights;
    note = nonstop.length > 0
      ? "Filtered to nonstop options only."
      : "No nonstop options on this route — keeping the best alternatives.";
  } else if (/fastest|shortest|quickest|less time|shorter/.test(t)) {
    results.flights = [...prev.flights].sort((a, b) => parseDurationMins(a.duration) - parseDurationMins(b.duration));
    note = "Sorted by shortest travel time.";
  } else if (/fewer stops|fewest stops|less stops|reduce stops/.test(t)) {
    results.flights = [...prev.flights].sort((a, b) => a.stops - b.stops || a.price - b.price);
    note = "Sorted by fewest stops.";
  } else if (/cheap|cheaper|less expensive|lower price|budget/.test(t)) {
    results.flights = [...prev.flights].sort((a, b) => a.price - b.price);
    results.hotels = [...prev.hotels].sort((a, b) => a.pricePerNight - b.pricePerNight);
    note = "Sorted by lowest price across flights and hotels.";
  } else if (/different hotel|other hotel|another hotel|new hotel|swap hotel/.test(t)) {
    results.hotels = [...prev.hotels.slice(1), prev.hotels[0]].filter(Boolean);
    note = "Here are different hotel options near your destination.";
  } else {
    // Treat as an airline request. Match generically against whatever carriers
    // are in the current results (works for any airline).
    const q = cleanAirlineQuery(text);
    const carriers = Array.from(new Set(prev.flights.map(f => f.airline)));
    const match = q
      ? carriers.find((a) => {
          const al = a.toLowerCase();
          return al.includes(q) || q.split(" ").some((w) => w.length >= 4 && al.includes(w));
        })
      : undefined;
    if (match) {
      const isMatch = (f: BookingResults["flights"][number]) => f.airline === match;
      const matched = prev.flights.filter(isMatch);
      results.flights = [...matched, ...prev.flights.filter((f) => !isMatch(f))];
      note = `Moved ${match} to the top — ${matched.length} option${matched.length > 1 ? "s" : ""} on this route.`;
    } else if (q) {
      note = `${titleCase(q)} isn't available on this route through our booking provider — showing the closest options instead.`;
    } else {
      note = "Try “nonstop”, “fastest”, “cheaper”, an airline name, or “different hotel”.";
    }
  }
  return { results, note };
}

// Demo team members traveling with live journey status
const travelJourneyStatuses = [
  "At gate B12", "Boarded plane", "In flight", "Landed", "In transit to hotel",
  "Checked into hotel", "In meeting", "At conference", "Heading to airport", "Returning today",
  "Flight delayed", "Boarding soon", "Taxi to hotel", "Working remotely",
];

// No fabricated colleagues. Populated from real team travel data when available.
const teamTraveling = [];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { demoMode } = useDemoMode();
  const { trips: savedTrips, createTrip, deleteTrip, updateTrip } = useTrips();
  const { policy: travelPolicy } = useTravelPolicy();
  const { expenses: savedExpenses, addExpense } = useExpenses();
  // The calendar agent: meetings that need a trip are offered right where
  // trips are planned, not only on the Trips page.
  const calendarAgent = useTripAgent(savedTrips, savedExpenses);
  // The meeting the trip being planned is for, when it came from the calendar.
  // Carried onto the saved trip so Flyby knows it's covered, and can tell when
  // the meeting moves. Cleared by any search the traveler types themselves.
  const calendarLinkRef = useRef<CalendarTripContext | null>(null);
  const { autoPlan, autoBook } = useBookingMode();
  // Set when autonomous mode has assembled a trip that should now be booked.
  // Booking reads the finished plan from state, so it is triggered from an
  // effect once that state has actually landed rather than in the same tick.
  const [pendingAutoBook, setPendingAutoBook] = useState(false);
  const { createChat } = useChats();
  const { preferences, getActivePreferenceLabels, hasLearnedPreferences, recordBookingChoice } = usePreferences();
  const { preferences: savedTravelPrefs, isLoading: travelPrefsLoading } = useTravelPreferences();
  const [tripInput, setTripInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<TripPlan | null>(() => loadBookingFlow()?.planResult ?? null);
  const [flightResults, setFlightResults] = useState<Flight[]>(() => loadBookingFlow()?.flightResults ?? []);
  // Kept as a no-op setter for backward-compat with helpers that mirror current results.
  const setBookingResults = (_v: BookingResults | null) => { void _v; };
  const [selectedFlightFromResults, setSelectedFlightFromResults] = useState<Flight | null>(() => loadBookingFlow()?.selectedFlightFromResults ?? null);
  const [showHotelStep, setShowHotelStep] = useState(() => loadBookingFlow()?.showHotelStep ?? false);
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [pendingPlanResult, setPendingPlanResult] = useState<TripPlan | null>(() => loadBookingFlow()?.pendingPlanResult ?? null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [needsDestination, setNeedsDestination] = useState(false);
  
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [kpiDrawer, setKpiDrawer] = useState<{ open: boolean; type: KPIType }>({ open: false, type: "upcomingTrips" });
  const [selectedTraveler, setSelectedTraveler] = useState<typeof teamTraveling[number] | null>(null);
  const [selectedSpendTrip, setSelectedSpendTrip] = useState<ReturnType<typeof getTripSpendData>>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<{ id: string; destination: string } | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // ─── Chat-thread state ───
  const THREADS_KEY = "flyby_booking_threads";
  type StoredThread = ChatThreadMeta & { messages: ChatMsg[] };
  const [storedThreads, setStoredThreads] = useState<StoredThread[]>(() => {
    try {
      const raw = localStorage.getItem(THREADS_KEY);
      return raw ? (JSON.parse(raw) as StoredThread[]) : [];
    } catch { return []; }
  });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastResults, setLastResults] = useState<BookingResults | null>(null);

  // ─── The planner lives in a chat window behind a button (ChatDock) ───
  // Closed by default, so the page leads with trips and the calendar. Open on
  // arrival only when a booking was in progress (an itinerary restored from
  // this tab, e.g. after a card's 3-D Secure redirect).
  const [chatOpen, setChatOpen] = useState(() => !!planResult);
  // Anything that starts or moves a plan along opens it: a search, "Plan trip"
  // on a calendar meeting, a trip handed over from another page, picking a
  // flight and hotel, or a search that failed. Each fires only when that value
  // changes, so closing the window mid-search keeps it closed.
  useEffect(() => { if (activeThreadId) setChatOpen(true); }, [activeThreadId]);
  useEffect(() => { if (planResult) setChatOpen(true); }, [planResult]);
  useEffect(() => { if (isPlanning) setChatOpen(true); }, [isPlanning]);
  useEffect(() => { if (error) setChatOpen(true); }, [error]);
  // /dashboard?chat=new — e.g. "New Trip" on the Trips page — opens it straight away.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("chat") === null) return;
    setChatOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("chat");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // "Sync calendar" on the home page's Calendar card (moved here from Trips).
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  // The resolved parameters of the current search, so a follow-up like
  // "show me Emirates" can re-query live Duffel inventory for that carrier.
  const searchContextRef = useRef<{
    origin: string; destination: string; departureDate: string;
    returnDate?: string;
    passengers: number; cabinClass: string;
  } | null>(null);

  // Persist active thread back to storedThreads list
  useEffect(() => {
    if (!activeThreadId) return;
    setStoredThreads(prev => {
      const idx = prev.findIndex(t => t.id === activeThreadId);
      const title = deriveThreadTitle(messages) || "New trip";
      const next: StoredThread = idx >= 0
        ? { ...prev[idx], title, messages }
        : { id: activeThreadId, title, createdAt: new Date().toISOString(), messages };
      const out = idx >= 0 ? prev.map((t, i) => i === idx ? next : t) : [next, ...prev];
      try { localStorage.setItem(THREADS_KEY, JSON.stringify(out)); } catch { /* ignore */ }
      return out;
    });
  }, [messages, activeThreadId]);

  // Restore in-progress booking flow when the dashboard remounts (e.g. after
  // navigating to Trips/Team/Settings and back). The hotel step picks up the
  // same live hotels the plan was built with — never a regenerated list.
  useEffect(() => {
    const flow = loadBookingFlow();
    if (flow?.showHotelStep && flow?.pendingPlanResult) {
      setHotelOptions((flow.pendingPlanResult as TripPlan & { _hotels?: HotelOption[] })._hotels ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save the booking flow whenever it changes so users can leave and resume later.
  useEffect(() => {
    if (!planResult && !pendingPlanResult && !showHotelStep) {
      clearBookingFlow();
      return;
    }
    saveBookingFlow({
      planResult,
      pendingPlanResult,
      selectedFlightFromResults,
      flightResults,
      showHotelStep,
    });
  }, [planResult, pendingPlanResult, selectedFlightFromResults, flightResults, showHotelStep]);

  const threadList: ChatThreadMeta[] = storedThreads.map(({ id, title, createdAt }) => ({ id, title, createdAt }));

  const preferenceLabels = useMemo(() => {
    const labels = getActivePreferenceLabels().filter(
      (l) => l !== "Avoids layovers" && l !== "Cost-sensitive",
    );
    if (savedTravelPrefs.avoidLayovers) labels.push("Avoids layovers");
    if (savedTravelPrefs.costSensitivity === "high") labels.push("Cost-sensitive");
    else if (savedTravelPrefs.costSensitivity === "low") labels.push("Premium-friendly");
    return labels;
  }, [getActivePreferenceLabels, savedTravelPrefs.avoidLayovers, savedTravelPrefs.costSensitivity]);
  const showLearnedBadge = hasLearnedPreferences();

  const handleTranscriptReady = useCallback((transcript: string) => {
    setTripInput(transcript);
  }, []);

  const voiceRecording = useVoiceRecording({ onTranscriptReady: handleTranscriptReady, maxDuration: 60 });

  const buildResultsFromPlan = (
    result: Awaited<ReturnType<typeof generateTripPlan>>,
  ): BookingResults | null => {
    if ("needsDestination" in result) return null;
    const anyResult = result as TripPlan & {
      _flights?: Flight[];
      _ranking?: RankingSummary;
      _advice?: FlightAdvice;
      _dateOptions?: DateOption[];
      _flightNote?: "past_date" | "no_results" | "unreachable";
      _returnUnavailable?: boolean;
      _liveHotels?: HotelOption[];
      _hotelNote?: HotelSearchFailure;
      _parsed?: ReturnType<typeof parseTravelRequest>;
      _returnDate?: string;
      _originCode?: string; _originCity?: string;
      _destCode?: string; _destCity?: string;
    };
    const rawFlights = anyResult._flights || [];
    const parsed = anyResult._parsed;
    const nights = Math.max(1, Math.ceil((anyResult.endDate.getTime() - anyResult.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    // Real hotels from the live supplier. "Policy compliant" is judged against
    // the company's actual nightly cap; with no cap set, no claim is made.
    const nightlyCap = travelPolicy?.max_nightly_hotel_rate ?? null;
    const rawHotels: HotelOption[] = (anyResult._liveHotels ?? []).map((h) => ({
      ...h,
      tags: nightlyCap == null
        ? h.tags
        : [...h.tags, h.pricePerNight <= nightlyCap ? "Policy compliant" : "Out of policy"],
    }));
    // The supplier names the chain and brand outright, which is a far better
    // thing to match a preference against than the property's name alone.
    const hotelBrandText = (h: HotelOption) => [h.name, h.brand, h.chain].filter(Boolean).join(" ");
    const preferredHotelBrands = savedTravelPrefs.preferredHotelBrands || [];
    // A preferred brand the traveler can actually book (within policy) comes
    // first; among those, and among everything else, the usual price/rating
    // balance decides. This used to be a small score nudge that a slightly
    // cheaper hotel always outweighed, so the preference rarely showed.
    const isPreferredHotel = (h: (typeof rawHotels)[number]) =>
      !h.tags.includes("Out of policy") && matchedHotelBrand(hotelBrandText(h), preferredHotelBrands) !== null;
    const hotels = [...rawHotels].sort((a, b) => {
      const preferredFirst = Number(isPreferredHotel(b)) - Number(isPreferredHotel(a));
      if (preferredFirst !== 0) return preferredFirst;
      const cs = savedTravelPrefs.costSensitivity;
      const priceW = cs === "high" ? 1.4 : cs === "low" ? 0.3 : 0.8;
      const ratingW = cs === "low" ? 60 : cs === "high" ? 15 : 35;
      const score = (h: typeof a) => h.pricePerNight * priceW - h.rating * ratingW;
      return score(a) - score(b);
    });

    // Re-rank flights to respect saved "avoid layovers" + "cost sensitivity" preferences,
    // falling back to the inferred (learned) prefs when no saved value is set.
    const preferredAirlines =
      (savedTravelPrefs.preferredAirlines && savedTravelPrefs.preferredAirlines.length > 0)
        ? savedTravelPrefs.preferredAirlines
        : (preferences.preferredAirlines || []);
    const avoidLayovers = savedTravelPrefs.avoidLayovers || preferences.avoidsLayovers;
    const costSensitivity = savedTravelPrefs.costSensitivity; // "low" | "medium" | "high"
    const priceWeight = costSensitivity === "high" ? 1.6 : costSensitivity === "low" ? 0.3 : 1;
    const minPrice = rawFlights.reduce((m, f) => Math.min(m, f.price), Infinity);
    // A round trip is judged on both directions. Scoring only the outbound let
    // a 31-hour, two-stop journey home rank as if it weren't there.
    const isRoundTrip = (f: typeof rawFlights[number]) => f.tripType === "round_trip";
    const totalStops = (f: typeof rawFlights[number]) =>
      f.stops + (isRoundTrip(f) ? (f.returnStops ?? 0) : 0);
    const totalMins = (f: typeof rawFlights[number]) =>
      (parseDurationMins(f.duration) || 0) + (isRoundTrip(f) ? (parseDurationMins(f.returnDuration || "") || 0) : 0);
    const minDuration = rawFlights.reduce(
      (m, f) => Math.min(m, totalMins(f) || Infinity),
      Infinity,
    );
    const scoreFlight = (f: typeof rawFlights[number]) => {
      // Price above the cheapest option, weighted by cost sensitivity.
      const priceDampForLayovers = avoidLayovers ? 0.4 : 1;
      let score = Math.max(0, f.price - minPrice) * priceWeight * priceDampForLayovers;
      // Stop penalty. Business travelers generally prefer fewer stops, so each
      // stop costs a meaningful amount ($ equivalent) even when the traveler
      // hasn't set a preference — this keeps a cheap 2-stop from burying a
      // reasonable nonstop. "Avoid layovers" makes stops near-disqualifying.
      const stopPenalty = avoidLayovers ? 1500 : 320;
      score += totalStops(f) * stopPenalty;
      // Prefer shorter itineraries: penalize each hour over the fastest option,
      // counting the time spent travelling in both directions.
      const extraMins = Math.max(0, totalMins(f) - (minDuration === Infinity ? 0 : minDuration));
      score += (extraMins / 60) * 25;
      // Coming home to a different airport than you left from (ONT instead of
      // LAX) means a car or a parked car in the wrong place. Real, but rarely
      // wanted — it has to be clearly better to win.
      if (isRoundTrip(f) && f.returnDestination && f.origin && f.returnDestination !== f.origin) score += 400;
      // Preferred carrier: worth about one stop, or ~$300 at medium cost
      // sensitivity. Matched loosely — "Delta" must match Duffel's "Delta Air
      // Lines", which the old exact comparison never did.
      if (matchesPreferredAirline(f, preferredAirlines)) score -= 300;
      return score;
    };
    const ranked = [...rawFlights].sort((a, b) => scoreFlight(a) - scoreFlight(b));
    // Surface variety: lead with the best-scoring option from each airline (so
    // the top picks aren't three fares from the same carrier), then append the
    // remaining options. The overall best flight still comes first.
    const bestPerAirline: typeof ranked = [];
    const moreOptions: typeof ranked = [];
    const seenAirlines = new Set<string>();
    for (const f of ranked) {
      if (seenAirlines.has(f.airline)) {
        moreOptions.push(f);
      } else {
        seenAirlines.add(f.airline);
        bestPerAirline.push(f);
      }
    }
    // When the backend ranked the search (fare rules, connection times, the
    // meeting to be on time for, Gemini's final call), its order is the order.
    // The ranking above is what an older backend's cheapest-first list gets.
    const serverRanked = Boolean(anyResult._ranking);
    const flights = serverRanked ? rawFlights : [...bestPerAirline, ...moreOptions];

    const anchor = parsed?.locationAnchor;
    // Always show the full formatted date range (e.g. "Jul 10 – Jul 14") instead
    // of the raw parsed token (which could be just "july").
    const sameMonth = anyResult.startDate.getMonth() === anyResult.endDate.getMonth();
    const dateLabel = sameMonth
      ? `${format(anyResult.startDate, "MMM d")} – ${format(anyResult.endDate, "d")}`
      : `${format(anyResult.startDate, "MMM d")} – ${format(anyResult.endDate, "MMM d")}`;

    const topFlight = flights[0];
    const topHotel = hotels[0];

    const reasons: { flight?: string; hotel?: string } = {};
    const advice = serverRanked && anyResult._advice?.pickId === topFlight?.id ? anyResult._advice : undefined;
    if (advice) {
      reasons.flight = [advice.headline.replace(/\.$/, "") + ".", ...advice.why, advice.tradeoff ? `Worth knowing: ${advice.tradeoff}` : ""]
        .filter(Boolean).join(" ");
    } else if (topFlight) {
      const stopsWord = (n: number) => (n === 0 ? "nonstop" : `${n} stop${n > 1 ? "s" : ""}`);
      const stopsLabel = isRoundTrip(topFlight)
        ? (totalStops(topFlight) === 0
            ? "Nonstop both ways"
            : `${stopsWord(topFlight.stops).replace(/^./, (c) => c.toUpperCase())} out, ${stopsWord(topFlight.returnStops ?? 0)} back`)
        : stopsWord(topFlight.stops).replace(/^./, (c) => c.toUpperCase());
      const isCheapest = topFlight.price === minPrice;
      const airlinePreferred = matchesPreferredAirline(topFlight, preferredAirlines);
      const bits: string[] = [];
      bits.push(
        `${stopsLabel} ${anyResult._originCode}→${anyResult._destCode} on ${topFlight.airline} (${topFlight.flightNumber}), departs ${topFlight.departureTime} · ${topFlight.duration} · $${topFlight.price}.`,
      );
      const why: string[] = [];
      if (topFlight.stops === 0 && avoidLayovers) why.push("nonstop matches your avoid-layovers preference");
      else if (topFlight.stops === 0) why.push("nonstop service");
      else if (avoidLayovers) why.push("no nonstop available on this route — best connecting option");
      if (airlinePreferred) why.push(`on your preferred carrier ${topFlight.airline}`);
      // Say so when a preferred airline wasn't an option at all — otherwise the
      // pick looks like the preference was ignored. (If one was offered but
      // lost on stops or price, the ranking made that trade-off deliberately.)
      const preferredOffered = flights.some((f) => matchesPreferredAirline(f, preferredAirlines));
      const preferredNote =
        preferredAirlines.length > 0 && !airlinePreferred && !preferredOffered
          ? ` None of your preferred airlines (${preferredAirlines.join(", ")}) fly this route on these dates.`
          : "";
      if (isCheapest) why.push("lowest fare available");
      else why.push("competitive fare for the schedule");
      reasons.flight = `${bits[0]} Picked because ${why.join(", ")}.${preferredNote}`;
    }
    if (topHotel) {
      // Only claim a brand match when there is one — this used to say "Matches
      // your preferred brands" on every hotel, preferences set or not.
      const brand = matchedHotelBrand(hotelBrandText(topHotel), preferredHotelBrands);
      const brandNote = brand
        ? ` Part of your preferred ${brand}.`
        : preferredHotelBrands.length > 0
          ? ` None of your preferred brands (${preferredHotelBrands.join(", ")}) ${nightlyCap != null ? "had an in-policy room" : "had a room"} for these dates.`
          : "";
      // Only what the supplier actually reported about this property.
      const facts = [
        `$${topHotel.pricePerNight}/night`,
        topHotel.reviewCount > 0 ? `rated ${topHotel.rating}/5 by ${topHotel.reviewCount.toLocaleString()} guests` : null,
        topHotel.distanceToVenue || null,
        nightlyCap != null && topHotel.tags.includes("Policy compliant") ? `within your $${nightlyCap}/night policy` : null,
      ].filter(Boolean).join(", ");
      reasons.hotel = `${topHotel.name}: ${facts}.${brandNote}`;
    }

    return {
      chips: {
        fromCity: anyResult._originCity,
        fromCode: anyResult._originCode,
        toCity: anyResult._destCity,
        toCode: anyResult._destCode,
        dateLabel,
        anchor,
      },
      flights,
      hotels,
      reasons,
      nights,
      flightNote: anyResult._flightNote,
      hotelNote: anyResult._hotelNote,
      returnUnavailable: anyResult._returnUnavailable,
      advice,
      ranking: anyResult._ranking,
      dateHint: cheaperDates(anyResult._dateOptions, topFlight, anyResult.startDate),
      handoff: anyResult._originCode && anyResult._destCode
        ? {
            origin: anyResult._originCode,
            destination: anyResult._destCode,
            departureDate: format(anyResult.startDate, "yyyy-MM-dd"),
            returnDate: anyResult._returnDate,
            passengers: parsed?.passengers || 1,
            destinationLabel: anyResult.destination,
            purpose: anyResult.purpose,
          }
        : undefined,
    };
  };

  const newMsgId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Append an assistant results message and sync side state used by hotel/flight selection
  const pushAssistantResults = (results: BookingResults, note?: string) => {
    setLastResults(results);
    setBookingResults(results);
    setMessages(prev => [
      ...prev.filter(m => !(m.role === "assistant" && m.kind === "loading")),
      { id: newMsgId(), role: "assistant", kind: "results", note, results },
    ]);
  };

  const pushAssistantText = (text: string) => {
    setMessages(prev => [
      ...prev.filter(m => !(m.role === "assistant" && m.kind === "loading")),
      { id: newMsgId(), role: "assistant", kind: "text", text },
    ]);
  };

  const startNewThread = (firstUserText: string) => {
    const id = `thread_${Date.now()}`;
    setActiveThreadId(id);
    setLastResults(null);
    setMessages([
      { id: newMsgId(), role: "user", text: firstUserText },
      { id: newMsgId(), role: "assistant", kind: "loading" },
    ]);
    return id;
  };

  const handleNewTrip = () => {
    setActiveThreadId(null);
    setMessages([]);
    setLastResults(null);
    setBookingResults(null);
    setPlanResult(null);
    setFlightResults([]);
    setSelectedFlightFromResults(null);
    setShowHotelStep(false);
    setHotelOptions([]);
    setPendingPlanResult(null);
    setTripInput("");
    setError(null);
    setInputError(null);
    setNeedsDestination(false);
  };

  const handleSelectThread = (id: string) => {
    const t = storedThreads.find(s => s.id === id);
    if (!t) return;
    setActiveThreadId(id);
    setMessages(t.messages);
    // Restore last results from most recent results message
    const lastRes = [...t.messages].reverse().find(m => m.role === "assistant" && m.kind === "results");
    if (lastRes && lastRes.role === "assistant" && lastRes.kind === "results") {
      setLastResults(lastRes.results);
      setBookingResults(lastRes.results);
    } else {
      setLastResults(null);
      setBookingResults(null);
    }
    setPlanResult(null);
    setFlightResults([]);
    setSelectedFlightFromResults(null);
    setShowHotelStep(false);
    setHotelOptions([]);
    setPendingPlanResult(null);
  };

  const handleDeleteThread = (id: string) => {
    setStoredThreads(prev => {
      const out = prev.filter(t => t.id !== id);
      try { localStorage.setItem(THREADS_KEY, JSON.stringify(out)); } catch { /* ignore */ }
      return out;
    });
    if (activeThreadId === id) handleNewTrip();
  };

  /** Preferences learned on this device, for the ranking to use when none are saved. */
  const rankingHints = (): Pick<FlightSearchContext, "preferredAirlines" | "avoidLayovers"> => ({
    preferredAirlines: preferences.preferredAirlines?.length ? preferences.preferredAirlines : undefined,
    avoidLayovers: preferences.avoidsLayovers || undefined,
  });

  const runInitialPlan = async (text: string, calendar: CalendarTripContext | null = null) => {
    calendarLinkRef.current = calendar;
    setError(null); setInputError(null); setNeedsDestination(false); setFlightResults([]);
    setPlanResult(null);
    setSelectedFlightFromResults(null);
    setShowHotelStep(false);
    setHotelOptions([]);
    setPendingPlanResult(null);
    setIsPlanning(true); setIsThinking(true);
    startNewThread(text);
    try {
      const result = await generateTripPlan(text, savedTravelPrefs.homeAirport, { calendar, hints: rankingHints() });
      if ("needsDestination" in result) {
        setNeedsDestination(true);
        pushAssistantText("I couldn't find a destination in that request — can you try again with a city or airport?");
        return;
      }
      // Remember the resolved search params so an airline follow-up can re-query.
      const ctx = result as TripPlan & {
        _originCode?: string; _destCode?: string; _returnDate?: string;
        _parsed?: { passengers?: number; cabinClass?: string };
      };
      const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (ctx._originCode && ctx._destCode) {
        searchContextRef.current = {
          origin: ctx._originCode,
          destination: ctx._destCode,
          departureDate: toISODate(result.startDate),
          // So "show me Emirates" re-searches the same kind of trip.
          returnDate: ctx._returnDate,
          passengers: ctx._parsed?.passengers || 1,
          cabinClass: ctx._parsed?.cabinClass || "economy",
        };
      }
      const built = buildResultsFromPlan(result);
      if (built) {
        // Automatic planning: accept the top-ranked flight and hotel instead
        // of stopping for two manual picks. The options still render
        // above the itinerary, so the traveler can Refine or Rebook if they
        // disagree with any choice.
        const planned = autoPlan && applyAutoSelection(result, built);
        if (planned && autoBook) setPendingAutoBook(true);
        pushAssistantResults(
          built,
          planned
            ? autoBook
              ? "Picked your flight and hotel from your travel preferences and policy — just confirm payment to book."
              : "Planned this automatically from your travel preferences — review the itinerary below, or refine any part of it."
            : undefined,
        );
      }
    } catch {
      setError("Failed to generate trip plan. Please try again.");
      pushAssistantText("Something went wrong searching for that trip. Please try again.");
    } finally {
      setIsPlanning(false); setIsThinking(false);
    }
  };

  /**
   * Search the same trip again on dates moved by `days`, and show what comes
   * back. Everything shown afterwards is what the airlines returned for the new
   * dates. Used by "day after" / "a week later" and by the cheaper-dates button.
   */
  const moveTrip = async (days: number, options: { autoSelect?: boolean } = {}): Promise<boolean> => {
    const searched = searchContextRef.current;
    const purpose = parsePurpose(tripInput);
    const moved = searched && shiftTravelRequest(
      tripInput, searched, days,
      // Keep a purpose the request named; the default needs no mention.
      purpose !== parsePurpose("") ? purpose : undefined,
    );
    if (!searched || !moved) {
      // A conversation reopened from history no longer has its search.
      pushAssistantText("I can't move the dates on this saved search. Start a new trip with the dates you want and I'll search them live.");
      return false;
    }
    // Still for the same meeting if there was one, but no longer held to
    // its clock time: the traveler is choosing the days themselves now.
    const result = await generateTripPlan(moved, savedTravelPrefs.homeAirport, { hints: rankingHints() });
    const built = "needsDestination" in result ? null : buildResultsFromPlan(result);
    if (!built || "needsDestination" in result) {
      pushAssistantText("I couldn't search the new dates. Start a new trip with the dates you want.");
      return false;
    }
    // From here on the trip is the moved one: picking a flight, the hotel
    // step and airline follow-ups all read these.
    setTripInput(moved);
    searchContextRef.current = {
      ...searched,
      departureDate: format(result.startDate, "yyyy-MM-dd"),
      returnDate: (result as TripPlan & { _returnDate?: string })._returnDate,
    };
    // In automatic mode the itinerary was already assembled once; assemble it
    // again for the new dates rather than dropping back to a list.
    const planned = Boolean(options.autoSelect) && applyAutoSelection(result, built);
    if (planned && autoBook) setPendingAutoBook(true);
    pushAssistantResults(
      built,
      built.flights.length > 0
        ? `Moved the trip ${shiftWords(days)}, to ${built.chips.dateLabel}. These are live fares for the new dates.`
        : `Moved the trip ${shiftWords(days)}, to ${built.chips.dateLabel}.`,
    );
    return true;
  };

  /** The traveler took the cheaper dates Flyby pointed out. */
  const handleUseDates = async (hint: DateHint) => {
    if (isThinking) return;
    setPlanResult(null);
    setPendingPlanResult(null);
    setShowHotelStep(false);
    setSelectedFlightFromResults(null);
    setMessages(prev => [
      ...prev,
      { id: newMsgId(), role: "user", text: `Use ${hint.label} instead` },
      { id: newMsgId(), role: "assistant", kind: "loading" },
    ]);
    setIsThinking(true);
    try {
      await moveTrip(hint.days, { autoSelect: autoPlan });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendFollowUp = async (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: newMsgId(), role: "user", text },
      { id: newMsgId(), role: "assistant", kind: "loading" },
    ]);
    setIsThinking(true);
    try {
      // "Day after": search the same trip again, one day later. Everything
      // shown afterwards is what the airlines returned for the new dates.
      if (DATE_SHIFT_RE.test(text) && lastResults) {
        await moveTrip(shiftDaysFor(text));
        return;
      }

      // Airline follow-up ("show me Lufthansa", "any Turkish flights"): anything
      // that isn't a sort/filter intent is treated as a carrier name and sent to
      // a live Duffel search filtered to that airline — works for ANY airline,
      // and surfaces flights that weren't in the original on-screen results.
      if (!isFollowUpIntent(text) && lastResults && searchContextRef.current) {
        const airlineQuery = cleanAirlineQuery(text);
        if (airlineQuery.length >= 3) {
          const fetched = await searchRealFlights({ ...searchContextRef.current, airline: airlineQuery });
          if (fetched && fetched.length > 0) {
            pushAssistantResults(
              { ...lastResults, flights: fetched },
              `Found ${fetched.length} ${titleCase(fetched[0].airline)} option${fetched.length > 1 ? "s" : ""} on this route (live search).`,
            );
            return;
          }
          // Live search returned nothing for that carrier — fall through to the
          // client-side handler, which honestly says it's not available.
        }
      }

      if (lastResults) {
        await new Promise(r => setTimeout(r, 300));
        const { results, note } = applyFollowUp(text, lastResults);
        pushAssistantResults(results, note);
      } else {
        // No prior results — treat as a fresh search
        const result = await generateTripPlan(text, savedTravelPrefs.homeAirport, { hints: rankingHints() });
        if ("needsDestination" in result) {
          pushAssistantText("I couldn't find a destination — try a city or airport.");
        } else {
          const built = buildResultsFromPlan(result);
          if (built) pushAssistantResults(built);
        }
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmVoice = useCallback(async () => {
    voiceRecording.confirmTranscript();
    if (!tripInput.trim()) { setInputError("Please describe your trip first"); return; }
    await runInitialPlan(tripInput);
  }, [tripInput, voiceRecording]);

  const handleEditVoice = useCallback(() => { voiceRecording.confirmTranscript(); }, [voiceRecording]);

  const handlePlanTrip = async (overrideInput?: string) => {
    const input = overrideInput ?? tripInput;
    if (!input.trim()) { setInputError("Please describe your trip first"); return; }
    if (overrideInput) setTripInput(overrideInput);
    await runInitialPlan(input);
  };

  // Consume a pre-filled query handed off from another page (e.g. /trips → "Plan trip",
  // or "Book it" on a calendar meeting).
  //
  // Waits for saved travel preferences first. Those load asynchronously, and a
  // plan started before they arrive would ignore the traveler's home airport
  // and preferred carriers — the hand-off used to fire 50ms after mount, which
  // was always too early. The ref holds the latest runInitialPlan so the
  // deferred call doesn't use the first render's stale closure.
  const runInitialPlanRef = useRef(runInitialPlan);
  runInitialPlanRef.current = runInitialPlan;
  const prefillConsumedRef = useRef(false);
  useEffect(() => {
    if (travelPrefsLoading || prefillConsumedRef.current) return;
    prefillConsumedRef.current = true;
    // A request left by another page — a meeting from the calendar arrives
    // with its travel days and meeting time attached.
    const prefill = takePlannerPrefill();
    if (prefill) {
      setTripInput(prefill.query);
      // Run on next tick so other state is settled
      setTimeout(() => { runInitialPlanRef.current(prefill.query, prefill.calendar ?? null); }, 50);
    }
  }, [travelPrefsLoading]);




  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlightFromResults(flight);
    setFlightResults([]);
    // Build partial plan, then show hotel step. Reuse the AI parse from the
    // initial search (cached by input) rather than re-parsing weaker.
    const parsed = parseTravelRequestCached(tripInput);
    const destAirport = parsed.destination?.airports[0];
    const now = new Date();
    const startDate = parsed.dates?.departure || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const destLabel = destAirport ? `${destAirport.city}, ${destAirport.country}` : flight.destination;
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // The live hotels this search returned, already ranked against the
    // traveler's preferences — used for the hotel step and carried onto the
    // plan so Refine shows the same ones. Empty when none could be searched.
    const hotels = lastResults?.hotels ?? [];

    // Carry the real flight + hotel lists (the same ones shown in results) onto
    // the plan so the Refine modal can show the actual options, not mock ones.
    const allFlights = lastResults?.flights ?? [flight];
    const partialPlan: TripPlan & { _flights?: Flight[]; _hotels?: HotelOption[]; _hotelNote?: HotelSearchFailure; _returnUnavailable?: boolean } = {
      destination: destLabel,
      dates: `${format(startDate, "MMM d")}–${format(endDate, "MMM d")}`,
      startDate, endDate,
      datesAssumed: !parsed.dates?.departure,
      datesConfirmed: !!parsed.dates?.departure,
      needsDateClarification: false,
      purpose: calendarLinkRef.current?.title || parsePurpose(tripInput),
      flight: { airline: flight.airline, departTime: flight.departureTime, returnTime: flight.arrivalTime, from: flight.origin, to: flight.destination },
      hotel: { name: "", location: "" },
      estimatedCost: flight.price,
      confidenceLevel: 96,
      originalPrompt: tripInput,
      _flights: allFlights,
      _hotels: hotels,
      _hotelNote: lastResults?.hotelNote,
      _returnUnavailable: lastResults?.returnUnavailable,
    };

    if (hotels.length === 0) {
      // No real hotels to choose from, so there is no hotel step: go straight
      // to the itinerary, which says why there's no hotel on it.
      setPendingPlanResult(null);
      setHotelOptions([]);
      setShowHotelStep(false);
      setPlanResult(partialPlan);
      return;
    }

    setPendingPlanResult(partialPlan);
    setHotelOptions(hotels);
    setShowHotelStep(true);
  };

  /**
   * Automatic planning — assemble the whole itinerary instead of asking the
   * traveler to pick each piece.
   *
   * `buildResultsFromPlan` has already ranked flights and hotels against the
   * traveler's saved preferences (cost sensitivity,
   * preferred airlines and hotel brands, layover tolerance), so the top of each
   * list *is* the recommended choice. This accepts those picks and produces the
   * same finished plan the manual flight -> hotel flow would have produced, so
   * everything downstream (Refine, Rebook, Confirm & Book, expense capture)
   * behaves identically.
   */
  const applyAutoSelection = (result: TripPlan, built: BookingResults): boolean => {
    const flight = built.flights[0];
    if (!flight) return false;
    // Nothing meets what was asked for (no flight lands before the meeting,
    // say). Picking one automatically would walk the traveler to payment for a
    // flight that doesn't work — show the options and the reason instead.
    if (flight.ranking && !flight.ranking.eligible) return false;
    // The same when no flight at all could meet it: the list is then only the
    // closest misses, and choosing between those is the traveler's call.
    if (built.ranking?.unmet?.length) return false;
    const hotel = built.hotels[0];
    const nights = built.nights;

    const plan: TripPlan & {
      _flights?: Flight[];
      _hotels?: HotelOption[];
      _hotelNote?: HotelSearchFailure;
      _returnUnavailable?: boolean;
    } = {
      destination: result.destination,
      dates: result.dates,
      startDate: result.startDate,
      endDate: result.endDate,
      datesAssumed: result.datesAssumed,
      datesConfirmed: result.datesConfirmed,
      needsDateClarification: false,
      purpose: result.purpose,
      flight: {
        airline: flight.airline,
        departTime: flight.departureTime,
        returnTime: flight.arrivalTime,
        from: flight.origin,
        to: flight.destination,
      },
      hotel: hotel
        ? {
            id: hotel.id,
            name: hotel.name,
            location: hotel.area,
            pricePerNight: hotel.pricePerNight,
            totalPrice: hotel.totalPrice,
            nights,
            currency: hotel.currency,
            dueAtAccommodation: hotel.dueAtAccommodation,
          }
        : { name: "", location: "" },
      // What will actually be charged: the fare and the stay.
      estimatedCost: flight.price + (hotel?.totalPrice ?? 0),
      confidenceLevel: result.confidenceLevel,
      originalPrompt: result.originalPrompt,
      // Carried so Refine and Rebook have the full option lists, exactly as the
      // manual path provides them.
      _flights: built.flights,
      _hotels: built.hotels,
      _hotelNote: built.hotelNote,
      _returnUnavailable: built.returnUnavailable,
    };

    // The selected flight carries the route/price used when the trip is booked
    // and when its expenses are filed.
    setSelectedFlightFromResults(flight);
    setPendingPlanResult(null);
    setShowHotelStep(false);
    setHotelOptions([]);
    setPlanResult(plan);
    return true;
  };

  const handleSelectHotelFromStep = (hotel: HotelOption) => {
    if (!pendingPlanResult) return;
    const nights = Math.max(
      1,
      Math.ceil(
        (pendingPlanResult.endDate.getTime() - pendingPlanResult.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const finalPlan: TripPlan = {
      ...pendingPlanResult,
      hotel: {
        id: hotel.id,
        name: hotel.name,
        location: hotel.area,
        pricePerNight: hotel.pricePerNight,
        totalPrice: hotel.totalPrice,
        nights,
        currency: hotel.currency,
        dueAtAccommodation: hotel.dueAtAccommodation,
      },
      estimatedCost: pendingPlanResult.estimatedCost + hotel.totalPrice,
    };
    setPlanResult(finalPlan);
    setPendingPlanResult(null);
    setShowHotelStep(false);
    setHotelOptions([]);
    toast.success("Hotel added to itinerary", { description: hotel.name });
  };

  const handleSkipHotel = () => {
    if (!pendingPlanResult) return;
    setPlanResult(pendingPlanResult);
    setPendingPlanResult(null);
    setShowHotelStep(false);
    setHotelOptions([]);
  };


  const handleRefine = () => { setIsRefineOpen(true); };

  const handleRefineSave = (selections: {
    flightId: string;
    hotelId: string | null;
    flight: { airline: string; departTime: string; returnTime: string };
    hotel: { name: string; location: string; pricePerNight?: number; totalPrice?: number; nights?: number };
    estimatedCost: number;
  }) => {
    if (!planResult) return;
    const { flightId, hotelId, ...shown } = selections;
    // The hotel must stay tied to its live search result, or there is nothing
    // to reserve it from later.
    const planHotels = (planResult as TripPlan & { _hotels?: HotelOption[] })._hotels || [];
    const chosenHotel = hotelId ? planHotels.find((h) => h.id === hotelId) : undefined;
    // Switch the offer that Confirm & Book will actually purchase. Saving used
    // to change only the text on the itinerary, so picking a different flight
    // here showed the new airline while payment still went to the original one.
    const planFlights = (planResult as TripPlan & { _flights?: Flight[] })._flights || [];
    const chosen = planFlights.find((f) => f.id === flightId);
    if (!chosen) {
      toast.error("That flight is no longer available. Please search again.");
      return;
    }
    setSelectedFlightFromResults(chosen);
    setPlanResult({
      ...planResult,
      ...shown,
      flight: { ...shown.flight, from: chosen.origin, to: chosen.destination },
      hotel: chosenHotel
        ? {
            ...shown.hotel,
            id: chosenHotel.id,
            currency: chosenHotel.currency,
            dueAtAccommodation: chosenHotel.dueAtAccommodation,
          }
        : { name: "", location: "" },
    });
    toast.success("Trip options updated");
  };

  const [isBooking, setIsBooking] = useState(false);
  // The real Duffel offer being paid for, when the payment modal is open.
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);
  // The hotel waiting to be reserved once the flight is ticketed. The trip is
  // already saved by then — with this hotel marked as not yet reserved — so
  // closing the window or losing the page can't lose the flight booking.
  const [hotelReservation, setHotelReservation] = useState<{
    hotel: HotelOption;
    tripId: string;
    tripHotel: LocalTripHotel;
    tripName: string;
    tripDates: string;
    startDate: string;
    guest: HotelGuestDefaults;
  } | null>(null);

  // Idempotency: persist in-flight + recently completed booking keys across reloads
  const BOOKING_IDEMPOTENCY_KEY = "flyby.bookingIdempotency.v1";
  type IdempotencyRecord = { tripId?: string; status: "in_flight" | "completed"; ts: number };
  const readIdempotencyMap = (): Record<string, IdempotencyRecord> => {
    try {
      const raw = sessionStorage.getItem(BOOKING_IDEMPOTENCY_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      // Expire entries older than 10 minutes so stale in_flight markers don't lock the user out
      const now = Date.now();
      const fresh: Record<string, IdempotencyRecord> = {};
      Object.entries(parsed as Record<string, IdempotencyRecord>).forEach(([k, v]) => {
        if (v && typeof v.ts === "number" && now - v.ts < 10 * 60 * 1000) fresh[k] = v;
      });
      return fresh;
    } catch { return {}; }
  };
  const writeIdempotency = (key: string, record: IdempotencyRecord) => {
    try {
      const map = readIdempotencyMap();
      map[key] = record;
      sessionStorage.setItem(BOOKING_IDEMPOTENCY_KEY, JSON.stringify(map));
    } catch { /* ignore quota errors */ }
  };
  const buildIdempotencyKey = (p: NonNullable<typeof planResult>): string => {
    const parts = [
      p.destination,
      p.startDate.toISOString(),
      p.endDate.toISOString(),
      p.flight?.airline || "",
      p.flight?.departTime || "",
      p.hotel?.name || "",
      String(p.estimatedCost ?? ""),
    ];
    return parts.join("|");
  };

  /**
   * Records the booked trip and files its expenses.
   *
   * `paidAmount` is the amount Duffel actually charged (from the created order).
   * It's passed in after a real payment so the flight expense reflects what was
   * charged rather than the quoted fare — those can differ by taxes/fees.
   */
  /** Plan the trip for a meeting on the calendar, with its days and time attached. */
  const planFromCalendar = (proposal: TripProposal) => {
    const query = proposalQuery(proposal);
    setTripInput(query);
    void runInitialPlan(query, proposal);
  };

  /** What ties a saved trip to the calendar meeting it was planned for, if any. */
  const calendarLinkFields = () => {
    const link = calendarLinkRef.current;
    if (!link) return {};
    return {
      sourceCalendarEventId: link.eventIds[0],
      sourceCalendarEventTitle: link.title,
      sourceCalendarEventIds: link.eventIds,
      sourceCalendarSnapshot: link.snapshot,
    };
  };

  /**
   * Save a flight the traveler booked on the airline's own site (United).
   *
   * Flyby didn't book or charge this — the traveler did, and is telling us the
   * confirmation code and what they paid. It is saved as a confirmed trip,
   * marked with where it was booked, and the fare is filed as an expense.
   * Throws when the trip can't be saved, so the form stays open with the
   * details still in it.
   */
  const handleAddExternalBooking = async (search: HandoffSearch, booking: ExternalBooking) => {
    const site = UNITED.site;
    const atNoon = (isoDate: string) => new Date(`${isoDate}T12:00:00`);
    const start = atNoon(booking.departureDate);
    const end = atNoon(booking.returnDate || booking.departureDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Those dates couldn't be read. Check them and try again.");
    }
    const created = createTrip({
      destination: search.destinationLabel,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      purpose: search.purpose || "Business trip",
      flight: {
        airline: booking.airline,
        departTime: booking.departTime || "",
        returnTime: booking.arrivalTime || "",
        flightNumber: booking.flightNumber,
        departureAirport: booking.departureAirport,
        arrivalAirport: booking.arrivalAirport,
        arrivalTime: booking.arrivalTime,
        stops: booking.stops,
        price: booking.totalPaid,
        tripType: booking.returnDate ? "round_trip" : "one_way",
        returnFlightNumber: booking.returnFlightNumber,
        returnDepartTime: booking.returnDepartTime,
        returnArrivalTime: booking.returnArrivalTime,
        bookingReference: booking.confirmationCode,
        bookedVia: site,
      },
      hotel: null,
      estimatedCost: booking.totalPaid,
      booked: true,
      ...calendarLinkFields(),
    });
    if (!created || !created.id) {
      throw new Error("The trip couldn't be saved. Your United booking isn't affected — try again.");
    }

    try {
      addExpense({
        merchant: booking.airline,
        description: `Flight${booking.flightNumber ? ` ${booking.flightNumber}` : ""} to ${search.destinationLabel}`,
        date: start.toISOString(),
        amount: booking.totalPaid,
        category: "flight",
        status: "pending",
        location: search.destinationLabel,
        paymentMethod: bookedOnSite(site),
        reimbursable: true,
        tripId: created.id,
        tripName: search.destinationLabel,
        tripDates: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`,
      });
    } catch (expenseErr) {
      console.warn("Expense import failed (non-fatal):", expenseErr);
    }

    setPlanResult(null);
    setPendingPlanResult(null);
    setShowHotelStep(false);
    setSelectedFlightFromResults(null);
    setFlightResults([]);
    clearBookingFlow();
    setTripInput("");
    toast.success(`United booking added — confirmation ${booking.confirmationCode}`, {
      description: `Saved to your trips with a $${booking.totalPaid.toFixed(2)} flight expense. No hotel is included.`,
    });
    navigate("/trips");
  };

  /**
   * Record a trip whose flight has just been paid for and ticketed.
   *
   * Only ever called after a successful flight order, with that order. The trip
   * is saved as confirmed, carrying the airline's confirmation. The hotel, if
   * one was chosen, is saved as *not yet reserved* and then offered for
   * reservation — it becomes "reserved", and an expense, only once the hotel
   * actually confirms.
   */
  const handleSaveDraft = async (booking: { charged?: number; order?: BookingResult["order"] }) => {
    const paidAmount = booking.charged;
    if (!planResult || isBooking) return;
    const idempotencyKey = buildIdempotencyKey(planResult);
    const existing = readIdempotencyMap()[idempotencyKey];

    if (existing?.status === "completed") {
      toast.info("This trip is already booked.", {
        action: { label: "View Calendar", onClick: () => navigate("/trips?view=calendar") },
      });
      setPlanResult(null);
      setPendingPlanResult(null);
      setShowHotelStep(false);
      setSelectedFlightFromResults(null);
      setFlightResults([]);
      clearBookingFlow();
      setTripInput("");
      navigate("/trips");
      return;
    }
    if (existing?.status === "in_flight") {
      toast.warning("Booking already in progress — please wait.");
      return;
    }

    setIsBooking(true);
    writeIdempotency(idempotencyKey, { status: "in_flight", ts: Date.now() });
    try {
      const startDate = planResult.startDate.toISOString();
      const endDate = planResult.endDate.toISOString();
      // Carry the actual route + flight details onto the saved trip. This is what
      // lets "Rebook" later search live flights for the same route and dates
      // without the traveler re-entering anything.
      const bookedFlight = selectedFlightFromResults;
      // The hotel that was chosen, if it can still be reserved from its live
      // search result. Saved on the trip as not reserved until it really is.
      const chosenHotel = planResult.hotel?.id
        ? ((planResult as TripPlan & { _hotels?: HotelOption[] })._hotels || [])
            .find((h) => h.id === planResult.hotel.id && h.live)
        : undefined;
      const tripHotel: LocalTripHotel | null = planResult.hotel?.name
        ? {
            name: planResult.hotel.name,
            location: planResult.hotel.location,
            pricePerNight: planResult.hotel.pricePerNight,
            totalPrice: planResult.hotel.totalPrice,
            nights: planResult.hotel.nights,
            currency: planResult.hotel.currency,
            dueAtAccommodation: planResult.hotel.dueAtAccommodation,
            reserved: false,
          }
        : null;
      const created = createTrip({
        destination: planResult.destination, startDate, endDate,
        purpose: planResult.purpose,
        flight: {
          ...planResult.flight,
          ...(bookedFlight
            ? {
                flightNumber: bookedFlight.flightNumber,
                departureAirport: bookedFlight.origin,
                arrivalAirport: bookedFlight.destination,
                arrivalTime: bookedFlight.arrivalTime,
                duration: bookedFlight.duration,
                stops: bookedFlight.stops,
                price: bookedFlight.price,
                arriveDayOffset: bookedFlight.arriveDayOffset,
                tripType: bookedFlight.tripType,
                returnFlightNumber: bookedFlight.returnFlightNumber,
                returnDepartTime: bookedFlight.returnDepartureTime,
                returnArrivalTime: bookedFlight.returnArrivalTime,
                returnArriveDayOffset: bookedFlight.returnArriveDayOffset,
                returnDuration: bookedFlight.returnDuration,
                returnStops: bookedFlight.returnStops,
              }
            : {}),
          // The airline's confirmation — what makes this a booking and not a plan.
          ...(booking.order
            ? { bookingReference: booking.order.bookingReference, orderId: booking.order.id }
            : {}),
        },
        hotel: tripHotel,
        estimatedCost: planResult.estimatedCost, confidenceLevel: planResult.confidenceLevel,
        booked: Boolean(booking.order),
        ...calendarLinkFields(),
      });
      if (!created || !created.id) {
        throw new Error("Trip could not be saved. Please try again.");
      }
      writeIdempotency(idempotencyKey, { status: "completed", tripId: created.id, ts: Date.now() });

      // Booking a trip files its real expenses automatically, so the Expenses
      // page reflects what was actually booked without anyone re-typing it.
      // Guarded by the same idempotency key as the booking, so a retry can't
      // duplicate them. Non-fatal: a failure here must not undo the booking.
      try {
        const tripDates = `${format(planResult.startDate, "MMM d")} – ${format(planResult.endDate, "MMM d, yyyy")}`;
        // Prefer what was actually charged; fall back to the quoted fare.
        const flightCost = paidAmount ?? bookedFlight?.price ?? 0;
        if (flightCost > 0) {
          addExpense({
            merchant: bookedFlight?.airline || planResult.flight.airline || "Airline",
            description: `Flight${bookedFlight?.flightNumber ? ` ${bookedFlight.flightNumber}` : ""} to ${planResult.destination}`,
            date: startDate,
            amount: flightCost,
            category: "flight",
            status: "pending",
            location: planResult.destination,
            paymentMethod: "Booked in Flyby",
            reimbursable: true,
            tripId: created.id,
            tripName: planResult.destination,
            tripDates,
          });
        }
        // No hotel expense here. Choosing a hotel isn't paying for one — it is
        // filed when the reservation is actually made and charged (below).
      } catch (expenseErr) {
        console.warn("Expense import failed (non-fatal):", expenseErr);
      }

      try {
        createChat(`${planResult.destination} Trip`, []);
      } catch (chatErr) {
        console.warn("Chat creation failed (non-fatal):", chatErr);
      }
      const isEarly = planResult.flight.departTime.includes("AM") && parseInt(planResult.flight.departTime) < 10;
      recordBookingChoice({ isEarlyFlight: isEarly, isDirect: true, isBudgetOption: planResult.estimatedCost < 2000 });
      const reference = booking.order?.bookingReference;
      const tripDatesLabel = `${format(planResult.startDate, "MMM d")} – ${format(planResult.endDate, "MMM d, yyyy")}`;
      const tripName = planResult.destination;
      setPlanResult(null);
      setPendingPlanResult(null);
      setShowHotelStep(false);
      setSelectedFlightFromResults(null);
      setFlightResults([]);
      clearBookingFlow();
      setTripInput("");

      if (chosenHotel && tripHotel) {
        // Flight is ticketed and the trip is saved. Now reserve the hotel —
        // staying here until that's done or declined.
        const traveler = booking.order?.passengers?.[0];
        toast.success(reference ? `Flight booked — confirmation ${reference}` : "Flight booked", {
          description: "Next: reserve your hotel.",
        });
        setHotelReservation({
          hotel: chosenHotel,
          tripId: created.id,
          tripHotel,
          tripName,
          tripDates: tripDatesLabel,
          startDate,
          guest: {
            given_name: traveler?.given_name,
            family_name: traveler?.family_name,
            email: traveler?.email,
            phone_number: traveler?.phone_number,
          },
        });
      } else {
        toast.success(reference ? `Flight booked — confirmation ${reference}` : "Flight booked", {
          description: tripHotel ? undefined : "No hotel is included on this trip.",
          action: { label: "View Calendar", onClick: () => navigate("/trips?view=calendar") },
        });
        navigate("/trips");
      }
    } catch (err) {
      // Clear the in_flight marker so the user can retry
      try {
        const map = readIdempotencyMap();
        delete map[idempotencyKey];
        sessionStorage.setItem(BOOKING_IDEMPOTENCY_KEY, JSON.stringify(map));
      } catch { /* ignore */ }
      // The flight is already paid for and ticketed at this point — only saving
      // the trip record failed. Say that, not "booking failed": the traveler
      // must not think they need to buy the ticket again.
      const message = err instanceof Error ? err.message : "The trip couldn't be saved.";
      const reference = booking.order?.bookingReference;
      console.error("Saving the booked trip failed:", err);
      toast.error("Your flight is booked, but the trip didn't save", {
        description: `${reference ? `Airline confirmation ${reference}. ` : ""}${message} Retry to save it — you won't be charged again.`,
        duration: 30000,
        action: { label: "Retry", onClick: () => handleSaveDraft(booking) },
      });
    } finally {
      setIsBooking(false);
    }
  };

  // "Confirm & Book": when the chosen flight is a real Duffel offer, open the
  // payment system (card + 3-D Secure) and only record the trip after payment
  // succeeds. For a non-bookable (mock/fallback) flight, save the itinerary
  // directly as before.
  const handleConfirmBook = () => {
    if (!planResult || isBooking) return;
    const planFlights = (planResult as TripPlan & { _flights?: Flight[] })._flights;
    const offer =
      selectedFlightFromResults && selectedFlightFromResults.id.startsWith("off_")
        ? selectedFlightFromResults
        : planFlights?.find(
            (f) =>
              f.id.startsWith("off_") &&
              f.airline === planResult.flight.airline &&
              f.departureTime === planResult.flight.departTime,
          );
    if (offer) {
      setBookingFlight(offer); // open the Duffel payment modal
    } else {
      // No live fare behind this itinerary, so there is nothing to buy. This
      // used to save the trip anyway and report it as booked — a trip with no
      // ticket. Say so and let them search again.
      toast.error("This fare is no longer available", {
        description: "Search the trip again to get current flights before booking.",
      });
    }
  };

  // Autonomous mode: once the assembled itinerary is in state, take the traveler
  // straight to payment with the flight and hotel already chosen — the same
  // screen the manual flow ends on, minus the picking.
  //
  // Deliberately does NOT save the trip and navigate away: that skipped past the
  // booking entirely. And when only estimated fares came back there is nothing
  // real to pay for, so the itinerary is left on screen to review rather than
  // being quietly filed.
  useEffect(() => {
    if (!pendingAutoBook || !planResult) return;
    setPendingAutoBook(false);

    const planFlights = (planResult as TripPlan & { _flights?: Flight[] })._flights;
    const offer =
      selectedFlightFromResults && selectedFlightFromResults.id.startsWith("off_")
        ? selectedFlightFromResults
        : planFlights?.find((f) => f.id.startsWith("off_"));

    if (offer) {
      setBookingFlight(offer); // opens the payment modal, pre-filled
    } else {
      toast.info("Itinerary ready to review", {
        description: "That fare is no longer available, so this can't be paid for yet.",
      });
    }
  }, [pendingAutoBook, planResult, selectedFlightFromResults]);

  const handleDeleteClick = (trip: { id: string; destination: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setTripToDelete(trip);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!tripToDelete) return;
    deleteTrip(tripToDelete.id);
    setRemovedIds(prev => new Set(prev).add(tripToDelete.id));
    setDeleteDialogOpen(false);
    setTripToDelete(null);
    toast.success("Trip removed");
  };

  const { trips: localTrips } = useTrips();

  const formatTripDates = useCallback((startDate: string | undefined, endDate: string | undefined): string => {
    try {
      if (!startDate || !endDate) return "TBD";
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "TBD";
      return `${format(start, 'MMM d')}-${format(end, 'd, yyyy')}`;
    } catch { return "TBD"; }
  }, []);

  const upcomingTrips = useMemo(() => {
    if (!Array.isArray(localTrips)) return demoMode ? getDemoTrips().filter(t => !removedIds.has(t.id)) : [];
    const activeLocalTrips = localTrips.filter(t => t && t.id && (t.status === 'draft' || t.status === 'pending' || t.status === 'confirmed') && !removedIds.has(t.id));
    const nonDemoActive = demoMode ? activeLocalTrips : activeLocalTrips.filter(t => !t.id.startsWith('demo_'));
    if (nonDemoActive.length > 0) {
      return nonDemoActive.slice(0, 4).map(t => ({
        id: t.id, destination: t.destination || "Unknown destination",
        dates: formatTripDates(t.startDate, t.endDate),
        status: t.status === 'confirmed' ? 'approved' as const : t.status === 'pending' ? 'pending' as const : 'draft' as const,
        purpose: t.purpose || "Business travel",
        estimatedCost: typeof t.estimatedCost === 'number' ? t.estimatedCost : 0,
      }));
    }
    return demoMode ? getDemoTrips().filter(t => !removedIds.has(t.id)) : [];
  }, [localTrips, formatTripDates, removedIds, demoMode]);

  // No sample trips. The only seeded trip in Flyby is the single booked one used
  // to exercise the rebooking flow, and it lives in src/data/demoTrips.ts.
  function getDemoTrips(): { id: string; destination: string; dates: string; status: "approved" | "pending" | "draft"; purpose: string; estimatedCost: number }[] {
    return [];
  }

  const exampleQueries = [
    "Book me a flight to LA next Thursday",
    "I have a conference in Berlin in July",
    "Plan a 3-day trip to Austin for SXSW",
    "Find me a hotel near Times Square for Tuesday",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
  };

  // A failed search, shown inside the chat window above the conversation or
  // the itinerary.
  const plannerError = (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <Card className="border-destructive bg-destructive/10 max-w-3xl mx-auto">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}><X className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl mx-auto space-y-10 pb-36 md:pb-24">

      {/* ─── PAGE HEADER ─── */}
      <motion.div variants={itemVariants} className="pt-2 md:pt-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Corporate travel, without the chaos.
        </h1>
      </motion.div>

      {/* ─── CALENDAR (moved here from the Trips page) ─── */}
      <ScrollReveal delay={0.05}>
        <Card className="border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarClock className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-base">Calendar</h2>
                <p className="text-sm text-muted-foreground">
                  {calendarAgent.connected ? (
                    <>Watching <span className="text-foreground">{calendarAgent.account || "your calendar"}</span> for meetings that need travel booked.</>
                  ) : (
                    "Connect one calendar and Flyby will spot meetings that need travel booked."
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/trips?view=calendar")}>
                <CalendarDays className="w-4 h-4" />
                View calendar
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setCalendarDialogOpen(true)}>
                <Calendar className="w-4 h-4" />
                Sync calendar
              </Button>
            </div>
          </div>

          {/* Meetings on the connected calendar that need a trip. One click
              plans it: the travel days are already worked out from the
              meeting, and flights are ranked to land in time for it. */}
          {calendarAgent.unbooked.length > 0 && (
            <div className="border-t border-border/50 px-5 pb-5 pt-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="w-4 h-4 text-primary" />
                Meetings that need a trip
              </p>
              <div className="mt-3 space-y-2">
                {calendarAgent.unbooked.slice(0, 3).map(({ proposal }) => (
                  <div key={proposal.key} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{proposal.meetingLabel}</span>
                        <span className="text-muted-foreground"> · {proposal.destinationCity}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {proposal.plan}.
                        {proposal.cityInferred && ` The event doesn't name a city — Flyby AI read this as ${proposal.destinationCity}.`}
                        {proposal.existingTravel && ` ${proposal.existingTravel}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" disabled={isPlanning} onClick={() => planFromCalendar(proposal)}>
                      Plan trip
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </ScrollReveal>

      {/* ─── HOTEL SELECTION STEP ─── */}
      <HotelSelectionPage
        open={showHotelStep}
        onClose={handleSkipHotel}
        hotels={hotelOptions}
        selectedHotel={null}
        onSelect={handleSelectHotelFromStep}
        nights={pendingPlanResult ? Math.max(1, Math.ceil((pendingPlanResult.endDate.getTime() - pendingPlanResult.startDate.getTime()) / (1000 * 60 * 60 * 24))) : 2}
        venueName={pendingPlanResult?.destination || "destination"}
      />

      {/* ─── OPERATIONS + FINANCE PANELS ─── */}
      <ScrollReveal delay={0.15}>
        <div className={cn("grid gap-6", demoMode ? "md:grid-cols-2" : "md:grid-cols-1 max-w-2xl mx-auto")}>
          {/* Team traveling now — demo only */}
          {demoMode && (
          <Card className="border border-border/50 shadow-sm">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-base">Team traveling now</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/team")}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
            <CardContent className="pt-0 space-y-1">
              {teamTraveling.map((member) => (
                <div key={member.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group" onClick={() => setSelectedTraveler(member)}>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{member.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{member.destination}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              member.statusType === "success" && "bg-success",
                              member.statusType === "warning" && "bg-warning",
                              member.statusType === "info" && "bg-primary",
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${(member.journeyStep / member.totalSteps) * 100}%` }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {member.journeyStep}/{member.totalSteps}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80">
                        Trip step {member.journeyStep} of {member.totalSteps}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs shrink-0",
                      member.statusType === "warning" && "bg-warning/10 text-warning border-warning/20",
                      member.statusType === "success" && "bg-success/10 text-success border-success/20",
                      member.statusType === "info" && "bg-primary/10 text-primary border-primary/20",
                    )}
                  >
                    {member.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          )}

          {/* Travel spend overview */}
          <Card className="border border-border/50 shadow-sm">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-base">Travel spend overview</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/expenses")}>
                  Details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
            <CardContent className="pt-0 space-y-5">
              {/* Real spend only — no sample figures. */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">$0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Connect a card to start tracking.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/expenses")}>
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Connect a card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* ─── UPCOMING TRIPS ─── */}
      <ScrollReveal delay={0.25}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming trips</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/trips")} className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {upcomingTrips.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
              <Plane className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-muted-foreground text-center">No upcoming trips yet.</p>
              <p className="text-sm text-muted-foreground/70 text-center">Use the command bar above to plan your next trip.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {upcomingTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-200 relative"
                >
                  <button
                    onClick={(e) => handleDeleteClick(trip, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
                    aria-label="Remove trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{trip.destination}</h3>
                        <p className="text-sm text-muted-foreground">{trip.dates}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          trip.status === "approved" && "bg-success/10 text-success",
                          trip.status === "pending" && "bg-warning/10 text-warning",
                          trip.status === "draft" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {trip.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                    {trip.estimatedCost > 0 && <span className="text-sm font-semibold text-foreground">${trip.estimatedCost.toLocaleString()}</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollReveal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this trip?</DialogTitle>
            <DialogDescription>
              This will cancel your booking and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Remove trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── KPI Drawer ─── */}
      <KPIDrawer open={kpiDrawer.open} onOpenChange={open => setKpiDrawer(prev => ({ ...prev, open }))} type={kpiDrawer.type} />

      {/* Traveler Detail Panel */}
      <TravelerDetailPanel
        traveler={selectedTraveler}
        open={!!selectedTraveler}
        onClose={() => setSelectedTraveler(null)}
      />

      {/* Trip Spend Slide-Over */}
      <TripSpendSlideOver
        trip={selectedSpendTrip}
        open={!!selectedSpendTrip}
        onClose={() => setSelectedSpendTrip(null)}
      />

      {/* ─── Refine Modal ─── */}
      {planResult && <RefineModal open={isRefineOpen} onOpenChange={setIsRefineOpen} destination={planResult.destination} dates={planResult.dates} flights={(planResult as TripPlan & { _flights?: Flight[] })._flights} hotels={(planResult as TripPlan & { _hotels?: HotelOption[] })._hotels} currentFlight={planResult.flight} currentHotel={planResult.hotel} currentCost={planResult.estimatedCost} nights={Math.max(1, Math.ceil((planResult.endDate.getTime() - planResult.startDate.getTime()) / (1000 * 60 * 60 * 24)))} onSave={handleRefineSave} />}

      {/* ─── Payment / booking (Duffel card + 3-D Secure) ─── */}
      <FlightBookingModal
        open={bookingFlight !== null}
        onOpenChange={(open) => { if (!open) setBookingFlight(null); }}
        flight={bookingFlight}
        onBooked={(result) => {
          // Once payment succeeds, close the modal and record the trip locally
          // (calendar entry). handleSaveDraft creates the trip; it does not
          // charge — the charge already happened via Duffel.
          if (result.ok) {
            setBookingFlight(null);
            // Pass the amount Duffel actually charged so the auto-filed flight
            // expense matches the real charge, not just the quoted fare.
            const charged = Number(result.order?.totalAmount);
            handleSaveDraft({
              charged: Number.isFinite(charged) && charged > 0 ? charged : undefined,
              order: result.order,
            });
          }
        }}
      />

      {/* ─── Hotel reservation (after the flight is ticketed) ─── */}
      <HotelBookingModal
        open={hotelReservation !== null}
        hotel={hotelReservation?.hotel ?? null}
        guestDefaults={hotelReservation?.guest}
        onBooked={(result) => {
          if (!result.ok || !result.booking || !hotelReservation) return;
          const reserved = result.booking;
          // Now it is a reservation: record the hotel's confirmation on the
          // trip and file what was actually charged.
          updateTrip(hotelReservation.tripId, {
            hotel: {
              ...hotelReservation.tripHotel,
              totalPrice: reserved.totalPrice,
              currency: reserved.currency,
              reserved: true,
              bookingReference: reserved.reference,
              bookingId: reserved.id,
            },
          });
          try {
            const nights = hotelReservation.tripHotel.nights ?? 1;
            addExpense({
              merchant: reserved.hotelName || hotelReservation.tripHotel.name,
              description: `${nights} night${nights > 1 ? "s" : ""} in ${hotelReservation.tripName}`,
              date: hotelReservation.startDate,
              amount: reserved.totalPrice,
              category: "hotel",
              status: "pending",
              location: hotelReservation.tripHotel.location || hotelReservation.tripName,
              paymentMethod: "Booked in Flyby",
              reimbursable: true,
              tripId: hotelReservation.tripId,
              tripName: hotelReservation.tripName,
              tripDates: hotelReservation.tripDates,
            });
          } catch (expenseErr) {
            console.warn("Hotel expense import failed (non-fatal):", expenseErr);
          }
        }}
        onOpenChange={(open) => {
          if (open) return;
          // Closed — reserved or not, the trip is already saved. Go to it.
          setHotelReservation(null);
          navigate("/trips");
        }}
      />

      {/* Sync calendar, from the Calendar card. */}
      <CalendarSyncDialog
        open={calendarDialogOpen}
        onOpenChange={(open) => {
          setCalendarDialogOpen(open);
          // Show a new or removed connection on the card straight away.
          if (!open) void calendarAgent.refresh();
        }}
        onConnected={() => void calendarAgent.refresh()}
      />

      {/* ─── TRIP PLANNER: the chat window behind the button in the corner ─── */}
      <ChatDock open={chatOpen} onOpenChange={setChatOpen} busy={isPlanning || isThinking}>
        {activeThreadId && !planResult ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            {plannerError}

            {/* ─── CHAT THREAD (results live here as assistant messages) ─── */}
            {activeThreadId && !planResult && (
              <BookingChatThread
                fill
                messages={messages}
                isThinking={isThinking}
                threads={threadList}
                activeThreadId={activeThreadId}
                onSend={handleSendFollowUp}
                onNewTrip={handleNewTrip}
                onSelectThread={handleSelectThread}
                onDeleteThread={handleDeleteThread}
                onSelectFlight={(f) => handleSelectFlight(f)}
                onAddExternalBooking={handleAddExternalBooking}
                onUseDates={handleUseDates}
                onSelectHotel={(h) => {
                  const cur = lastResults;
                  const top = cur?.flights[0];
                  if (!top) return;
                  const parsed = parseTravelRequestCached(tripInput || (messages.find(m => m.role === "user") as { text: string } | undefined)?.text || "");
                  const destAirport = parsed.destination?.airports[0];
                  const startDate = parsed.dates?.departure || new Date(Date.now() + 7 * 86400000);
                  const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 86400000);
                  const destLabel = destAirport ? `${destAirport.city}, ${destAirport.country}` : top.destination;
                  const finalPlan: TripPlan & { _flights?: Flight[]; _hotels?: HotelOption[] } = {
                    destination: destLabel,
                    dates: `${format(startDate, "MMM d")}–${format(endDate, "MMM d")}`,
                    startDate, endDate,
                    datesAssumed: !parsed.dates?.departure,
                    datesConfirmed: !!parsed.dates?.departure,
                    needsDateClarification: false,
                    purpose: calendarLinkRef.current?.title || parsePurpose(tripInput),
                    flight: { airline: top.airline, departTime: top.departureTime, returnTime: top.arrivalTime },
                    hotel: { name: h.name, location: h.area },
                    estimatedCost: top.price + h.totalPrice,
                    confidenceLevel: 96,
                    originalPrompt: tripInput,
                    _flights: cur?.flights ?? [top],
                    _hotels: cur?.hotels ?? [h],
                  };
                  setPlanResult(finalPlan);
                }}
              />
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Start a trip: the box that used to lead the home page. */}
            {!activeThreadId && (
              <div>
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Your AI-powered travel command center.
                </p>

                {(showLearnedBadge || preferenceLabels.length > 0) && (
                  <div className="flex justify-center mb-3">
                    <PreferencesIndicator labels={preferenceLabels} showLearnedBadge={showLearnedBadge} />
                  </div>
                )}

                <form
                  onSubmit={(e) => { e.preventDefault(); handlePlanTrip(); }}
                  className="relative rounded-2xl border-2 border-border bg-card shadow-xl overflow-hidden transition-all focus-within:border-primary/30 focus-within:shadow-2xl"
                >
                  <div className="flex items-center gap-3 px-5 py-4">
                    <Sparkles className="w-5 h-5 text-muted-foreground shrink-0" />
                    <motion.input
                      type="text"
                      placeholder="Search anywhere: Paris, Texas, Tokyo, Japan, or ‘NYC to London April 10–20’"
                      value={tripInput}
                      onChange={e => { setTripInput(e.target.value); if (inputError) setInputError(null); }}
                      whileFocus={{ scale: 1.005 }}
                      transition={{ duration: 0.15 }}
                      disabled={voiceRecording.state !== 'idle'}
                      className="flex-1 bg-transparent text-base md:text-lg outline-none placeholder:text-muted-foreground/60 disabled:opacity-60"
                    />

                    {/* Voice recording UI hidden until reliably wired. Keep state so confirm/edit handlers don't crash. */}

                    <Button
                      type="submit"
                      variant="cta"
                      size="default"
                      className="shrink-0 rounded-xl gap-2"
                      disabled={isPlanning || voiceRecording.state !== 'idle' || !tripInput.trim()}
                    >
                      {isPlanning ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Searching flights…</span></>
                      ) : (
                        <><Sparkles className="w-4 h-4" /><span>Plan trip</span></>
                      )}
                    </Button>
                  </div>
                </form>

                <AnimatePresence>
                  {voiceRecording.state === 'ready' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="mt-3 p-4 bg-card rounded-xl border border-border shadow-sm space-y-3"
                    >
                      <p className="text-sm text-muted-foreground">Use this request?</p>
                      <p className="text-sm font-medium text-foreground">"{voiceRecording.transcript}"</p>
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={handleConfirmVoice} className="gap-1"><Check className="w-3 h-3" />Confirm</Button>
                        <Button variant="outline" size="sm" onClick={handleEditVoice} className="gap-1"><Edit2 className="w-3 h-3" />Edit</Button>
                        <Button variant="ghost" size="sm" onClick={voiceRecording.cancelRecording}>Cancel</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {inputError && (
                    <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2 text-sm text-destructive flex items-center gap-1 justify-center">
                      <AlertCircle className="w-4 h-4" />{inputError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Example query suggestions (shown when no chat history yet, or always in non-demo) */}
                {(!demoMode || threadList.length === 0) && (
                  <div className="mt-5 flex flex-wrap gap-2 justify-center">
                    {exampleQueries.map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => { setTripInput(q); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick access: history when conversations exist */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Search by destination, dates, or trip type — e.g. "NYC next Monday" or "hotel in Austin under $200".
                </p>
              </div>
            )}

            {plannerError}

            {/* ─── PROPOSED ITINERARY ─── */}
            <AnimatePresence>
              {planResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto">
                  <Card className="border-2 border-success/30 shadow-lg overflow-hidden">
                    <div className="p-6 bg-success/5 border-b border-success/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-success/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Proposed Itinerary</h3>
                            <p className="text-sm text-muted-foreground">
                              {planResult.destination} · {planResult.dates}
                              {planResult.datesAssumed && !planResult.datesConfirmed && <span className="ml-1 italic">(suggested dates)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => setPlanResult(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <div className="grid gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <Plane className="w-5 h-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{planResult.flight.airline}{planResult.flight.from && planResult.flight.to && <span className="font-normal text-muted-foreground"> · {planResult.flight.from} → {planResult.flight.to}</span>}</p>
                            {(() => {
                              // The offer that will actually be bought carries the full
                              // detail; the plan's own strings are the fallback.
                              const f = selectedFlightFromResults;
                              const plus = (days?: number) => (days ? ` (+${days} day${days > 1 ? "s" : ""})` : "");
                              const stopsText = (n?: number) => (n === undefined ? "" : n === 0 ? " · Nonstop" : ` · ${n} stop${n > 1 ? "s" : ""}`);
                              const roundTrip = f?.tripType === "round_trip";
                              return (
                                <>
                                  <p className="text-sm text-muted-foreground">
                                    {roundTrip ? "Out: " : ""}Departs {planResult.flight.departTime} · Arrives {planResult.flight.returnTime}{plus(f?.arriveDayOffset)}
                                    {f?.duration ? ` · ${f.duration}` : ""}{stopsText(f?.stops)}
                                  </p>
                                  {roundTrip ? (
                                    <>
                                      <p className="text-sm text-muted-foreground">
                                        Back: {f?.returnOrigin} → {f?.returnDestination} · Departs {f?.returnDepartureTime} · Arrives {f?.returnArrivalTime}{plus(f?.returnArriveDayOffset)}
                                        {f?.returnDuration ? ` · ${f.returnDuration}` : ""}{stopsText(f?.returnStops)}
                                      </p>
                                      {f?.returnDestination && f.origin && f.returnDestination !== f.origin && (
                                        <p className="text-xs text-warning mt-0.5">
                                          Returns to {f.returnDestination}, not {f.origin} — a different airport from the one you leave from.
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-xs text-warning mt-0.5">
                                      {(planResult as TripPlan & { _returnUnavailable?: boolean })._returnUnavailable
                                        ? "One-way fare — no airline sells this as a round trip for your dates, so the flight home is not included and needs booking separately."
                                        : "One-way fare — no return flight is included."}
                                    </p>
                                  )}
                                  {f && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      ${f.price.toLocaleString()} {roundTrip ? "round trip" : "one way"}{f.identityDocumentsRequired ? " · passport details required" : ""}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        {/* Why this flight, and what it was chosen over. Without this
                            the card is a price with no way to judge it — the traveler
                            can't tell the cheapest of 600 fares from a bad pick. */}
                        {(() => {
                          const f = selectedFlightFromResults;
                          const results = lastResults;
                          if (!f || !results) return null;
                          const advice = results.advice && results.advice.pickId === f.id ? results.advice : null;
                          const facts = f.ranking;
                          if (!advice && !facts) return null;
                          const considered = results.ranking?.considered ?? 0;
                          const others = results.flights.filter((x) => x.id !== f.id && x.id.startsWith("off_")).slice(0, 2);
                          const describe = (x: Flight) =>
                            `${x.airline} · ${x.departureTime}${x.tripType === "round_trip" && x.returnDepartureTime ? `, back ${x.returnDepartureTime}` : ""}`;
                          return (
                            <div className="space-y-2">
                              {advice ? (
                                <div className="-mt-3"><PickAdvice advice={advice} /></div>
                              ) : facts && (facts.pluses.length > 0 || facts.notes.length > 0 || facts.issues.length > 0) ? (
                                <div className="rounded-lg border border-border/60 p-3 text-xs space-y-1">
                                  <p className="font-medium text-sm">About the flight you chose</p>
                                  {facts.issues.map((line) => <p key={line} className="text-destructive">{line}</p>)}
                                  {facts.pluses.length > 0 && <p className="text-muted-foreground">{facts.pluses.join(" · ")}</p>}
                                  {facts.notes.length > 0 && <p className="text-muted-foreground">Worth knowing: {facts.notes.slice(0, 2).join("; ")}</p>}
                                </div>
                              ) : null}
                              {(considered > 0 || others.length > 0) && (
                                <div className="px-1 text-xs text-muted-foreground space-y-1">
                                  {considered > 0 && (
                                    <p>
                                      Chosen from {considered.toLocaleString()} real fares for these dates
                                      {results.ranking?.requirements.length ? ` · ranked for: ${results.ranking.requirements.join(" · ")}` : ""}.
                                    </p>
                                  )}
                                  {(results.ranking?.notes ?? []).map((note) => <p key={note} className="text-warning">{note}</p>)}
                                  {others.map((x) => {
                                    const gap = x.price - f.price;
                                    const why = x.ranking?.issues[0] ?? x.ranking?.notes.find((n) => !n.includes("more than the cheapest")) ?? "";
                                    return (
                                      <p key={x.id}>
                                        <span className="text-foreground/80">Also considered:</span> {describe(x)} · ${x.price.toLocaleString()}
                                        {gap > 0 ? ` (${"$"}${gap.toLocaleString()} more)` : gap < 0 ? ` (${"$"}${Math.abs(gap).toLocaleString()} less)` : " (same price)"}
                                        {why ? ` — ${why}` : ""}
                                      </p>
                                    );
                                  })}
                                  {others.length > 0 && <p>Use Refine to switch to any of them.</p>}
                                </div>
                              )}
                              {results.dateHint && (
                                <DateHintRow hint={results.dateHint} shownDates={results.chips.dateLabel} onUse={handleUseDates} busy={isThinking || isBooking} />
                              )}
                            </div>
                          );
                        })()}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <Building2 className="w-5 h-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            {planResult.hotel.name ? (
                              <>
                                <p className="font-medium truncate">{planResult.hotel.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{planResult.hotel.location}</p>
                                {(planResult.hotel.pricePerNight || planResult.hotel.totalPrice) && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {planResult.hotel.pricePerNight ? `$${planResult.hotel.pricePerNight}/night` : null}
                                    {planResult.hotel.pricePerNight && planResult.hotel.totalPrice ? " · " : null}
                                    {planResult.hotel.totalPrice
                                      ? `$${planResult.hotel.totalPrice.toLocaleString()} total${planResult.hotel.nights ? ` (${planResult.hotel.nights} ${planResult.hotel.nights === 1 ? "night" : "nights"})` : ""}`
                                      : null}
                                    {planResult.hotel.dueAtAccommodation ? ` · plus $${planResult.hotel.dueAtAccommodation.toLocaleString()} in fees at the hotel` : null}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Reserved right after the flight is booked, at the room rate you choose.
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  const plan = planResult as TripPlan & { _hotels?: HotelOption[]; _hotelNote?: HotelSearchFailure };
                                  // Hotels were available and none was picked, versus
                                  // none could be offered at all — different things.
                                  return (plan._hotels || []).length > 0
                                    ? "No hotel selected. Use Refine to add one."
                                    : hotelUnavailableMessage(plan._hotelNote);
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /><span className="font-medium">Estimated Total</span></div>
                        <span className="text-2xl font-bold text-primary">${planResult.estimatedCost.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground -mt-1">
                        Flight{planResult.hotel.name ? " and hotel" : ""}. The exact amount is confirmed with the airline{planResult.hotel.name ? " and hotel" : ""} before you pay.
                      </p>
                      <div className="flex gap-3 pt-1">
                        <Button variant="default" className="flex-1" onClick={handleConfirmBook} disabled={isBooking}>{isBooking ? "Booking…" : "Confirm & Book"}</Button>
                        <Button variant="outline" className="flex-1" onClick={handleRefine}>Refine</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </ChatDock>
    </motion.div>
  );
}
