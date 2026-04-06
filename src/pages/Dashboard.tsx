import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, Sparkles, ArrowRight, Clock, DollarSign, Loader2, AlertCircle, Hotel, X, Brain, ChevronRight, Mic, Square, Check, Edit2, TrendingUp, TrendingDown, Users, Shield, ArrowUpRight, Building2 } from "lucide-react";
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
import type { HotelOption } from "@/components/chats/booking/types";
import { RefineModal } from "@/components/home/RefineModal";
import { KPIDrawer, type KPIType } from "@/components/home/KPIDrawer";
import type { CalendarEvent } from "@/services/mockCalendarService";
import { cn } from "@/lib/utils";
import { getRandomHeadline } from "@/data/heroHeadlines";
import { TravelerDetailPanel } from "@/components/home/TravelerDetailPanel";
import { TripSpendSlideOver, getTripSpendData } from "@/components/home/TripSpendSlideOver";

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
  await new Promise(r => setTimeout(r, 350));

  const parsed = parseTravelRequest(prompt);
  const destAirport = parsed.destination?.airports[0];
  if (!destAirport) return { needsDestination: true };

  const originAirport = parsed.origin?.airports[0];
  const purpose = parsePurpose(prompt);

  const hotelBrands = ["Four Seasons", "Marriott", "Hyatt Regency", "Westin", "CitizenM", "InterContinental"];
  const hotelAreas = ["City Center", "Financial District", "Waterfront", "Convention Quarter", "Old Town"];

  const now = new Date();
  const startDate = parsed.dates?.departure || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endDate = parsed.dates?.return || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const datesAssumed = !parsed.dates?.departure;

  const destLabel = `${destAirport.city}, ${destAirport.country}`;
  const originCode = originAirport?.code || "---";
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
  } as TripPlan & { _flights: Flight[]; _parsed: ReturnType<typeof parseTravelRequest> };
};

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
  const { createTrip } = useTrips();
  const { createChat } = useChats();
  const { getActivePreferenceLabels, hasLearnedPreferences, recordBookingChoice } = usePreferences();
  const [tripInput, setTripInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<TripPlan | null>(null);
  const [flightResults, setFlightResults] = useState<Flight[]>([]);
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
  const preferenceLabels = getActivePreferenceLabels();
  const showLearnedBadge = hasLearnedPreferences();

  const handleTranscriptReady = useCallback((transcript: string) => {
    setTripInput(transcript);
  }, []);

  const voiceRecording = useVoiceRecording({ onTranscriptReady: handleTranscriptReady, maxDuration: 60 });

  const processResult = (result: Awaited<ReturnType<typeof generateTripPlan>>) => {
    if ("needsDestination" in result) {
      setNeedsDestination(true);
    } else {
      const anyResult = result as TripPlan & { _flights?: Flight[] };
      if (anyResult._flights?.length) {
        setFlightResults(anyResult._flights);
        setSelectedFlightFromResults(null);
        setPlanResult(null); // show flights first, not itinerary
      } else {
        setPlanResult(result);
      }
    }
  };

  const handleConfirmVoice = useCallback(async () => {
    voiceRecording.confirmTranscript();
    setError(null); setInputError(null); setNeedsDestination(false); setFlightResults([]);
    if (!tripInput.trim()) { setInputError("Please describe your trip first"); return; }
    setIsPlanning(true); setPlanResult(null);
    try { processResult(await generateTripPlan(tripInput)); }
    catch { setError("Failed to generate trip plan. Please try again."); }
    finally { setIsPlanning(false); }
  }, [tripInput, voiceRecording]);

  const handleEditVoice = useCallback(() => { voiceRecording.confirmTranscript(); }, [voiceRecording]);

  const handlePlanTrip = async (overrideInput?: string) => {
    console.log("submitted");
    const input = overrideInput ?? tripInput;
    setError(null); setInputError(null); setNeedsDestination(false); setFlightResults([]);
    if (!input.trim()) { setInputError("Please describe your trip first"); return; }
    if (overrideInput) setTripInput(overrideInput);
    setIsPlanning(true); setPlanResult(null);
    try { processResult(await generateTripPlan(input)); }
    catch { setError("Failed to generate trip plan. Please try again."); }
    finally { setIsPlanning(false); }
  };

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
    if (!Array.isArray(localTrips)) return getDemoTrips();
    const activeLocalTrips = localTrips.filter(t => t && t.id && (t.status === 'draft' || t.status === 'pending' || t.status === 'confirmed'));
    if (activeLocalTrips.length > 0) {
      return activeLocalTrips.slice(0, 4).map(t => ({
        id: t.id, destination: t.destination || "Unknown destination",
        dates: formatTripDates(t.startDate, t.endDate),
        status: t.status === 'confirmed' ? 'approved' as const : t.status === 'pending' ? 'pending' as const : 'draft' as const,
        purpose: t.purpose || "Business travel",
        estimatedCost: typeof t.estimatedCost === 'number' ? t.estimatedCost : 0,
      }));
    }
    return getDemoTrips();
  }, [localTrips, formatTripDates]);

  function getDemoTrips() {
    return [
      { id: "demo_trip_sf_2025", destination: "San Francisco, CA", dates: "May 12-14, 2026", status: "approved" as const, purpose: "Client meeting", estimatedCost: 1850 },
      { id: "demo_trip_seattle_2025", destination: "Seattle, WA", dates: "Jun 2-4, 2026", status: "pending" as const, purpose: "Team offsite", estimatedCost: 2100 },
    ];
  }

  const exampleCommands: string[] = [];

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

      {/* ─── HERO: Command Center ─── */}
      <motion.div variants={itemVariants} className="text-center pt-4 md:pt-8 space-y-4">
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {getRandomHeadline().split(/(?<=\.)/).map((part, i) => {
            const trimmed = part.trim();
            if (!trimmed) return null;
            // Make last portion muted
            if (i > 0) return <span key={i} className="text-muted-foreground font-semibold"><br />{trimmed}</span>;
            return <span key={i}>{trimmed}</span>;
          })}
        </motion.h1>
        <motion.p
          className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          Your AI-powered travel command center.
        </motion.p>
      </motion.div>

      {/* ─── MASSIVE CENTRAL COMMAND BAR ─── */}
      <ScrollReveal delay={0.1}>
        <motion.div
          className="relative mx-auto max-w-3xl"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Learned preferences */}
          {(showLearnedBadge || preferenceLabels.length > 0) && (
            <div className="flex justify-center mb-3">
              <PreferencesIndicator labels={preferenceLabels} showLearnedBadge={showLearnedBadge} />
            </div>
          )}

          {/* Command input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePlanTrip();
            }}
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

              {/* Voice button */}
              {voiceRecording.state === 'idle' && (
                <Button
                  type="button"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={voiceRecording.startRecording}
                  disabled={isPlanning}
                  aria-label="Record voice"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              )}
              {voiceRecording.state === 'recording' && (
                <Button
                  type="button"
                  size="icon"
                  className="shrink-0"
                  onClick={voiceRecording.stopRecording}
                  aria-label="Stop recording"
                >
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-destructive-foreground" />
                </Button>
              )}
              {voiceRecording.state === 'processing' && (
                <Button type="button" variant="ghost" size="icon" disabled className="shrink-0">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </Button>
              )}

              {/* Plan trip CTA */}
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

          {/* Voice transcript confirmation */}
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

          {/* Input error */}
          <AnimatePresence>
            {inputError && (
              <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2 text-sm text-destructive flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4" />{inputError}
              </motion.p>
            )}
          </AnimatePresence>

        </motion.div>
      </ScrollReveal>

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

      {/* ─── FLIGHT RESULTS ─── */}
      <AnimatePresence>
        {flightResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
            <FlightResults
              flights={flightResults}
              departureDate={parseTravelRequest(tripInput).dates?.departure || new Date()}
              returnDate={parseTravelRequest(tripInput).dates?.return}
              tripType={parseTravelRequest(tripInput).tripType}
              passengers={parseTravelRequest(tripInput).passengers || 1}
              onSelect={handleSelectFlight}
              onBack={() => setFlightResults([])}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team traveling now */}
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
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">$48,230</span>
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
                      <span className="text-sm font-semibold">$4,200</span>
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
                      <span className="text-sm font-semibold">$5,800</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover/row:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </div>
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
            {upcomingTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="group cursor-pointer rounded-xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
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
          </div>
        )}
      </ScrollReveal>

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
