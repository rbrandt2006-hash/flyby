import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  Clock, 
  Shield, 
  Check, 
  AlertTriangle, 
  X, 
  Sparkles,
  Info,
  TrendingUp,
  Timer,
  ArrowRight,
  CircleDot,
  Bell
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Alternative {
  id: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  departTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopInfo?: string;
  price: number;
  priceDiff: number;
  onTimePercent: number;
  riskLevel: "low" | "moderate" | "high";
  riskLabel: string;
  isRecommended?: boolean;
  reason: string;
  rankingFactors: {
    disruptionRisk: number;
    arrivalReliability: number;
    scheduleImpact: number;
    priceEfficiency: number;
  };
}

interface AlternativesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripDestination: string;
  tripId?: string;
  originalPrice: number;
  onRebook?: (selectedFlight: {
    airline: string;
    flightNumber: string;
    departTime: string;
    arrivalTime: string;
    price: number;
  }) => void;
}

// Comprehensive mock alternatives with rich data
const mockAlternatives: Alternative[] = [
  {
    id: "alt-1",
    airline: "Delta Air Lines",
    airlineLogo: "https://www.gstatic.com/flights/airline_logos/70px/DL.png",
    flightNumber: "DL 1283",
    departTime: "6:00 AM",
    arrivalTime: "9:15 AM",
    duration: "3h 15m",
    stops: 0,
    price: 320,
    priceDiff: -60,
    onTimePercent: 94,
    riskLevel: "low",
    riskLabel: "Lowest risk",
    isRecommended: true,
    reason: "Departs before the 9 AM storm window. Earlier inbound aircraft already positioned at gate. Direct routing avoids congested airspace.",
    rankingFactors: {
      disruptionRisk: 95,
      arrivalReliability: 94,
      scheduleImpact: 88,
      priceEfficiency: 92
    }
  },
  {
    id: "alt-2",
    airline: "Alaska Airlines",
    airlineLogo: "https://www.gstatic.com/flights/airline_logos/70px/AS.png",
    flightNumber: "AS 892",
    departTime: "6:45 AM",
    arrivalTime: "10:30 AM",
    duration: "3h 45m",
    stops: 0,
    price: 295,
    priceDiff: -85,
    onTimePercent: 91,
    riskLevel: "low",
    riskLabel: "Low risk",
    reason: "Operates before weather impacts. Different terminal with less congestion. Strong on-time track record on this route.",
    rankingFactors: {
      disruptionRisk: 90,
      arrivalReliability: 91,
      scheduleImpact: 85,
      priceEfficiency: 96
    }
  },
  {
    id: "alt-3",
    airline: "United Airlines",
    airlineLogo: "https://www.gstatic.com/flights/airline_logos/70px/UA.png",
    flightNumber: "UA 456",
    departTime: "11:30 AM",
    arrivalTime: "3:00 PM",
    duration: "3h 30m",
    stops: 0,
    price: 380,
    priceDiff: 0,
    onTimePercent: 78,
    riskLevel: "moderate",
    riskLabel: "Moderate risk",
    reason: "Departs during weather transition window. May experience 30-60 min delay but historically recovers. Same price as current booking.",
    rankingFactors: {
      disruptionRisk: 65,
      arrivalReliability: 78,
      scheduleImpact: 70,
      priceEfficiency: 85
    }
  },
  {
    id: "alt-4",
    airline: "American Airlines",
    airlineLogo: "https://www.gstatic.com/flights/airline_logos/70px/AA.png",
    flightNumber: "AA 789",
    departTime: "2:00 PM",
    arrivalTime: "6:45 PM",
    duration: "4h 45m",
    stops: 1,
    stopInfo: "1h layover in DEN",
    price: 265,
    priceDiff: -115,
    onTimePercent: 72,
    riskLevel: "moderate",
    riskLabel: "Moderate risk",
    reason: "Lower cost option with connection. DEN is unaffected by Seattle weather. Longer travel time but avoids SEA congestion entirely.",
    rankingFactors: {
      disruptionRisk: 70,
      arrivalReliability: 72,
      scheduleImpact: 55,
      priceEfficiency: 98
    }
  },
  {
    id: "alt-5",
    airline: "Southwest Airlines",
    airlineLogo: "https://www.gstatic.com/flights/airline_logos/70px/WN.png",
    flightNumber: "WN 1024",
    departTime: "4:30 PM",
    arrivalTime: "8:00 PM",
    duration: "3h 30m",
    stops: 0,
    price: 340,
    priceDiff: -40,
    onTimePercent: 65,
    riskLevel: "high",
    riskLabel: "Higher risk",
    reason: "Departs after storm peak but during recovery period. Airport operations may still be impacted. Flexible rebooking if needed.",
    rankingFactors: {
      disruptionRisk: 45,
      arrivalReliability: 65,
      scheduleImpact: 60,
      priceEfficiency: 88
    }
  }
];

