import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, Sparkles, ArrowRight, Clock, DollarSign } from "lucide-react";
import IntroAnimation, { hasIntroPlayed, prefersReducedMotion } from "@/components/home/IntroAnimation";
import ScrollReveal from "@/components/home/ScrollReveal";
import AnimatedCard from "@/components/home/AnimatedCard";
import AlertCard from "@/components/home/AlertCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [tripInput, setTripInput] = useState("");
  // Check if intro should be shown (only on first load, respecting reduced motion)
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return !hasIntroPlayed() && !prefersReducedMotion();
  });
  const [contentReady, setContentReady] = useState(() => {
    // If intro won't play, content is immediately ready
    if (typeof window === "undefined") return true;
    return hasIntroPlayed() || prefersReducedMotion();
  });

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Mock data for demo
  const upcomingTrips = [
    { id: 1, destination: "San Francisco, CA", dates: "Jan 8-10, 2025", status: "approved", purpose: "Client meeting" },
    { id: 2, destination: "Seattle, WA", dates: "Jan 15-17, 2025", status: "pending", purpose: "Team offsite" },
  ];

  const calendarSuggestions = [
    { id: 1, event: "Q1 Planning Meeting", location: "Chicago, IL", date: "Jan 20, 2025" },
  ];

  const alerts = [
    { id: 1, type: "warning", message: "Weather advisory for Seattle area - potential delays", trip: "Seattle trip" },
  ];

  const stats = [
    { icon: Plane, label: "Upcoming trips", value: "2", color: "text-primary" },
    { icon: Clock, label: "Hours saved", value: "48", color: "text-success" },
    { icon: DollarSign, label: "Pending expenses", value: "$1,240", color: "text-warning" },
    { icon: MapPin, label: "Miles traveled", value: "12,450", color: "text-accent" },
  ];

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setContentReady(true);
  }, []);

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <motion.div
        initial="hidden"
        animate={contentReady ? "visible" : "hidden"}
        variants={containerVariants}
        className="max-w-6xl mx-auto space-y-8 pb-20 lg:pb-0"
      >
        {/* Welcome header */}
        <motion.div variants={itemVariants}>
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {getGreeting()}, {firstName}
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Your travel command center
          </motion.p>
        </motion.div>

        {/* AI Trip Input */}
        <ScrollReveal delay={0.1}>
          <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                </motion.div>
                <CardTitle className="text-lg">Plan a trip with AI</CardTitle>
              </div>
              <CardDescription>Describe your travel needs in natural language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <motion.input
                    type="text"
                    placeholder='Try: "Book me a flight to NYC next Tuesday for a client pitch near Times Square"'
                    value={tripInput}
                    onChange={(e) => setTripInput(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                  />
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="accent" size="lg" className="shrink-0 rounded-xl shadow-glow">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Plan trip
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Alerts */}
        {alerts.length > 0 && (
          <ScrollReveal delay={0.15}>
            {alerts.map((alert, index) => (
              <AlertCard
                key={alert.id}
                message={alert.message}
                trip={alert.trip}
                delay={index * 0.1}
              />
            ))}
          </ScrollReveal>
        )}

        {/* Calendar suggestions */}
        {calendarSuggestions.length > 0 && (
          <ScrollReveal delay={0.2}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Travel suggestions from your calendar
            </h2>
            {calendarSuggestions.map((suggestion) => (
              <AnimatedCard key={suggestion.id} className="border-primary/20">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <p className="font-medium">You have "{suggestion.event}" in {suggestion.location}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.date}</p>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="default" size="sm" className="rounded-xl">
                      Prepare travel options
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </CardContent>
              </AnimatedCard>
            ))}
          </ScrollReveal>
        )}

        {/* Stats row */}
        <ScrollReveal delay={0.25}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <AnimatedCard key={i} delay={i * 0.1}>
                <CardContent className="p-5">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                  </motion.div>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </ScrollReveal>

        {/* Upcoming trips */}
        <ScrollReveal delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Upcoming trips</h2>
            <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingTrips.map((trip, index) => (
              <AnimatedCard key={trip.id} delay={index * 0.1}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                      >
                        <MapPin className="w-5 h-5 text-primary" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold">{trip.destination}</h3>
                        <p className="text-sm text-muted-foreground">{trip.dates}</p>
                      </div>
                    </div>
                    <motion.span
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        trip.status === "approved"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {trip.status}
                    </motion.span>
                  </div>
                  <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </ScrollReveal>
      </motion.div>
    </>
  );
}
