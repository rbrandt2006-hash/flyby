import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Plane, 
  Building2, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  ChevronDown,
  Check, 
  Pencil, 
  X, 
  ArrowLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectedTrip {
  destination: string;
  dates: string;
  purpose: string;
  flight: {
    airline: string;
    departure: string;
    arrival: string;
    price: number;
  };
  hotel: {
    name: string;
    location: string;
    pricePerNight: number;
    nights: number;
  };
  totalCost: number;
  confidence: number;
  reasoning: string;
}

interface SmartTripAssistantProps {
  detectedTrip: DetectedTrip | null;
  onReviewTrip: () => void;
}

export function SmartTripAssistant({ detectedTrip, onReviewTrip }: SmartTripAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);

  if (!detectedTrip) return null;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setConfirmed(true);
    }, 1500);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setShowReviewPanel(false);
    setConfirmed(false);
  };

  // Get short destination name (e.g., "New York City" -> "NYC", "Seattle" -> "Seattle")
  const getShortDestination = (dest: string) => {
    if (dest.toLowerCase().includes("new york")) return "NYC";
    if (dest.toLowerCase().includes("los angeles")) return "LA";
    if (dest.toLowerCase().includes("san francisco")) return "SF";
    if (dest.toLowerCase().includes("washington")) return "DC";
    return dest.split(",")[0].trim();
  };

  // Collapsed pill - rendered in the main flow
  const CollapsedPill = (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={() => setIsExpanded(true)}
      className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border/60 rounded-full shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-200 cursor-pointer group"
    >
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-foreground">
        Trip detected
      </span>
      <span className="text-sm text-muted-foreground">·</span>
      <span className="text-sm font-medium text-primary">
        {getShortDestination(detectedTrip.destination)}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </motion.button>
  );

  // Expanded panel - rendered via portal for proper z-index
  const ExpandedPanel = createPortal(
    <AnimatePresence>
      {isExpanded && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          
          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-[400px] max-w-[90vw] bg-background shadow-2xl z-50 flex flex-col"
          >
            <AnimatePresence mode="wait">
              {!showReviewPanel ? (
                <motion.div
                  key="detection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Sticky Header */}
                  <div className="shrink-0 px-6 py-5 border-b border-border/40 flex items-center justify-between bg-background">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-base font-semibold text-foreground">AI Assistant</span>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
                    {/* Trip Summary Card - Primary Focus */}
                    <div className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm">
                      <div className="mb-5">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {detectedTrip.destination}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {detectedTrip.purpose}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{detectedTrip.dates}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                            <Plane className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{detectedTrip.flight.airline}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm text-foreground">{detectedTrip.hotel.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-base font-semibold text-foreground">
                            ${detectedTrip.totalCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Why This Was Detected - Collapsible */}
                    <div className="mt-5">
                      <button
                        onClick={() => setReasoningExpanded(!reasoningExpanded)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        <ChevronDown 
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            reasoningExpanded && "rotate-180"
                          )} 
                        />
                        <span className="font-medium">Why Flyby suggested this</span>
                      </button>
                      
                      <AnimatePresence>
                        {reasoningExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 ml-6 pl-4 border-l-2 border-muted">
                              <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                  <span>Detected client meeting in {getShortDestination(detectedTrip.destination)} next week</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                  <span>Location referenced in conversation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                                  <span>Arrival scheduled evening before meeting</span>
                                </li>
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Sticky Footer CTA */}
                  <div className="shrink-0 px-6 py-5 border-t border-border/40 bg-background">
                    <Button 
                      className="w-full h-12 text-sm font-semibold gap-2 rounded-xl shadow-md hover:shadow-lg transition-all" 
                      onClick={() => setShowReviewPanel(true)}
                    >
                      Review & Book
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="shrink-0 px-6 py-5 border-b border-border/40 flex items-center gap-3 bg-background">
                    <button 
                      onClick={() => setShowReviewPanel(false)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="text-base font-semibold text-foreground">Review Booking</span>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
                    {confirmed ? (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center py-12"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Check className="w-7 h-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Booked Successfully</h3>
                        <p className="text-sm text-muted-foreground">
                          Your trip to {detectedTrip.destination} is confirmed
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        <EditableSection
                          icon={<Plane className="w-4 h-4" />}
                          title="Flight"
                          details={[
                            detectedTrip.flight.airline,
                            `${detectedTrip.flight.departure} → ${detectedTrip.flight.arrival}`,
                            `$${detectedTrip.flight.price}`
                          ]}
                        />
                        <EditableSection
                          icon={<Building2 className="w-4 h-4" />}
                          title="Hotel"
                          details={[
                            detectedTrip.hotel.name,
                            detectedTrip.hotel.location,
                            `$${detectedTrip.hotel.pricePerNight}/night × ${detectedTrip.hotel.nights}`
                          ]}
                        />
                        <EditableSection
                          icon={<Calendar className="w-4 h-4" />}
                          title="Dates"
                          details={[detectedTrip.dates]}
                        />

                        {/* Total */}
                        <div className="pt-4 border-t border-border/40 mt-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Estimated Total</span>
                            <span className="text-lg font-semibold">${detectedTrip.totalCost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  {!confirmed && (
                    <div className="shrink-0 px-6 py-5 border-t border-border/40 bg-background">
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 h-11 text-sm gap-2 rounded-xl"
                          onClick={() => setShowReviewPanel(false)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button 
                          className="flex-1 h-11 text-sm gap-2 rounded-xl shadow-md"
                          onClick={handleConfirm}
                          disabled={isConfirming}
                        >
                          {isConfirming ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Booking...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Confirm
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <AnimatePresence>
        {!isExpanded && CollapsedPill}
      </AnimatePresence>
      {ExpandedPanel}
    </>
  );
}

function EditableSection({ 
  icon, 
  title, 
  details 
}: { 
  icon: React.ReactNode; 
  title: string; 
  details: string[];
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {details.map((detail, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
            ))}
          </div>
        </div>
        <Pencil className="w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      </div>
    </div>
  );
}