// AI-generated context explanation
const aiExplanation = {
  summary: "These alternatives were selected to reduce delay risk due to incoming weather in the Seattle area while preserving arrival time and cost efficiency.",
  factors: [
    "Weather system expected 9 AM - 2 PM local time",
    "SEA ground stops likely during peak",
    "Earlier flights avoid congestion window"
  ]
};

export function AlternativesModal({ 
  open, 
  onOpenChange, 
  tripDestination, 
  tripId,
  originalPrice,
  onRebook 
}: AlternativesModalProps) {
  const [selectedAlt, setSelectedAlt] = useState<Alternative | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRebooking, setIsRebooking] = useState(false);
  const [enableAutoMonitor, setEnableAutoMonitor] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const handleSelectAlternative = (alt: Alternative) => {
    setSelectedAlt(alt);
    setShowConfirm(true);
  };

  const handleConfirmRebook = () => {
    if (!selectedAlt) return;
    
    setIsRebooking(true);
    setTimeout(() => {
      if (onRebook) {
        onRebook({
          airline: selectedAlt.airline,
          flightNumber: selectedAlt.flightNumber,
          departTime: selectedAlt.departTime,
          arrivalTime: selectedAlt.arrivalTime,
          price: selectedAlt.price,
        });
      }
      
      setIsRebooking(false);
      setShowConfirm(false);
      setSelectedAlt(null);
      onOpenChange(false);
      
      toast({
        title: `Rebooked to ${selectedAlt.flightNumber}`,
        description: `Your trip to ${tripDestination} has been updated with ${selectedAlt.airline}.`,
      });
    }, 1200);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedAlt(null);
  };

  const handleKeepCurrent = () => {
    if (enableAutoMonitor) {
      toast({
        title: "Monitoring enabled",
        description: "We'll notify you if better alternatives become available or if conditions change.",
      });
    }
    onOpenChange(false);
  };

  const getRiskColor = (level: "low" | "moderate" | "high") => {
    switch (level) {
      case "low": return "text-success bg-success/10 border-success/20";
      case "moderate": return "text-warning bg-warning/10 border-warning/20";
      case "high": return "text-destructive bg-destructive/10 border-destructive/20";
    }
  };

  const getOnTimeColor = (percent: number) => {
    if (percent >= 85) return "text-success";
    if (percent >= 70) return "text-warning";
    return "text-destructive";
  };

  const alternatives = mockAlternatives;
  const hasLimitedOptions = alternatives.length === 1;
  const hasNoOptions = alternatives.length === 0;

  if (!open) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header - Sticky */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Alternative flights</h2>
                  <p className="text-sm text-muted-foreground">Select a replacement to avoid delays</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              <AnimatePresence mode="wait">
                {showConfirm && selectedAlt ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="py-4"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                        <Check className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-xl mb-2 text-foreground">Confirm replacement</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Your current flight will be canceled and replaced with:
                      </p>
                      
                      {/* Selected flight summary */}
                      <Card className="p-5 mb-6 text-left border-primary/30 bg-primary/5">
                        <div className="flex items-start gap-4">
                          {selectedAlt.airlineLogo && (
                            <img 
                              src={selectedAlt.airlineLogo} 
                              alt={selectedAlt.airline}
                              className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-foreground">{selectedAlt.airline}</p>
                                <p className="text-sm text-muted-foreground">{selectedAlt.flightNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-foreground">${selectedAlt.price}</p>
                                {selectedAlt.priceDiff !== 0 && (
                                  <p className={`text-sm font-medium ${selectedAlt.priceDiff < 0 ? 'text-success' : 'text-destructive'}`}>
                                    {selectedAlt.priceDiff < 0 ? 'Save' : '+'} ${Math.abs(selectedAlt.priceDiff)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-3 text-sm">
                              <span className="font-medium text-foreground">{selectedAlt.departTime}</span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{selectedAlt.arrivalTime}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{selectedAlt.duration}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {selectedAlt.stops === 0 ? "Nonstop" : `${selectedAlt.stops} stop`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                          <Badge variant="outline" className={getRiskColor(selectedAlt.riskLevel)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {selectedAlt.riskLabel}
                          </Badge>
                          <span className={`text-sm font-medium ${getOnTimeColor(selectedAlt.onTimePercent)}`}>
                            {selectedAlt.onTimePercent}% on-time
                          </span>
                        </div>
                      </Card>
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          onClick={handleCancelConfirm}
                          disabled={isRebooking}
                        >
                          Back to options
                        </Button>
                        <Button 
                          className="flex-1 gap-2" 
                          onClick={handleConfirmRebook}
                          disabled={isRebooking}
                        >
                          {isRebooking ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Confirm & rebook
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : hasNoOptions ? (
                  <motion.div
                    key="no-options"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">No better alternatives available</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      All alternative flights have similar or higher disruption risk. We recommend keeping your current booking.
                    </p>
                    
                    <Card className="p-4 mb-6 border-dashed">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm text-foreground">Enable auto-monitoring</p>
                          <p className="text-xs text-muted-foreground">We'll notify you if better options become available</p>
                        </div>
                        <Button 
                          variant={enableAutoMonitor ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setEnableAutoMonitor(!enableAutoMonitor)}
                        >
                          {enableAutoMonitor ? "Enabled" : "Enable"}
                        </Button>
                      </div>
                    </Card>
                    
                    <Button onClick={handleKeepCurrent} className="w-full">
                      Keep current flight
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="alternatives"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* AI Explanation Banner */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {aiExplanation.summary}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {aiExplanation.factors.map((factor, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Single option notice */}
                    {hasLimitedOptions && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                        <p className="text-sm text-warning">
                          This is the only viable alternative with lower disruption risk.
                        </p>
                      </motion.div>
                    )}

                    {/* Alternatives list */}
                    <div className="space-y-3">
                      {alternatives.map((alt, index) => (
                        <motion.div
                          key={alt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className={`p-4 transition-all cursor-pointer hover:border-primary/40 hover:shadow-lg ${
                              alt.isRecommended ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                            }`}
                          >
                            {/* Recommended badge */}
                            {alt.isRecommended && (
                              <Badge className="mb-3 bg-primary text-primary-foreground border-0 gap-1">
                                <Sparkles className="w-3 h-3" />
                                Recommended
                              </Badge>
                            )}
                            
                            {/* Main content row */}
                            <div className="flex items-start gap-4">
                              {/* Airline logo */}
                              {alt.airlineLogo && (
                                <img 
                                  src={alt.airlineLogo} 
                                  alt={alt.airline}
                                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 shrink-0"
                                />
                              )}
                              
                              {/* Flight info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-foreground">{alt.airline}</p>
                                  <span className="text-sm text-muted-foreground">{alt.flightNumber}</span>
                                </div>
                                
                                {/* Times row */}
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-foreground">{alt.departTime}</span>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-8 h-px bg-border" />
                                    {alt.stops === 0 ? (
                                      <span className="text-xs whitespace-nowrap">{alt.duration}</span>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <CircleDot className="w-2 h-2" />
                                        <span className="text-xs whitespace-nowrap">{alt.duration}</span>
                                      </div>
                                    )}
                                    <div className="w-8 h-px bg-border" />
                                  </div>
                                  <span className="font-medium text-foreground">{alt.arrivalTime}</span>
                                </div>
                                
                                {/* Stops info */}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {alt.stops === 0 ? "Nonstop" : alt.stopInfo || `${alt.stops} stop`}
                                </p>
                              </div>
                              
                              {/* Price column */}
                              <div className="text-right shrink-0">
                                <p className="font-bold text-lg text-foreground">${alt.price}</p>
                                {alt.priceDiff !== 0 && (
                                  <p className={`text-sm font-medium ${alt.priceDiff < 0 ? 'text-success' : 'text-destructive'}`}>
                                    {alt.priceDiff < 0 ? '−' : '+'}${Math.abs(alt.priceDiff)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={getRiskColor(alt.riskLevel)}>
                                  <Shield className="w-3 h-3 mr-1" />
                                  {alt.riskLabel}
                                </Badge>
                                
                                <div className="flex items-center gap-1.5">
                                  <TrendingUp className={`w-3.5 h-3.5 ${getOnTimeColor(alt.onTimePercent)}`} />
                                  <span className={`text-sm font-medium ${getOnTimeColor(alt.onTimePercent)}`}>
                                    {alt.onTimePercent}% on-time
                                  </span>
                                </div>
                                
                                {/* Why this option tooltip */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        <Info className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Why this option</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <p className="text-sm">{alt.reason}</p>
                                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border">
                                        <div className="text-xs">
                                          <span className="text-muted-foreground">Disruption risk:</span>
                                          <span className="ml-1 font-medium">{alt.rankingFactors.disruptionRisk}%</span>
                                        </div>
                                        <div className="text-xs">
                                          <span className="text-muted-foreground">Reliability:</span>
                                          <span className="ml-1 font-medium">{alt.rankingFactors.arrivalReliability}%</span>
                                        </div>
                                        <div className="text-xs">
                                          <span className="text-muted-foreground">Schedule fit:</span>
                                          <span className="ml-1 font-medium">{alt.rankingFactors.scheduleImpact}%</span>
                                        </div>
                                        <div className="text-xs">
                                          <span className="text-muted-foreground">Price efficiency:</span>
                                          <span className="ml-1 font-medium">{alt.rankingFactors.priceEfficiency}%</span>
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant={alt.isRecommended ? "default" : "outline"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAlternative(alt);
                                }}
                              >
                                Select
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - Sticky - Only show when not in confirm mode */}
            {!showConfirm && !hasNoOptions && (
              <div className="px-6 py-4 border-t border-border bg-secondary/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableAutoMonitor}
                        onChange={(e) => setEnableAutoMonitor(e.target.checked)}
                        className="w-4 h-4 rounded border-border accent-primary"
                      />
                      <span className="text-sm text-muted-foreground">Auto-rebook if better option appears</span>
                    </label>
                  </div>
                  <Button variant="ghost" onClick={handleKeepCurrent}>
                    Keep current flight
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
