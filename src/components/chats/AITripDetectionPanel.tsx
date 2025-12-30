import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Plane, Building2, Calendar, DollarSign, ChevronRight, Check, Pencil, X, ArrowLeft } from "lucide-react";
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

interface AITripDetectionPanelProps {
  detectedTrip: DetectedTrip | null;
  onReviewTrip: () => void;
  onClose?: () => void;
}

export function AITripDetectionPanel({ detectedTrip, onReviewTrip, onClose }: AITripDetectionPanelProps) {
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!detectedTrip) return null;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setConfirmed(true);
    }, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-muted/30 border-l border-border/40">
      <AnimatePresence mode="wait">
        {!showReviewPanel ? (
          <motion.div
            key="detection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">AI Assistant</span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground/60" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Trip summary card */}
              <div className="rounded-lg bg-card border border-border/60 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-0.5">Detected trip</p>
                    <h4 className="font-semibold text-foreground">{detectedTrip.destination}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{detectedTrip.purpose}</p>
                  </div>
                </div>

                <div className="space-y-2.5 mt-4">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>{detectedTrip.dates}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Plane className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>{detectedTrip.flight.airline}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span>{detectedTrip.hotel.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-primary/70" />
                    <span className="font-medium text-foreground">${detectedTrip.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* AI Reasoning - subtle */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                  Why this was detected
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {detectedTrip.reasoning}
                </p>
              </div>
            </div>
            
            {/* Footer CTA */}
            <div className="p-4 border-t border-border/40">
              <Button 
                className="w-full h-9 text-xs gap-1.5" 
                onClick={() => setShowReviewPanel(true)}
              >
                Review & book
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <button 
                onClick={() => setShowReviewPanel(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-xs font-medium text-foreground">Review booking</span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
              {confirmed ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-8"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Booked</h3>
                  <p className="text-xs text-muted-foreground">
                    Trip to {detectedTrip.destination} confirmed
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <EditableSection
                    icon={<Plane className="w-3.5 h-3.5" />}
                    title="Flight"
                    details={[
                      detectedTrip.flight.airline,
                      `${detectedTrip.flight.departure} → ${detectedTrip.flight.arrival}`,
                      `$${detectedTrip.flight.price}`
                    ]}
                  />
                  <EditableSection
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    title="Hotel"
                    details={[
                      detectedTrip.hotel.name,
                      detectedTrip.hotel.location,
                      `$${detectedTrip.hotel.pricePerNight}/night × ${detectedTrip.hotel.nights}`
                    ]}
                  />
                  <EditableSection
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    title="Dates"
                    details={[detectedTrip.dates]}
                  />

                  {/* Total */}
                  <div className="pt-3 border-t border-border/40 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-sm font-semibold">${detectedTrip.totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!confirmed && (
              <div className="p-4 border-t border-border/40">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 h-9 text-xs gap-1.5"
                    onClick={() => setShowReviewPanel(false)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 h-9 text-xs gap-1.5"
                    onClick={handleConfirm}
                    disabled={isConfirming}
                  >
                    {isConfirming ? (
                      <>
                        <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
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
    </div>
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
    <div className="p-3 rounded-lg bg-card border border-border/60 hover:border-border transition-colors cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-md bg-muted/70 flex items-center justify-center shrink-0 text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{title}</p>
            {details.map((detail, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">{detail}</p>
            ))}
          </div>
        </div>
        <Pencil className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
