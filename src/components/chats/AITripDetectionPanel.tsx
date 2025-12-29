import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Plane, Building2, Calendar, DollarSign, ChevronRight, Check, Pencil } from "lucide-react";
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
}

export function AITripDetectionPanel({ detectedTrip, onReviewTrip }: AITripDetectionPanelProps) {
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
    <div className="border-l border-border bg-secondary/20 w-[380px] flex flex-col">
      <AnimatePresence mode="wait">
        {!showReviewPanel ? (
          <motion.div
            key="detection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Trip Detected</h3>
                <p className="text-xs text-muted-foreground">AI analysis of conversation</p>
              </div>
            </div>

            {/* Summary Card */}
            <Card className="p-4 bg-background border-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{detectedTrip.destination}</h4>
                  <p className="text-sm text-muted-foreground">{detectedTrip.purpose}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {detectedTrip.confidence}% match
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{detectedTrip.dates}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plane className="w-4 h-4" />
                  <span>{detectedTrip.flight.airline} • {detectedTrip.flight.departure} → {detectedTrip.flight.arrival}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{detectedTrip.hotel.name}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span>${detectedTrip.totalCost.toLocaleString()} estimated total</span>
                </div>
              </div>
            </Card>

            {/* AI Reasoning */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">AI Reasoning</p>
              <p className="text-sm leading-relaxed">{detectedTrip.reasoning}</p>
            </div>

            {/* CTA */}
            <div className="mt-auto pt-4">
              <Button 
                className="w-full gap-2" 
                onClick={() => setShowReviewPanel(true)}
              >
                Review proposed trip
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setShowReviewPanel(false)}
              >
                ← Back
              </Button>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Review & Confirm</h3>
              </div>
            </div>

            {confirmed ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Trip Confirmed</h3>
                <p className="text-sm text-muted-foreground">
                  Your trip to {detectedTrip.destination} has been booked.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Booking Status */}
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">Booking Status</p>
                  <p className="text-sm">Ready to book • All details confirmed</p>
                </div>

                {/* Editable Sections */}
                <div className="space-y-3 flex-1">
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
                      `$${detectedTrip.hotel.pricePerNight}/night × ${detectedTrip.hotel.nights} nights`
                    ]}
                  />
                  <EditableSection
                    icon={<Calendar className="w-4 h-4" />}
                    title="Dates"
                    details={[detectedTrip.dates]}
                  />
                </div>

                {/* Total */}
                <div className="py-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Estimated Cost</span>
                    <span className="text-lg font-semibold">${detectedTrip.totalCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => setShowReviewPanel(false)}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
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
                        Confirm & Book
                      </>
                    )}
                  </Button>
                </div>
              </>
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
    <Card className="p-3 hover:bg-secondary/50 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            {details.map((detail, i) => (
              <p key={i} className="text-xs text-muted-foreground">{detail}</p>
            ))}
          </div>
        </div>
        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Card>
  );
}
