import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, Sparkles, ArrowRight, Clock, DollarSign, Loader2, AlertCircle, Hotel, X, Brain, ChevronRight, Mic, Square, Check, Edit2, TrendingUp, TrendingDown, Users, Shield, ArrowUpRight, Building2, Trash2, CreditCard } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { PreferencesIndicator } from "@/components/trips/PreferencesIndicator";
import { useTrips } from "@/hooks/useTrips";
import { useChats } from "@/hooks/useChats";
import { usePreferences } from "@/hooks/usePreferences";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parsePurpose } from "@/services/tripTemplates";
import { parseTravelRequest } from "@/services/travelSearchParser";
import { generateMockFlights } from "@/services/mockFlightService";
import { FlightResults, type Flight } from "@/components/flights/FlightResults";
import { HotelSelectionPage } from "@/components/trips/HotelSelectionPage";
import { getHotelsForDestination } from "@/services/mockHotelService";
import { generateUberOptions, type GroundTransportOption } from "@/services/mockGroundTransportService";
import { BookingChatThread, type ChatMsg, type ChatThreadMeta, type BookingResults } from "@/components/home/BookingChatThread";
import type { HotelOption } from "@/components/chats/booking/types";
import { RefineModal } from "@/components/home/RefineModal";
import { KPIDrawer, type KPIType } from "@/components/home/KPIDrawer";
import type { CalendarEvent } from "@/services/mockCalendarService";
import { cn } from "@/lib/utils";
import { getRandomHeadline } from "@/data/heroHeadlines";
import { TravelerDetailPanel } from "@/components/home/TravelerDetailPanel";
import { TripSpendSlideOver, getTripSpendData } from "@/components/home/TripSpendSlideOver";
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
  };
  hotel: {
    name: string;
    location: string;
  };
  groundTransport: string;
  estimatedCost: number;
  confidenceLevel: number;
  originalPrompt: string;
}

// Generate trip plan based on parsed destination
const generateTripPlan = async (prompt: string): Promise<TripPlan | { needsDestination: true; flights?: never }> => {
  await new Promise(r => setTimeout(r, 850));

  const parsed = parseTravelRequest(prompt);
  const destAirport = parsed.destination?.airports[0];
  if (!destAirport) return { needsDestination: true };

  // Default origin to user's home airport (SEA) when not parsed
  const DEFAULT_HOME = { code: "SEA", city: "Seattle" };
  const originAirport = parsed.origin?.airports[0] || { code: DEFAULT_HOME.code, city: DEFAULT_HOME.city } as any;
  const purpose = parsePurpose(prompt);

  const hotelBrands = ["Four Seasons", "Marriott", "Hyatt Regency", "Westin", "CitizenM", "InterContinental"];
  const hotelAreas = ["City Center", "Financial District", "Waterfront", "Convention Quarter", "Old Town"];

  const now = new Date();
  const startDate = parsed.dates?.departure || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const datesAssumed = !parsed.dates?.departure;

  const destLabel = `${destAirport.city}, ${destAirport.country}`;
  const originCode = originAirport.code;
  const destCode = destAirport.code;
  const cabinClass = parsed.cabinClass || "economy";
  const passengers = parsed.passengers || 1;

  const hotelName = `${hotelBrands[Math.floor(Math.random() * hotelBrands.length)]} ${destAirport.city}`;
  const hotelLocation = `${hotelAreas[Math.floor(Math.random() * hotelAreas.length)]}, ${destAirport.city}`;
  const estimatedCostBase = destAirport.country === "United States" || destAirport.country === "USA" ? 1450 : 2850;

  // Generate flight results
  const flights = generateMockFlights(originCode, destCode, cabinClass, passengers);

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
      airline: flights[0]?.airline || "United Airlines",
      departTime: flights[0]?.departureTime || "7:45 AM",
      returnTime: flights[0]?.arrivalTime || "5:30 PM",
    },
    hotel: { name: hotelName, location: hotelLocation },
    groundTransport: `Airport transfer from ${destCode} + local mobility pass`,
    estimatedCost: flights[0]?.price || (estimatedCostBase + Math.floor(Math.random() * 450) - 125),
    confidenceLevel: Math.min(98, 92 + Math.floor(Math.random() * 4)),
    originalPrompt: prompt,
    _flights: flights,
    _parsed: parsed,
    _originCode: originCode,
    _originCity: originAirport.city,
    _destCode: destCode,
    _destCity: destAirport.city,
  } as TripPlan & { _flights: Flight[]; _parsed: ReturnType<typeof parseTravelRequest>; _originCode: string; _originCity: string; _destCode: string; _destCity: string };
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

