import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, Sparkles, ArrowRight, Clock, DollarSign, Loader2, AlertCircle, Hotel, Car, X } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import AnimatedCard from "@/components/home/AnimatedCard";
import AlertCard from "@/components/home/AlertCard";

interface TripPlan {
  destination: string;
  dates: string;
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
}

// Mock AI function to generate trip plan
const generateTripPlan = async (prompt: string): Promise<TripPlan> => {
  await new Promise(r => setTimeout(r, 900));
  
  // Parse destination from prompt (simple extraction)
  const cityMatch = prompt.match(/(?:to|in|visit)\s+([A-Za-z\s]+?)(?:\s+(?:next|on|for|from|$))/i);
  const destination = cityMatch ? cityMatch[1].trim() : "New York City";
  
  // Parse dates if present
  const dateMatch = prompt.match(/(next\s+\w+|jan(?:uary)?\s+\d+|feb(?:ruary)?\s+\d+|mar(?:ch)?\s+\d+|\d+\/\d+)/i);
  const dates = dateMatch ? `${dateMatch[1]}, 2025` : "Jan 15-17, 2025";
  
  // Parse landmark if present
  const landmarkMatch = prompt.match(/near\s+([A-Za-z\s]+?)(?:\s+for|$|\.)/i);
  const landmark = landmarkMatch ? landmarkMatch[1].trim() : "downtown";
  
  return {
    destination,
    dates,
    flight: {
      airline: "United Airlines",
      departTime: "8:30 AM",
      returnTime: "6:45 PM"
    },
    hotel: {
      name: "Marriott Marquis",
      location: `Near ${landmark}`
    },
    groundTransport: "Uber/Lyft recommended - estimated $45-60 from airport",
    estimatedCost: 1850
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tripInput, setTripInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const handlePlanTrip = async () => {
    // Clear previous states
    setError(null);
    setInputError(null);
    
    // Validate input
    if (!tripInput.trim()) {
      setInputError("Please describe your trip first");
      return;
    }
    
    setIsPlanning(true);
    setPlanResult(null);
    
    try {
      const result = await generateTripPlan(tripInput);
      setPlanResult(result);
    } catch (err) {
      setError("Failed to generate trip plan. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRefine = () => {
    setPlanResult(null);
    setError(null);
  };

  const handleSaveDraft = () => {
    // For now just clear and show success
    setPlanResult(null);
    setTripInput("");
    alert("Trip saved as draft!");
  };
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Mock data for demo
  const upcomingTrips = [{
    id: 1,
    destination: "San Francisco, CA",
    dates: "Jan 8-10, 2025",
    status: "approved",
    purpose: "Client meeting"
  }, {
    id: 2,
    destination: "Seattle, WA",
    dates: "Jan 15-17, 2025",
    status: "pending",
    purpose: "Team offsite"
  }];
  const calendarSuggestions = [{
    id: 1,
    event: "Q1 Planning Meeting",
    location: "Chicago, IL",
    date: "Jan 20, 2025"
  }];
  const alerts = [{
    id: 1,
    type: "warning",
    message: "Weather advisory for Seattle area - potential delays",
    trip: "Seattle trip"
  }];
  const stats = [{
    icon: Plane,
    label: "Upcoming trips",
    value: "2",
    color: "text-primary"
  }, {
    icon: Clock,
    label: "Hours saved",
    value: "48",
    color: "text-success"
  }, {
    icon: DollarSign,
    label: "Pending expenses",
    value: "$1,240",
    color: "text-warning"
  }, {
    icon: MapPin,
    label: "Miles traveled",
    value: "12,450",
    color: "text-accent"
  }];

  // Container animation variants
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 16
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const
      }
    }
  };
  return <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0 bg-primary-foreground">
      {/* Welcome header */}
      <motion.div variants={itemVariants}>
        <motion.h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight" initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3,
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1] as const
      }}>
          {getGreeting()}, {firstName}
        </motion.h1>
        <motion.p className="text-lg text-muted-foreground mt-2" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.5,
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const
      }}>
          Your travel command center
        </motion.p>
      </motion.div>

      {/* AI Trip Input */}
      <ScrollReveal delay={0.1}>
        <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <motion.div animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }} transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#a3c5e0]">
                <Sparkles className="w-4 h-4 bg-[#a3c5e0] text-white" />
              </motion.div>
              <CardTitle className="text-lg">Plan a trip with AI</CardTitle>
            </div>
            <CardDescription>Describe your travel needs in natural language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <motion.input 
                  type="text" 
                  placeholder='Try: "Book me a flight to NYC next Tuesday for a client pitch near Times Square"' 
                  value={tripInput} 
                  onChange={e => {
                    setTripInput(e.target.value);
                    if (inputError) setInputError(null);
                  }} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !isPlanning) handlePlanTrip();
                  }}
                  whileFocus={{ scale: 1.01 }} 
                  transition={{ duration: 0.2 }} 
                  className={`w-full h-12 px-4 rounded-xl border ${inputError ? 'border-destructive' : 'border-border'} bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200`} 
                />
              </div>
              <motion.div whileHover={{ scale: isPlanning ? 1 : 1.02 }} whileTap={{ scale: isPlanning ? 1 : 0.98 }}>
                <Button 
                  variant="accent" 
                  size="lg" 
                  className="shrink-0 rounded-xl shadow-glow bg-[#a2c4e0] hover:bg-[#8ab4d6] text-white disabled:opacity-70"
                  onClick={handlePlanTrip}
                  disabled={isPlanning}
                >
                  {isPlanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Planning…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Plan trip
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
            
            {/* Input error message */}
            <AnimatePresence>
              {inputError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {inputError}
                </motion.p>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proposed Itinerary Results */}
      <AnimatePresence>
        {planResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-2 border-success/30 shadow-lg overflow-hidden">
              <CardHeader className="pb-4 bg-success/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-success" />
                    </div>
                    <CardTitle className="text-lg">Proposed Itinerary</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPlanResult(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription className="mt-2 text-base font-medium text-foreground">
                  {planResult.destination} • {planResult.dates}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Flight */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Plane className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Flight - {planResult.flight.airline}</p>
                    <p className="text-sm text-muted-foreground">
                      Depart: {planResult.flight.departTime} • Return: {planResult.flight.returnTime}
                    </p>
                  </div>
                </div>

                {/* Hotel */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Hotel className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{planResult.hotel.name}</p>
                    <p className="text-sm text-muted-foreground">{planResult.hotel.location}</p>
                  </div>
                </div>

                {/* Ground Transport */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Car className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Ground Transport</p>
                    <p className="text-sm text-muted-foreground">{planResult.groundTransport}</p>
                  </div>
                </div>

                {/* Estimated Cost */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="font-medium">Estimated Total Cost</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">${planResult.estimatedCost.toLocaleString()}</span>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={handleSaveDraft}
                  >
                    Save as Draft Trip
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleRefine}
                  >
                    Refine
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts */}
      {alerts.length > 0 && <ScrollReveal delay={0.15}>
          {alerts.map((alert, index) => <AlertCard key={alert.id} message={alert.message} trip={alert.trip} delay={index * 0.1} />)}
        </ScrollReveal>}

      {/* Calendar suggestions */}
      {calendarSuggestions.length > 0 && <ScrollReveal delay={0.2}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Travel suggestions from your calendar
          </h2>
          {calendarSuggestions.map(suggestion => <AnimatedCard key={suggestion.id} className="border-primary/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium">You have "{suggestion.event}" in {suggestion.location}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.date}</p>
                </div>
                <motion.div whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }}>
                  <Button variant="default" size="sm" className="rounded-xl">
                    Prepare travel options
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              </CardContent>
            </AnimatedCard>)}
        </ScrollReveal>}

      {/* Stats row */}
      <ScrollReveal delay={0.25}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => <AnimatedCard key={i} delay={i * 0.1}>
              <CardContent className="p-5">
                <motion.div whileHover={{
              rotate: [0, -10, 10, 0]
            }} transition={{
              duration: 0.5
            }}>
                  <stat.icon className="w-6 h-6 text-foreground mb-3" />
                </motion.div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </AnimatedCard>)}
        </div>
      </ScrollReveal>

      {/* Upcoming trips */}
      <ScrollReveal delay={0.3}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming trips</h2>
          <motion.div whileHover={{
          x: 4
        }} transition={{
          duration: 0.2
        }}>
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {upcomingTrips.map((trip, index) => <AnimatedCard key={trip.id} delay={index * 0.1}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div whileHover={{
                  scale: 1.1
                }} className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold">{trip.destination}</h3>
                      <p className="text-sm text-muted-foreground">{trip.dates}</p>
                    </div>
                  </div>
                  <motion.span initial={{
                scale: 0.9,
                opacity: 0
              }} animate={{
                scale: 1,
                opacity: 1
              }} transition={{
                delay: 0.3 + index * 0.1
              }} className={`text-xs px-2.5 py-1 rounded-full font-medium ${trip.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {trip.status}
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground">{trip.purpose}</p>
              </CardContent>
            </AnimatedCard>)}
        </div>
      </ScrollReveal>
    </motion.div>;
}