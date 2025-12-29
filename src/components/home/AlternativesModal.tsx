import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, DollarSign, Shield, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Alternative {
  id: string;
  airline: string;
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
  originalPrice: number;
}

const mockAlternatives: Alternative[] = [
  {
    id: "alt-1",
    airline: "Delta Airlines",
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
    departTime: "2:00 PM",
    arrivalTime: "5:30 PM",
    price: 295,
    priceDiff: -85,
    riskLevel: "high",
    riskLabel: "Higher delay risk",
  },
];

export function AlternativesModal({ open, onOpenChange, tripDestination, originalPrice }: AlternativesModalProps) {
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRebooking, setIsRebooking] = useState(false);

  const handleSelectAlternative = (altId: string) => {
    setSelectedAlt(altId);
    setShowConfirm(true);
  };

  const handleConfirmRebook = () => {
    setIsRebooking(true);
    setTimeout(() => {
      setIsRebooking(false);
      setShowConfirm(false);
      onOpenChange(false);
      toast({
        title: "Rebooked successfully",
        description: `Your trip to ${tripDestination} has been updated with the new flight.`,
      });
    }, 1500);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Alternative travel options
          </DialogTitle>
          <DialogDescription>
            Choose a different flight to avoid potential weather delays
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Replace existing itinerary?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Your current flight will be canceled and replaced with the new option.
                </p>
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
              className="space-y-3 py-2"
            >
              {mockAlternatives.map((alt, index) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`p-4 transition-all cursor-pointer hover:border-primary/30 ${
                      alt.isRecommended ? 'border-primary/40 bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectAlternative(alt.id)}
                  >
                    {alt.isRecommended && (
                      <Badge className="mb-3 bg-primary/10 text-primary border-0">
                        ✨ Recommended
                      </Badge>
                    )}
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{alt.airline}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{alt.departTime} → {alt.arrivalTime}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">${alt.price}</p>
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
                        Rebook this option
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
      </DialogContent>
    </Dialog>
  );
}