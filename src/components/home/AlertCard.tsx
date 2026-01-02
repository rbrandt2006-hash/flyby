import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlternativesModal } from "./AlternativesModal";
import { useTrips } from "@/hooks/useTrips";

interface AlertCardProps {
  message: string;
  trip: string;
  tripDestination?: string;
  tripId?: string;
  delay?: number;
  onRebookComplete?: () => void;
}

export default function AlertCard({
  message,
  trip,
  tripDestination = "Seattle, WA",
  tripId,
  delay = 0,
  onRebookComplete
}: AlertCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const { rebookTrip, createTripFromRebook, getTripByDestination } = useTrips();

  const handleRebook = (selectedFlight: {
    airline: string;
    flightNumber: string;
    departTime: string;
    arrivalTime: string;
    price: number;
  }) => {
    // Try to find existing trip by ID or destination
    const existingTrip = tripId 
      ? null // If we have ID, we'd look it up, but for now use destination
      : getTripByDestination(tripDestination);

    if (existingTrip) {
      // Update existing trip
      rebookTrip(existingTrip.id, {
        airline: selectedFlight.airline,
        flightNumber: selectedFlight.flightNumber,
        departTime: selectedFlight.departTime,
        arrivalTime: selectedFlight.arrivalTime,
        price: selectedFlight.price,
      });
    } else {
      // Create new trip from rebook
      createTripFromRebook(tripDestination, {
        airline: selectedFlight.airline,
        flightNumber: selectedFlight.flightNumber,
        departTime: selectedFlight.departTime,
        arrivalTime: selectedFlight.arrivalTime,
        price: selectedFlight.price,
      });
    }

    onRebookComplete?.();
  };

  return (
    <>
      <motion.div 
        initial={{
          opacity: 0,
          x: -20
        }} 
        animate={{
          opacity: 1,
          x: 0
        }} 
        transition={{
          duration: 0.5,
          delay,
          ease: [0.25, 0.1, 0.25, 1]
        }} 
        className="relative overflow-hidden rounded-xl border border-warning/30 bg-warning/5"
      >
        {/* Subtle pulse glow */}
        <motion.div 
          className="absolute inset-0 bg-warning/10" 
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }} 
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }} 
        />
        
        <div className="relative flex items-center gap-4 p-4 bg-secondary/30 border border-border/50 rounded-xl">
          <motion.div 
            animate={{
              scale: [1, 1.1, 1]
            }} 
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }} 
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-warning/20"
          >
            <AlertTriangle className="w-5 h-5 text-warning" />
          </motion.div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">{trip}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAlternatives(true)}
            className="border-border hover:border-primary/30"
          >
            View alternatives
          </Button>
        </div>
      </motion.div>

      <AlternativesModal
        open={showAlternatives}
        onOpenChange={setShowAlternatives}
        tripDestination={tripDestination}
        tripId={tripId}
        originalPrice={380}
        onRebook={handleRebook}
      />
    </>
  );
}