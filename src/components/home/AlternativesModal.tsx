import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, Shield, Check, AlertTriangle, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";

interface Alternative {
  id: string;
  airline: string;
  flightNumber?: string;
  departTime: string;
  arrivalTime: string;
  price: number;
  priceDiff: number;
  riskLevel: "low" | "moderate" | "high";
  riskLabel: string;
  isRecommended?: boolean;
  reason?: string;
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

const mockAlternatives: Alternative[] = [
  {
    id: "alt-1",
    airline: "Delta Air Lines",
    flightNumber: "DL 1283",
    departTime: "6:00 AM",
    arrivalTime: "9:30 AM",
    price: 320,
    priceDiff: -60,
    riskLevel: "low",
    riskLabel: "Lower delay risk",
    isRecommended: true,
    reason: "Departs before forecasted storm window and arrives with buffer time."
  },
  {
    id: "alt-2",
    airline: "United Airlines",
    flightNumber: "UA 456",
    departTime: "11:30 AM",
    arrivalTime: "3:00 PM",
    price: 380,
    priceDiff: 0,
    riskLevel: "moderate",
    riskLabel: "Moderate risk",
  },
  {
    id: "alt-3",
    airline: "American Airlines",
    flightNumber: "AA 789",
    departTime: "2:00 PM",
    arrivalTime: "5:30 PM",
    price: 295,
    priceDiff: -85,
    riskLevel: "high",
    riskLabel: "Higher delay risk",
  },
];

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
      // Call the onRebook callback to update the trip
      if (onRebook) {
        onRebook({
          airline: selectedAlt.airline,
          flightNumber: selectedAlt.flightNumber || "",
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
        title: `Rebooked with ${selectedAlt.airline}`,
        description: `Your trip to ${tripDestination} has been updated. Check Trips to see the changes.`,
      });
    }, 1200);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedAlt(null);
  };

  const getRiskColor = (level: "low" | "moderate" | "high") => {
    switch (level) {
      case "low": return "text-success bg-success/10 border-success/20";
      case "moderate": return "text-warning bg-warning/10 border-warning/20";
      case "high": return "text-destructive bg-destructive/10 border-destructive/20";
    }
  };

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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Alternative travel options</h2>
                  <p className="text-sm text-muted-foreground">Choose a different flight to avoid delays</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
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
                      <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-7 h-7 text-warning" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">Replace existing flight?</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your current flight will be canceled and replaced with:
                      </p>
                      <div className="bg-secondary/50 rounded-lg p-3 mb-6 text-left">
                        <p className="font-medium text-foreground">{selectedAlt.airline}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAlt.departTime} → {selectedAlt.arrivalTime} • ${selectedAlt.price}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          onClick={handleCancelConfirm}
                          disabled={isRebooking}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 gap-2" 
                          onClick={handleConfirmRebook}
                          disabled={isRebooking}
                        >
                          {isRebooking ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Rebooking...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Confirm rebook
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="alternatives"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {mockAlternatives.map((alt, index) => (
                      <motion.div
                        key={alt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className={`p-4 transition-all cursor-pointer hover:border-primary/30 hover:shadow-md ${
                            alt.isRecommended ? 'border-primary/40 bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => handleSelectAlternative(alt)}
                        >
                          {alt.isRecommended && (
                            <Badge className="mb-3 bg-primary/10 text-primary border-0">
                              ✨ Recommended
                            </Badge>
                          )}
                          
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{alt.airline}</p>
                              {alt.flightNumber && (
                                <p className="text-xs text-muted-foreground">{alt.flightNumber}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{alt.departTime} → {alt.arrivalTime}</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-foreground">${alt.price}</p>
                              {alt.priceDiff !== 0 && (
                                <p className={`text-xs ${alt.priceDiff < 0 ? 'text-success' : 'text-destructive'}`}>
                                  {alt.priceDiff < 0 ? '−' : '+'}${Math.abs(alt.priceDiff)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <Badge variant="outline" className={getRiskColor(alt.riskLevel)}>
                              <Shield className="w-3 h-3 mr-1" />
                              {alt.riskLabel}
                            </Badge>
                            <Button size="sm" variant={alt.isRecommended ? "default" : "outline"}>
                              Rebook
                            </Button>
                          </div>

                          {alt.reason && (
                            <p className="text-xs text-muted-foreground mt-3 bg-muted/50 p-2 rounded">
                              {alt.reason}
                            </p>
                          )}
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}