// Apply a follow-up intent to last results
function applyFollowUp(text: string, prev: BookingResults): { results: BookingResults; note: string } {
  const t = text.toLowerCase();
  let results = { ...prev, flights: [...prev.flights], hotels: [...prev.hotels], ground: [...prev.ground] };
  let note = "Refining your search…";

  if (/nonstop|non-stop|direct/.test(t)) {
    const nonstop = prev.flights.filter(f => f.stops === 0);
    results.flights = nonstop.length > 0 ? nonstop : prev.flights;
    note = nonstop.length > 0
      ? "Filtered to nonstop options only."
      : "No nonstop options on this route — keeping the best alternatives.";
  } else if (/cheap|cheaper|less expensive|lower price|budget/.test(t)) {
    results.flights = [...prev.flights].sort((a, b) => a.price - b.price);
    results.hotels = [...prev.hotels].sort((a, b) => a.pricePerNight - b.pricePerNight);
    note = "Sorted by lowest price across flights and hotels.";
  } else if (/day after|next day|tomorrow|push.*day|shift.*day/.test(t)) {
    const shift = (label?: string) => label ? `${label} (+1 day)` : label;
    results.chips = { ...prev.chips, dateLabel: shift(prev.chips.dateLabel) };
    // Re-roll prices slightly to feel different
    results.flights = prev.flights.map(f => ({ ...f, price: Math.max(120, f.price + Math.round((Math.random() - 0.3) * 80)) }));
    note = "Shifted the trip one day later. Here are updated options.";
  } else if (/different hotel|other hotel|another hotel|new hotel|swap hotel/.test(t)) {
    results.hotels = [...prev.hotels.slice(1), prev.hotels[0]].filter(Boolean);
    note = "Here are different hotel options near your destination.";
  }
  return { results, note };
}

// Demo team members traveling with live journey status
const travelJourneyStatuses = [
  "At gate B12", "Boarded plane", "In flight", "Landed", "In transit to hotel",
  "Checked into hotel", "In meeting", "At conference", "Heading to airport", "Returning today",
  "Flight delayed", "Boarding soon", "Taxi to hotel", "Working remotely",
];

