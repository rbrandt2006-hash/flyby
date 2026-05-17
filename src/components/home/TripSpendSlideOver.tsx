import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Plane, Hotel, Car, Utensils, MapPin, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, FileText, MessageSquare, Download, ArrowRight, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TripSpendData {
  id: string;
  route: string;
  purpose: string;
  estimatedCost: number;
  actualSpend: number;
  travelers: number;
  status: "upcoming" | "confirmed" | "in_progress" | "completed";
  budgetStatus: "within" | "over" | "under";
  budgetVariance: number;
  dates: string;
  destination: string;
  expenses: {
    airfare: number;
    hotel: number;
    meals: number;
    transport: number;
    misc: number;
  };
  approvals: {
    pending: number;
    approved: number;
    disputed: number;
  };
  policyFlags: string[];
  flight?: string;
  hotelName?: string;
  tripPurpose?: string;
}

interface TripSpendSlideOverProps {
  trip: TripSpendData | null;
  open: boolean;
  onClose: () => void;
}

const demoTrips: Record<string, TripSpendData> = {
  demo_trip_london_2025: {
    id: "demo_trip_london_2025",
    route: "SF → London",
    purpose: "Team offsite",
    estimatedCost: 1650,
    actualSpend: 1782,
    travelers: 1,
    status: "upcoming",
    budgetStatus: "over",
    budgetVariance: 8,
    dates: "Mar 15–22, 2025",
    destination: "London, UK",
    expenses: { airfare: 920, hotel: 560, meals: 180, transport: 82, misc: 40 },
    approvals: { pending: 3, approved: 8, disputed: 1 },
    policyFlags: ["Hotel 12% over policy", "Late booking surcharge applied", "Business class upgrade pending approval"],
    flight: "British Airways BA 286",
    hotelName: "The Savoy",
    tripPurpose: "Q2 team offsite and strategy planning",
  },
  demo_trip_tokyo_2025: {
    id: "demo_trip_tokyo_2025",
    route: "NYC → Tokyo",
    purpose: "Client visit",
    estimatedCost: 2500,
    actualSpend: 2335,
    travelers: 1,
    status: "confirmed",
    budgetStatus: "under",
    budgetVariance: 7,
    dates: "Apr 3–10, 2025",
    destination: "Tokyo, Japan",
    expenses: { airfare: 1450, hotel: 620, meals: 175, transport: 60, misc: 30 },
    approvals: { pending: 1, approved: 6, disputed: 0 },
    policyFlags: ["Per-diem meals within policy"],
    flight: "ANA NH 9",
    hotelName: "Aman Tokyo",
    tripPurpose: "Client partnership renewal and contract negotiation",
  },
};

export function getTripSpendData(tripId: string): TripSpendData | null {
  return demoTrips[tripId] || null;
}

export function TripSpendSlideOver({ trip, open, onClose }: TripSpendSlideOverProps) {
  const navigate = useNavigate();

  if (!trip) return null;

  const totalExpenses = Object.values(trip.expenses).reduce((a, b) => a + b, 0);

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
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border/50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/40 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{trip.route}</h2>
                  <p className="text-sm text-muted-foreground">{trip.purpose} · {trip.dates}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className={cn(
                  "text-xs",
                  trip.status === "upcoming" && "bg-primary/10 text-primary",
                  trip.status === "confirmed" && "bg-success/10 text-success",
                  trip.status === "in_progress" && "bg-warning/10 text-warning",
                  trip.status === "completed" && "bg-muted text-muted-foreground",
                )}>
                  {trip.status}
                </Badge>
                <Badge variant="secondary" className={cn(
                  "text-xs",
                  trip.budgetStatus === "over" && "bg-destructive/10 text-destructive",
                  trip.budgetStatus === "under" && "bg-success/10 text-success",
                  trip.budgetStatus === "within" && "bg-muted text-muted-foreground",
                )}>
                  {trip.budgetVariance}% {trip.budgetStatus === "over" ? "over" : "under"} budget
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Users className="w-3 h-3" /> {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Financial Summary */}
              <div className="px-6 py-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Financial Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Estimated</p>
                    <p className="text-lg font-bold text-foreground">${trip.estimatedCost.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Actual Spend</p>
                    <p className={cn("text-lg font-bold", trip.budgetStatus === "over" ? "text-destructive" : "text-success")}>
                      ${trip.actualSpend.toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* Budget progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Budget used</span>
                    <span>{Math.round((trip.actualSpend / trip.estimatedCost) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", trip.budgetStatus === "over" ? "bg-destructive" : "bg-success")}
                      style={{ width: `${Math.min(100, (trip.actualSpend / trip.estimatedCost) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Expense Breakdown */}
              <div className="px-6 py-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Expense Breakdown</h3>
                {[
                  { label: "Airfare", value: trip.expenses.airfare, icon: Plane },
                  { label: "Hotel", value: trip.expenses.hotel, icon: Hotel },
                  { label: "Meals", value: trip.expenses.meals, icon: Utensils },
                  { label: "Ground Transport", value: trip.expenses.transport, icon: Car },
                  { label: "Miscellaneous", value: trip.expenses.misc, icon: DollarSign },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${(item.value / totalExpenses) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-16 text-right">${item.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Approval Status */}
              <div className="px-6 py-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Approval Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/10 text-center">
                    <p className="text-xl font-bold text-warning">{trip.approvals.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/5 border border-success/10 text-center">
                    <p className="text-xl font-bold text-success">{trip.approvals.approved}</p>
                    <p className="text-xs text-muted-foreground">Approved</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-center">
                    <p className="text-xl font-bold text-destructive">{trip.approvals.disputed}</p>
                    <p className="text-xs text-muted-foreground">Disputed</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Policy Flags */}
              {trip.policyFlags.length > 0 && (
                <div className="px-6 py-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" /> Policy & AI Flags
                  </h3>
                  <div className="space-y-2">
                    {trip.policyFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/5 border border-warning/10">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Itinerary Snapshot */}
              <div className="px-6 py-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Itinerary Snapshot</h3>
                <div className="space-y-2">
                  {trip.flight && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Plane className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{trip.flight}</p>
                        <p className="text-xs text-muted-foreground">{trip.dates}</p>
                      </div>
                    </div>
                  )}
                  {trip.hotelName && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Hotel className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{trip.hotelName}</p>
                        <p className="text-xs text-muted-foreground">{trip.destination}</p>
                      </div>
                    </div>
                  )}
                  {trip.tripPurpose && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Purpose</p>
                        <p className="text-xs text-muted-foreground">{trip.tripPurpose}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 border-t border-border/40 bg-muted/20 shrink-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="default" className="gap-2" onClick={() => { onClose(); navigate(`/trips/${trip.id}`); }}>
                  <MapPin className="w-3.5 h-3.5" /> Full itinerary
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => { onClose(); navigate("/expenses"); }}>
                  <FileText className="w-3.5 h-3.5" /> Trip expenses
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
