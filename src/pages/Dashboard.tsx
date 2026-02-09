import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, Sparkles, ArrowRight, Clock, DollarSign, Loader2, AlertCircle, Hotel, Car, X, ChevronRight, Mic, Square, Check, Edit2 } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { PreferencesIndicator } from "@/components/trips/PreferencesIndicator";
import { useTrips } from "@/hooks/useTrips";
import { useChats } from "@/hooks/useChats";
import { usePreferences } from "@/hooks/usePreferences";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { findDestination, findLandmark, parseDates, parsePurpose, destinationTemplates, ParsedDateResult } from "@/services/tripTemplates";
import { RefineModal } from "@/components/home/RefineModal";
import { KPIDrawer, type KPIType } from "@/components/home/KPIDrawer";
import { TripPlanningModal, type TripProposal } from "@/components/home/TripPlanningModal";
import type { CalendarEvent } from "@/services/mockCalendarService";

interface TripPlan {
  destination: string;
  dates: string;
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

const generateTripPlan = async (prompt: string): Promise<TripPlan | { needsDestination: true }> => {
  await new Promise(r => setTimeout(r, 900));
  const template = findDestination(prompt);
  if (!template) return { needsDestination: true };

  const dateResult = parseDates(prompt);
  const purpose = parsePurpose(prompt);
  const landmark = findLandmark(prompt, template);
  const airline = template.airlines[Math.floor(Math.random() * template.airlines.length)];
  const hotelData = template.hotels.find(h => h.locations.includes(landmark)) || template.hotels[0];

  let confidence = 70;
  if (!dateResult.assumed) confidence += 15;
  if (purpose !== "business meeting") confidence += 10;
  confidence += Math.floor(Math.random() * 5);

  const costVariation = Math.floor(Math.random() * 300) - 150;
  return {
    destination: template.city,
    dates: dateResult.dates,
    datesAssumed: dateResult.assumed,
    datesConfirmed: !dateResult.assumed,
    needsDateClarification: dateResult.needsClarification || false,
    monthIntent: dateResult.monthIntent,
    purpose,
    flight: { airline, departTime: "7:45 AM", returnTime: "5:30 PM" },
    hotel: { name: hotelData.name, location: landmark },
    groundTransport: template.groundTransport,
    estimatedCost: template.baseCost + costVariation,
    confidenceLevel: Math.min(98, confidence),
    originalPrompt: prompt,
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createTrip } = useTrips();
  const { createChat } = useChats();
  const { getActivePreferenceLabels, hasLearnedPreferences, recordBookingChoice } = usePreferences();
  const [tripInput, setTripInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [needsDestination, setNeedsDestination] = useState(false);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [kpiDrawer, setKpiDrawer] = useState<{ open: boolean; type: KPIType }>({ open: false, type: "upcomingTrips" });
  const preferenceLabels = getActivePreferenceLabels();
  const showLearnedBadge = hasLearnedPreferences();

  const handleTranscriptReady = useCallback((transcript: string) => {
    setTripInput(transcript);
  }, []);

  const voiceRecording = useVoiceRecording({ onTranscriptReady: handleTranscriptReady, maxDuration: 60 });

  const handleConfirmVoice = useCallback(async () => {
    voiceRecording.confirmTranscript();
    setError(null);
    setInputError(null);
    setNeedsDestination(false);
    if (!tripInput.trim()) { setInputError("Please describe your trip first"); return; }
    setIsPlanning(true);
    setPlanResult(null);
    try {
      const result = await generateTripPlan(tripInput);
      if ("needsDestination" in result) setNeedsDestination(true);
      else setPlanResult(result);
    } catch { setError("Failed to generate trip plan. Please try again."); }
    finally { setIsPlanning(false); }
  }, [tripInput, voiceRecording]);

  const handleEditVoice = useCallback(() => { voiceRecording.confirmTranscript(); }, [voiceRecording]);

  const handlePlanTrip = async () => {
    setError(null); setInputError(null); setNeedsDestination(false);
    if (!tripInput.trim()) { setInputError("Please describe your trip first"); return; }
    setIsPlanning(true); setPlanResult(null);
    try {
      const result = await generateTripPlan(tripInput);
      if ("needsDestination" in result) setNeedsDestination(true);
      else setPlanResult(result);
    } catch { setError("Failed to generate trip plan. Please try again."); }
    finally { setIsPlanning(false); }
  };

  const handleCalendarSuggestion = async (suggestion: { event: string; location: string; date: string }) => {
    const prompt = `Trip to ${suggestion.location} for ${suggestion.event} on ${suggestion.date}`;
    setTripInput(prompt);
    setError(null); setInputError(null); setNeedsDestination(false);
    setIsPlanning(true); setPlanResult(null);
    try {
      const result = await generateTripPlan(prompt);
      if ("needsDestination" in result) setNeedsDestination(true);
      else setPlanResult(result);
    } catch { setError("Failed to generate trip plan. Please try again."); }
    finally { setIsPlanning(false); }
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

  const handleSelectCity = (city: string) => {
    const newPrompt = `${tripInput} to ${city}`;
    setTripInput(newPrompt);
    setNeedsDestination(false);
    setIsPlanning(true);
    setPlanResult(null);
    generateTripPlan(newPrompt).then(result => {
      if (!("needsDestination" in result)) setPlanResult(result);
    }).finally(() => setIsPlanning(false));
  };

  const handleSaveDraft = () => {
    if (!planResult) return;
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    createTrip({
      destination: planResult.destination, startDate, endDate,
      purpose: planResult.purpose, flight: planResult.flight,
      hotel: planResult.hotel, groundTransport: planResult.groundTransport,
      estimatedCost: planResult.estimatedCost, confidenceLevel: planResult.confidenceLevel,
    });
    createChat(`${planResult.destination} Trip`, []);
    const isEarly = planResult.flight.departTime.includes("AM") && parseInt(planResult.flight.departTime) < 10;
    recordBookingChoice({ isEarlyFlight: isEarly, isDirect: true, isBudgetOption: planResult.estimatedCost < 2000 });
    toast.success("Draft saved — you can find it under Draft Trips", {
      action: { label: "View Trips", onClick: () => navigate("/trips") },
    });
    setPlanResult(null);
    setTripInput("");
    navigate("/trips");
  };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
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
    const activeLocalTrips = localTrips.filter(t =>
      t && t.id && (t.status === 'draft' || t.status === 'pending' || t.status === 'confirmed')
    );
    if (activeLocalTrips.length > 0) {
      return activeLocalTrips.slice(0, 4).map(t => ({
        id: t.id || `trip_${Date.now()}`,
        destination: t.destination || "Unknown destination",
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
      { id: "demo_trip_sf_2025", destination: "San Francisco, CA", dates: "Jan 8-10, 2025", status: "approved" as const, purpose: "Client meeting", estimatedCost: 1850 },
      { id: "demo_trip_seattle_2025", destination: "Seattle, WA", dates: "Jan 15-17, 2025", status: "pending" as const, purpose: "Team offsite", estimatedCost: 2100 },
    ];
  }

  const calendarSuggestions = [{ id: 1, event: "Q1 Planning Meeting", location: "Chicago, IL", date: "Jan 20, 2025" }];
  const alerts = [{ id: 1, type: "warning", message: "Weather advisory for Seattle area — potential delays", trip: "Seattle trip", tripDestination: "Seattle, WA" }];

  const stats: { icon: typeof Plane; label: string; value: string; kpiType: KPIType }[] = [
    { icon: Plane, label: "Upcoming trips", value: "2", kpiType: "upcomingTrips" },
    { icon: Clock, label: "Hours saved", value: "48", kpiType: "hoursSaved" },
    { icon: DollarSign, label: "Pending expenses", value: "$1,240", kpiType: "pendingExpenses" },
    { icon: MapPin, label: "Miles traveled", value: "12,450", kpiType: "milesTraveled" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 md:pb-0">
      {/* Greeting — large, confident */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="pt-4"
      >
        <h1 className="text-4xl md:text-[42px] font-semibold tracking-tight text-foreground leading-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-lg text-muted-foreground mt-2 font-light">Where to next?</p>
      </motion.section>

      {/* Plan a Trip — hero card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Card className="overflow-hidden border-border/40">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Plan a trip</h2>
                <p className="text-sm text-muted-foreground">Describe your travel needs in natural language</p>
              </div>
            </div>

            {(showLearnedBadge || preferenceLabels.length > 0) && (
              <PreferencesIndicator labels={preferenceLabels} showLearnedBadge={showLearnedBadge} />
            )}

            {/* Input row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder='Try: "Flight to NYC next Tuesday for a client pitch near Times Square"'
                value={tripInput}
                onChange={e => { setTripInput(e.target.value); if (inputError) setInputError(null); }}
                onKeyDown={e => { if (e.key === 'Enter' && !isPlanning && voiceRecording.state === 'idle') handlePlanTrip(); }}
                disabled={voiceRecording.state !== 'idle'}
                className={`flex-1 h-12 px-4 rounded-xl border ${inputError ? 'border-destructive' : 'border-border'} bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all disabled:opacity-60`}
              />

              {voiceRecording.state === 'idle' && (
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl shrink-0" onClick={voiceRecording.startRecording} disabled={isPlanning}>
                  <Mic className="w-4 h-4" />
                </Button>
              )}
              {voiceRecording.state === 'recording' && (
                <Button variant="destructive" size="icon" className="h-12 w-12 rounded-xl shrink-0" onClick={voiceRecording.stopRecording}>
                  <Square className="w-3.5 h-3.5" />
                </Button>
              )}
              {voiceRecording.state === 'processing' && (
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl shrink-0" disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              )}

              <Button
                size="lg"
                variant="cta"
                className="shrink-0 rounded-xl h-12 px-6 gap-2"
                onClick={handlePlanTrip}
                disabled={isPlanning || voiceRecording.state !== 'idle' || !tripInput.trim()}
              >
                {isPlanning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Planning…</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>Plan trip</span></>
                )}
              </Button>
            </div>

            {/* Voice transcript confirmation */}
            <AnimatePresence>
              {voiceRecording.state === 'ready' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-4 bg-secondary rounded-xl space-y-3">
                  <p className="text-sm text-muted-foreground">Use this request?</p>
                  <p className="text-sm font-medium">"{voiceRecording.transcript}"</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleConfirmVoice} className="gap-1"><Check className="w-3 h-3" />Confirm</Button>
                    <Button variant="outline" size="sm" onClick={handleEditVoice} className="gap-1"><Edit2 className="w-3 h-3" />Edit</Button>
                    <Button variant="ghost" size="sm" onClick={voiceRecording.cancelRecording}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input error */}
            <AnimatePresence>
              {inputError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />{inputError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* City selection */}
            <AnimatePresence>
              {needsDestination && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <p className="text-sm text-muted-foreground">Which city are you traveling to?</p>
                  <div className="flex flex-wrap gap-2">
                    {["New York City", "Washington, DC", "Chicago", "San Francisco", "Los Angeles", "Seattle", "Austin", "Boston"].map(city => (
                      <Button key={city} variant="outline" size="sm" onClick={() => handleSelectCity(city)} className="rounded-full text-xs">{city}</Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.section>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}><X className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proposed Itinerary */}
      <AnimatePresence>
        {planResult && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <Card className="overflow-hidden border-border/40">
              <div className="p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold text-foreground">{planResult.destination}</h2>
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">{planResult.confidenceLevel}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {planResult.dates}
                      {planResult.datesAssumed && !planResult.datesConfirmed && <span className="italic ml-1">(suggested)</span>}
                      {planResult.datesConfirmed && <span className="text-success ml-1">✓ confirmed</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl -mr-2 -mt-2" onClick={() => setPlanResult(null)}><X className="w-4 h-4" /></Button>
                </div>

                {/* Details grid */}
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50">
                    <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{planResult.flight.airline}</p>
                      <p className="text-xs text-muted-foreground">Depart {planResult.flight.departTime} · Return {planResult.flight.returnTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50">
                    <Hotel className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{planResult.hotel.name}</p>
                      <p className="text-xs text-muted-foreground">{planResult.hotel.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50">
                    <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Ground transport</p>
                      <p className="text-xs text-muted-foreground">{planResult.groundTransport}</p>
                    </div>
                  </div>
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <span className="text-sm font-medium text-muted-foreground">Estimated total</span>
                  <span className="text-2xl font-semibold tracking-tight">${planResult.estimatedCost.toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="cta" className="flex-1 rounded-xl" onClick={handleSaveDraft}>Save as draft</Button>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={handleRefine}>Refine</Button>
                </div>
              </div>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Alerts — lightweight */}
      {alerts.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <AlertCircle className="w-4 h-4 text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.trip}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs shrink-0">View</Button>
            </div>
          ))}
        </motion.section>
      )}

      {/* Calendar suggestion */}
      {calendarSuggestions.length > 0 && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">From your calendar</h2>
          {calendarSuggestions.map(s => (
            <Card key={s.id} className="border-border/40">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.event} · {s.location}</p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl text-xs shrink-0" disabled={isPlanning} onClick={() => handleCalendarSuggestion(s)}>
                  Prepare options <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.section>
      )}

      {/* Stats — clean row */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <button
              key={stat.kpiType}
              onClick={() => setKpiDrawer({ open: true, type: stat.kpiType })}
              className="group text-left p-5 rounded-2xl bg-card border border-border/40 hover:border-border transition-all duration-200 hover:shadow-md"
            >
              <stat.icon className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </button>
          ))}
        </div>
      </motion.section>

      {/* KPI Drawer */}
      <KPIDrawer open={kpiDrawer.open} onOpenChange={open => setKpiDrawer(prev => ({ ...prev, open }))} type={kpiDrawer.type} />

      {/* Upcoming trips */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming trips</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/trips")}>
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {upcomingTrips.length === 0 ? (
          <Card className="border-dashed border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-2">
              <Plane className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No upcoming trips</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {upcomingTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="group text-left p-5 rounded-2xl bg-card border border-border/40 hover:border-border hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">{trip.destination}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{trip.dates}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    trip.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {trip.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{trip.purpose}</p>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground mt-2 ml-auto transition-colors" />
              </button>
            ))}
          </div>
        )}
      </motion.section>

      {/* Refine Modal */}
      {planResult && (
        <RefineModal
          open={isRefineOpen}
          onOpenChange={setIsRefineOpen}
          destination={planResult.destination}
          dates={planResult.dates}
          currentFlight={planResult.flight}
          currentHotel={planResult.hotel}
          currentGroundTransport={planResult.groundTransport}
          currentCost={planResult.estimatedCost}
          onSave={handleRefineSave}
        />
      )}
    </div>
  );
}
