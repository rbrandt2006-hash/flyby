import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Plane, Heart, Armchair, Calendar, Check } from "lucide-react";
import flybyLogo from "@/assets/flyby-ai-logo.png.asset.json";
import { toast } from "sonner";

const STEPS = [
  { key: "airport", title: "What's your home airport?", icon: Plane },
  { key: "airlines", title: "Any preferred airlines?", icon: Heart },
  { key: "seat", title: "Seat preference?", icon: Armchair },
  { key: "calendar", title: "Connect your calendar", icon: Calendar },
] as const;

const AIRLINE_OPTIONS = ["Delta", "United", "American", "Alaska", "Southwest", "JetBlue", "British Airways", "Lufthansa", "Air France", "Emirates"];
const SEAT_OPTIONS = ["Window", "Aisle", "No preference"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [airport, setAirport] = useState("");
  const [airlines, setAirlines] = useState<string[]>([]);
  const [seat, setSeat] = useState<string>("");
  const [calendarConnected, setCalendarConnected] = useState(false);

  const toggleAirline = (a: string) =>
    setAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const finish = () => {
    try {
      const prefs = { airport: airport.trim().toUpperCase(), airlines, seat, calendarConnected };
      localStorage.setItem("flyby_onboarding_prefs", JSON.stringify(prefs));
      localStorage.setItem("flyby_onboarding_complete", "true");
      localStorage.removeItem("flyby_pending_onboarding");
    } catch { /* ignore */ }
    toast.success("You're all set. Welcome aboard.");
    navigate("/", { replace: true });
  };

  const next = () => {
    if (step === STEPS.length - 1) finish();
    else setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  const canContinue = (() => {
    if (step === 0) return airport.trim().length >= 3;
    if (step === 2) return !!seat;
    return true; // airlines + calendar are optional
  })();

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between max-w-md mx-auto w-full mb-6">
        <img src={flybyLogo.url} alt="Flyby AI" className="h-8 w-auto" />
        <button onClick={finish} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip for now
        </button>
      </div>

      {/* Progress */}
      <div className="max-w-md mx-auto w-full mb-8">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center">
        <div className="max-w-md w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">{current.title}</h1>
              </div>

              {step === 0 && (
                <div className="space-y-3">
                  <Label htmlFor="airport">Airport code or city</Label>
                  <Input
                    id="airport"
                    value={airport}
                    onChange={(e) => setAirport(e.target.value)}
                    placeholder="e.g. SFO, JFK, London"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll default origin to this airport for every new trip.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Pick any you'd like to fly when prices are close.</p>
                  <div className="flex flex-wrap gap-2">
                    {AIRLINE_OPTIONS.map(a => {
                      const active = airlines.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAirline(a)}
                          className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        >
                          {active && <Check className="w-3 h-3 inline mr-1" />}
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  {SEAT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSeat(opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${seat === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{opt}</span>
                        {seat === opt && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Flyby reads upcoming events from your calendar so we can pre-book trips. Connect now or do it later in Settings.
                  </p>
                  <Button
                    type="button"
                    variant={calendarConnected ? "outline" : "default"}
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      setCalendarConnected(true);
                      toast.success("Calendar connection saved — finish setup in Settings → Integrations.");
                    }}
                    disabled={calendarConnected}
                  >
                    <Calendar className="w-4 h-4" />
                    {calendarConnected ? "Calendar connection saved" : "Connect Google Calendar"}
                  </Button>
                  {calendarConnected && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" /> We'll finish the OAuth handshake in Settings.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer nav */}
      <div className="max-w-md mx-auto w-full pt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={next} disabled={!canContinue} className="gap-2" size="lg">
          {step === STEPS.length - 1 ? "Finish" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
