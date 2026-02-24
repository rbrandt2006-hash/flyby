import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, MapPin, Plane, Building2, Clock, Calendar, Users, Video, Navigation, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import flybyLogo from "@/assets/flyby-logo-new.png";

interface TravelerInfo {
  name: string;
  destination: string;
  status: string;
  journeyStep: number;
  totalSteps: number;
  statusType: "info" | "success" | "warning";
  initials: string;
}

interface TravelerDetailPanelProps {
  traveler: TravelerInfo | null;
  open: boolean;
  onClose: () => void;
}

// Mock detailed data per status
function getStatusDetails(status: string, name: string, destination: string) {
  switch (status) {
    case "Boarded plane":
      return {
        icon: <Plane className="w-5 h-5" />,
        title: "Flight Details",
        details: [
          { label: "Airline", value: "United Airlines" },
          { label: "Flight", value: "UA 1847" },
          { label: "From", value: "SFO — Gate B22, Terminal 3" },
          { label: "To", value: destination },
          { label: "Departure", value: "8:15 AM (On time)" },
          { label: "Est. Arrival", value: "12:42 PM local" },
          { label: "Status", value: "In Flight", badge: "info" },
        ],
      };
    case "Checked into hotel":
      return {
        icon: <Building2 className="w-5 h-5" />,
        title: "Hotel Details",
        details: [
          { label: "Hotel", value: "The Fairmont Olympic" },
          { label: "Address", value: `411 University St, ${destination}` },
          { label: "Room", value: "1204" },
          { label: "Check-in", value: "2:45 PM today" },
          { label: "Check-out", value: "Jan 17, 11:00 AM" },
          { label: "Confirmation", value: "FMT-2847291" },
          { label: "Hotel Phone", value: "+1 (206) 555-0142" },
          { label: "Distance to meeting", value: "0.4 mi — 8 min walk" },
        ],
      };
    case "Heading to airport":
      return {
        icon: <Navigation className="w-5 h-5" />,
        title: "Departure Info",
        details: [
          { label: "Airport", value: "JFK International" },
          { label: "Airline", value: "Delta Air Lines" },
          { label: "Flight", value: "DL 402" },
          { label: "Departure", value: "5:30 PM" },
          { label: "Gate", value: "C18, Terminal 4" },
          { label: "Flight Status", value: "On time", badge: "success" },
          { label: "TSA Wait", value: "~15 min" },
          { label: "Suggested leave by", value: "2:30 PM" },
        ],
      };
    case "In meeting":
      return {
        icon: <Users className="w-5 h-5" />,
        title: "Meeting Details",
        details: [
          { label: "Meeting", value: "Q1 Planning Review" },
          { label: "Location", value: `${destination} — Conference Room A` },
          { label: "Time", value: "10:00 AM – 12:00 PM" },
          { label: "Attendees", value: "6 people" },
          { label: "Agenda", value: "Budget review, roadmap alignment" },
          { label: "Status", value: "In progress", badge: "success" },
          { label: "Ends in", value: "~45 min" },
        ],
      };
    default:
      return {
        icon: <MapPin className="w-5 h-5" />,
        title: "Travel Status",
        details: [
          { label: "Location", value: destination },
          { label: "Status", value: status },
        ],
      };
  }
}

export function TravelerDetailPanel({ traveler, open, onClose }: TravelerDetailPanelProps) {
  if (!traveler) return null;

  const statusInfo = getStatusDetails(traveler.status, traveler.name, traveler.destination);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md pointer-events-auto bg-background rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/40 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {traveler.initials}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background",
                      traveler.statusType === "success" && "bg-success",
                      traveler.statusType === "warning" && "bg-warning",
                      traveler.statusType === "info" && "bg-primary",
                    )} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{traveler.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {traveler.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <img src={flybyLogo} alt="FlyBy" className="h-5 opacity-40" />
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-6 py-3 bg-muted/30">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    traveler.statusType === "warning" && "bg-warning/10 text-warning border-warning/20",
                    traveler.statusType === "success" && "bg-success/10 text-success border-success/20",
                    traveler.statusType === "info" && "bg-primary/10 text-primary border-primary/20",
                  )}
                >
                  {statusInfo.icon}
                  <span className="ml-1.5">{traveler.status}</span>
                </Badge>
              </div>

              {/* Details */}
              <div className="px-6 py-5 space-y-3 max-h-[50vh] overflow-y-auto">
                <h3 className="text-sm font-semibold text-foreground mb-3">{statusInfo.title}</h3>
                {statusInfo.details.map((d, i) => (
                  <div key={i} className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground text-right max-w-[200px]">{d.value}</span>
                      {d.badge && (
                        <Badge variant="secondary" className={cn(
                          "text-[10px]",
                          d.badge === "success" && "bg-success/10 text-success",
                          d.badge === "info" && "bg-primary/10 text-primary",
                        )}>
                          {d.badge === "success" ? "✓" : "●"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex gap-3">
                <Button variant="default" className="flex-1 gap-2" size="sm">
                  <MessageSquare className="w-4 h-4" />
                  Message traveler
                </Button>
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Calendar className="w-4 h-4" />
                  View itinerary
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