const teamTraveling = [
  { name: "Julia Chen", destination: "Seattle, WA", status: "Boarded plane", journeyStep: 2, totalSteps: 5, statusType: "info" as const, initials: "JC", tripId: "demo_trip_seattle_2025" },
  { name: "Mark Thompson", destination: "Chicago, IL", status: "Checked into hotel", journeyStep: 4, totalSteps: 5, statusType: "success" as const, initials: "MT", tripId: "demo_trip_chi_2025" },
  { name: "Priya Patel", destination: "New York, NY", status: "Heading to airport", journeyStep: 5, totalSteps: 5, statusType: "warning" as const, initials: "PP", tripId: "demo_trip_nyc_2025" },
  { name: "Alex Rivera", destination: "San Francisco, CA", status: "In meeting", journeyStep: 4, totalSteps: 6, statusType: "success" as const, initials: "AR", tripId: "demo_trip_sf_2025" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { demoMode } = useDemoMode();
  const { createTrip, deleteTrip } = useTrips();
  const { createChat } = useChats();
  const { preferences, getActivePreferenceLabels, hasLearnedPreferences, recordBookingChoice } = usePreferences();
  const [tripInput, setTripInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<TripPlan | null>(null);
  const [flightResults, setFlightResults] = useState<Flight[]>([]);
  // Kept as a no-op setter for backward-compat with helpers that mirror current results.
  const setBookingResults = (_v: BookingResults | null) => { void _v; };
  const [selectedFlightFromResults, setSelectedFlightFromResults] = useState<Flight | null>(null);
  const [showHotelStep, setShowHotelStep] = useState(false);
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);
  const [pendingPlanResult, setPendingPlanResult] = useState<TripPlan | null>(null);
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

  const threadList: ChatThreadMeta[] = storedThreads.map(({ id, title, createdAt }) => ({ id, title, createdAt }));

  const preferenceLabels = getActivePreferenceLabels();
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
      _parsed?: ReturnType<typeof parseTravelRequest>;
      _originCode?: string; _originCity?: string;
      _destCode?: string; _destCity?: string;
    };
    const rawFlights = anyResult._flights || [];
    const parsed = anyResult._parsed;
    const nights = Math.max(1, Math.ceil((anyResult.endDate.getTime() - anyResult.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const hotels = getHotelsForDestination({ destination: anyResult.destination, nights });
    const ground = generateUberOptions(15);

    // Re-rank flights to respect "avoid layovers" preference.
    // Nonstop preferred even at a moderate price premium; otherwise keep original order.
    const preferredAirlines = preferences.preferredAirlines || [];
    const avoidLayovers = preferences.avoidsLayovers;
    const minPrice = rawFlights.reduce((m, f) => Math.min(m, f.price), Infinity);
    const scoreFlight = (f: typeof rawFlights[number]) => {
      let score = 0;
      if (avoidLayovers) score += f.stops === 0 ? 0 : 1000 + f.stops * 500;
      else score += f.stops * 80;
      score += Math.max(0, f.price - minPrice) * (avoidLayovers ? 0.4 : 1);
      if (preferredAirlines.includes(f.airline)) score -= 60;
      return score;
    };
    const flights = [...rawFlights].sort((a, b) => scoreFlight(a) - scoreFlight(b));

    const anchor = parsed?.locationAnchor;
    const dateLabel = parsed?.dates?.raw
      ? parsed.dates.raw
      : `${format(anyResult.startDate, "MMM d")}–${format(anyResult.endDate, "MMM d")}`;

    const topFlight = flights[0];
    const topHotel = hotels[0];
    const topGround = ground[0];

    const reasons: { flight?: string; hotel?: string; ground?: string } = {};
    if (topFlight) {
      const stopsLabel =
        topFlight.stops === 0
          ? "Nonstop"
          : `${topFlight.stops} stop${topFlight.stops > 1 ? "s" : ""}`;
      const isCheapest = topFlight.price === minPrice;
      const airlinePreferred = preferredAirlines.includes(topFlight.airline);
      const bits: string[] = [];
      bits.push(
        `${stopsLabel} ${anyResult._originCode}→${anyResult._destCode} on ${topFlight.airline} (${topFlight.flightNumber}), departs ${topFlight.departureTime} · ${topFlight.duration} · $${topFlight.price}.`,
      );
      const why: string[] = [];
      if (topFlight.stops === 0 && avoidLayovers) why.push("nonstop matches your avoid-layovers preference");
      else if (topFlight.stops === 0) why.push("nonstop service");
      else if (avoidLayovers) why.push("no nonstop available on this route — best connecting option");
      if (airlinePreferred) why.push(`on your preferred carrier ${topFlight.airline}`);
      if (isCheapest) why.push("lowest fare available");
      else why.push("competitive fare for the schedule");
      reasons.flight = `${bits[0]} Picked because ${why.join(", ")}.`;
    }
    if (topHotel) {
      reasons.hotel = anchor
        ? `Closest in-policy hotel to your meeting (${topHotel.distanceToVenue} from ${anchor}). Matches your preferred brands.`
        : `Top-rated in-policy hotel in ${topHotel.area}. Matches your preferred brands.`;
    }
    if (topGround) {
      reasons.ground = `Fastest pickup at ${anyResult._destCode} with ${topGround.eta} ETA. Estimated $${topGround.priceMin}–$${topGround.priceMax} to your hotel.`;
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
      ground,
      reasons,
      nights,
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
  };

  const handleDeleteThread = (id: string) => {
    setStoredThreads(prev => {
      const out = prev.filter(t => t.id !== id);
      try { localStorage.setItem(THREADS_KEY, JSON.stringify(out)); } catch { /* ignore */ }
      return out;
    });
    if (activeThreadId === id) handleNewTrip();
  };

  const runInitialPlan = async (text: string) => {
    setError(null); setInputError(null); setNeedsDestination(false); setFlightResults([]);
    setPlanResult(null);
    setIsPlanning(true); setIsThinking(true);
    startNewThread(text);
    try {
      const result = await generateTripPlan(text);
      if ("needsDestination" in result) {
        setNeedsDestination(true);
        pushAssistantText("I couldn't find a destination in that request — can you try again with a city or airport?");
        return;
      }
      const built = buildResultsFromPlan(result);
      if (built) pushAssistantResults(built);
    } catch {
      setError("Failed to generate trip plan. Please try again.");
      pushAssistantText("Something went wrong searching for that trip. Please try again.");
    } finally {
      setIsPlanning(false); setIsThinking(false);
    }
  };

  const handleSendFollowUp = async (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: newMsgId(), role: "user", text },
      { id: newMsgId(), role: "assistant", kind: "loading" },
    ]);
    setIsThinking(true);
    await new Promise(r => setTimeout(r, 450));
    try {
      if (lastResults) {
        const { results, note } = applyFollowUp(text, lastResults);
        pushAssistantResults(results, note);
      } else {
        // No prior results — treat as a fresh search
        const result = await generateTripPlan(text);
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

  // Consume a pre-filled query handed off from another page (e.g. /trips → "Plan trip")
  useEffect(() => {
    let prefill: string | null = null;
    try { prefill = sessionStorage.getItem("flyby_prefill_query"); } catch { /* ignore */ }
    if (prefill) {
      try { sessionStorage.removeItem("flyby_prefill_query"); } catch { /* ignore */ }
      setTripInput(prefill);
      // Run on next tick so other state is settled
      setTimeout(() => { runInitialPlan(prefill!); }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlightFromResults(flight);
    setFlightResults([]);
    // Build partial plan, then show hotel step
    const parsed = parseTravelRequest(tripInput);
    const destAirport = parsed.destination?.airports[0];
    const now = new Date();
    const startDate = parsed.dates?.departure || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const destLabel = destAirport ? `${destAirport.city}, ${destAirport.country}` : flight.destination;
    const nights = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const partialPlan: TripPlan = {
      destination: destLabel,
      dates: `${format(startDate, "MMM d")}–${format(endDate, "MMM d")}`,
      startDate, endDate,
      datesAssumed: !parsed.dates?.departure,
      datesConfirmed: !!parsed.dates?.departure,
      needsDateClarification: false,
      purpose: parsePurpose(tripInput),
      flight: { airline: flight.airline, departTime: flight.departureTime, returnTime: flight.arrivalTime },
      hotel: { name: "", location: "" },
      groundTransport: `Airport transfer from ${flight.destination} + local mobility pass`,
      estimatedCost: flight.price,
      confidenceLevel: 96,
      originalPrompt: tripInput,
    };

    setPendingPlanResult(partialPlan);
    // Generate hotel options for the destination
    const hotels = getHotelsForDestination({ destination: destLabel, nights });
    setHotelOptions(hotels);
    setShowHotelStep(true);
  };

  const handleSelectHotelFromStep = (hotel: HotelOption) => {
    if (!pendingPlanResult) return;
    const finalPlan: TripPlan = {
      ...pendingPlanResult,
      hotel: { name: hotel.name, location: hotel.area },
      estimatedCost: pendingPlanResult.estimatedCost + hotel.totalPrice,
    };
    setPlanResult(finalPlan);
    setPendingPlanResult(null);
    setShowHotelStep(false);
    setHotelOptions([]);
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
    flight: { airline: string; departTime: string; returnTime: string };
    hotel: { name: string; location: string };
    groundTransport: string;
    estimatedCost: number;
  }) => {
    if (planResult) {
      setPlanResult({ ...planResult, ...selections });
      toast.success("Trip options updated");
    }
  };

  const handleSaveDraft = () => {
    if (!planResult) return;
    const startDate = planResult.startDate.toISOString();
    const endDate = planResult.endDate.toISOString();
    createTrip({
      destination: planResult.destination, startDate, endDate,
      purpose: planResult.purpose, flight: planResult.flight,
      hotel: planResult.hotel, groundTransport: null,
      estimatedCost: planResult.estimatedCost, confidenceLevel: planResult.confidenceLevel,
    });
    createChat(`${planResult.destination} Trip`, []);
    const isEarly = planResult.flight.departTime.includes("AM") && parseInt(planResult.flight.departTime) < 10;
    recordBookingChoice({ isEarlyFlight: isEarly, isDirect: true, isBudgetOption: planResult.estimatedCost < 2000 });
    toast.success("Trip booked and added to calendar.", {
      action: { label: "View Calendar", onClick: () => navigate("/trips") },
    });
    setPlanResult(null);
    setTripInput("");
    navigate("/trips");
  };

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

  function getDemoTrips() {
    return [
      { id: "demo_trip_sf_2025", destination: "San Francisco, CA", dates: "May 12-14, 2026", status: "approved" as const, purpose: "Client meeting", estimatedCost: 1850 },
      { id: "demo_trip_seattle_2025", destination: "Seattle, WA", dates: "Jun 2-4, 2026", status: "pending" as const, purpose: "Team offsite", estimatedCost: 2100 },
    ];
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

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl mx-auto space-y-10 pb-20 md:pb-0">

      {/* ─── HERO + COMMAND BAR (only when no active conversation) ─── */}
      {!activeThreadId && (
        <>
          <motion.div variants={itemVariants} className="text-center pt-4 md:pt-8 space-y-3">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Corporate travel, without the chaos.
            </motion.h1>
          </motion.div>

          <ScrollReveal delay={0.1}>
            <motion.div
              className="relative mx-auto max-w-3xl"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.p
                className="text-sm text-muted-foreground text-center mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                Your AI-powered travel command center.
              </motion.p>

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
              {threadList.length > 0 && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {threadList.length} past conversation{threadList.length === 1 ? "" : "s"} — use the chat thread to revisit them after your next search.
                </p>
              )}
            </motion.div>
          </ScrollReveal>
        </>
      )}

      {/* ─── ERROR BANNER ─── */}
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

      {/* ─── CHAT THREAD (results live here as assistant messages) ─── */}
      {activeThreadId && !planResult && (
        <BookingChatThread
          messages={messages}
          isThinking={isThinking}
          threads={threadList}
          activeThreadId={activeThreadId}
          onSend={handleSendFollowUp}
          onNewTrip={handleNewTrip}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onSelectFlight={(f) => handleSelectFlight(f)}
          onSelectHotel={(h) => {
            const cur = lastResults;
            const top = cur?.flights[0];
            if (!top) return;
            const parsed = parseTravelRequest(tripInput || (messages.find(m => m.role === "user") as { text: string } | undefined)?.text || "");
            const destAirport = parsed.destination?.airports[0];
            const startDate = parsed.dates?.departure || new Date(Date.now() + 7 * 86400000);
            const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 86400000);
            const destLabel = destAirport ? `${destAirport.city}, ${destAirport.country}` : top.destination;
            const finalPlan: TripPlan = {
              destination: destLabel,
              dates: `${format(startDate, "MMM d")}–${format(endDate, "MMM d")}`,
              startDate, endDate,
              datesAssumed: !parsed.dates?.departure,
              datesConfirmed: !!parsed.dates?.departure,
              needsDateClarification: false,
              purpose: parsePurpose(tripInput),
              flight: { airline: top.airline, departTime: top.departureTime, returnTime: top.arrivalTime },
              hotel: { name: h.name, location: h.area },
              groundTransport: `Airport transfer from ${top.destination} + local mobility pass`,
              estimatedCost: top.price + h.totalPrice,
              confidenceLevel: 96,
              originalPrompt: tripInput,
            };
            setPlanResult(finalPlan);
          }}
        />
      )}




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
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">{planResult.confidenceLevel}%</Badge>
                    <Button variant="ghost" size="icon-sm" onClick={() => setPlanResult(null)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Plane className="w-5 h-5 text-primary" />
                    <div className="flex-1"><p className="font-medium">{planResult.flight.airline}</p><p className="text-sm text-muted-foreground">Depart {planResult.flight.departTime} · Return {planResult.flight.returnTime}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      {planResult.hotel.name ? (
                        <><p className="font-medium">{planResult.hotel.name}</p><p className="text-sm text-muted-foreground">{planResult.hotel.location}</p></>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hotel selected — you can add one later</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /><span className="font-medium">Estimated Total</span></div>
                  <span className="text-2xl font-bold text-primary">${planResult.estimatedCost.toLocaleString()}</span>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="default" className="flex-1" onClick={handleSaveDraft}>Save as Draft</Button>
                  <Button variant="outline" className="flex-1" onClick={handleRefine}>Refine</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <div className="flex items-center gap-2 mt-1.5">
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
              {demoMode ? (
                <>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight text-foreground">$10,840</span>
                      <span className="flex items-center gap-0.5 text-sm font-medium text-success">
                        <TrendingDown className="w-3.5 h-3.5" /> 12%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Monthly spend · vs last month</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming high-cost trips</p>
                    <div className="space-y-1.5">
                      <div 
                        className="group/row flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 cursor-pointer transition-colors"
                        onClick={() => setSelectedSpendTrip(getTripSpendData("demo_trip_london_2025"))}
                      >
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">SF → London (Team offsite)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">$1,650</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover/row:text-muted-foreground transition-colors" />
                        </div>
                      </div>
                      <div 
                        className="group/row flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 cursor-pointer transition-colors"
                        onClick={() => setSelectedSpendTrip(getTripSpendData("demo_trip_tokyo_2025"))}
                      >
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">NYC → Tokyo (Client visit)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">$2,500</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover/row:text-muted-foreground transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-foreground">$0</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Connect a card to start tracking.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/expenses")}>
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Connect a card
                  </Button>
                </div>
              )}
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
      {planResult && <RefineModal open={isRefineOpen} onOpenChange={setIsRefineOpen} destination={planResult.destination} dates={planResult.dates} currentFlight={planResult.flight} currentHotel={planResult.hotel} currentGroundTransport={planResult.groundTransport} currentCost={planResult.estimatedCost} onSave={handleRefineSave} />}
    </motion.div>
  );
}
