import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, Clock, DollarSign, MapPin, Calendar, Building2, AlertCircle, ChevronRight, FileText, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export type KPIType = "upcomingTrips" | "hoursSaved" | "pendingExpenses" | "milesTraveled";

interface KPIDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: KPIType;
}

// Mock data for each KPI type
const mockUpcomingTrips = [
  {
    id: "1",
    destination: "San Francisco, CA",
    dates: "Jan 8-10, 2025",
    status: "approved",
    purpose: "Client meeting",
    flight: { airline: "Delta", departure: "7:45 AM", arrival: "11:30 AM" },
    hotel: { name: "The Ritz-Carlton", area: "Financial District" },
    ground: "Uber estimate: $35-45",
    alerts: [],
  },
  {
    id: "2",
    destination: "Seattle, WA",
    dates: "Jan 15-17, 2025",
    status: "pending",
    purpose: "Team offsite",
    flight: { airline: "Alaska Airlines", departure: "6:30 AM", arrival: "9:15 AM" },
    hotel: { name: "The Westin", area: "Downtown" },
    ground: "Rental car: $65/day",
    alerts: ["Weather advisory"],
  },
];

const mockHoursSaved = {
  total: 48,
  breakdown: [
    { type: "Auto-booking vs manual", hours: 12, icon: Plane },
    { type: "Auto-rebooking during disruption", hours: 9, icon: AlertCircle },
    { type: "Receipt auto-import & categorization", hours: 6, icon: Receipt },
    { type: "Trip preparation (hotel/flight shortlist)", hours: 8, icon: FileText },
    { type: "Calendar-to-trip detection", hours: 3, icon: Calendar },
    { type: "Expense report generation", hours: 10, icon: DollarSign },
  ],
  byTrip: [
    { trip: "Seattle trip", hours: 14, detail: "Rebook + hotel selection" },
    { trip: "SF trip", hours: 9, detail: "Auto-expense matching" },
    { trip: "Chicago trip", hours: 12, detail: "Full trip automation" },
    { trip: "NYC trip", hours: 8, detail: "Receipt processing" },
  ],
};

const mockPendingExpenses = {
  total: 1240,
  count: 5,
  byTrip: [
    {
      trip: "Seattle Jan 15-17",
      expenses: [
        { merchant: "Uber", amount: 42.50, status: "needs_receipt", category: "Ground Transport" },
        { merchant: "Marriott", amount: 524.80, status: "submitted", category: "Lodging" },
      ],
    },
    {
      trip: "NYC Dec 18",
      expenses: [
        { merchant: "Delta", amount: 487.00, status: "pending_approval", category: "Flights" },
        { merchant: "Shake Shack", amount: 24.50, status: "needs_receipt", category: "Meals" },
        { merchant: "Yellow Cab", amount: 161.20, status: "submitted", category: "Ground Transport" },
      ],
    },
  ],
};

const mockMiles = {
  total: 12450,
  co2Estimate: "2.1 tons",
  avgPerTrip: 2075,
  byMonth: [
    { month: "Jan", miles: 4200 },
    { month: "Feb", miles: 3100 },
    { month: "Mar", miles: 2800 },
    { month: "Apr", miles: 2350 },
  ],
  byTrip: [
    { trip: "NYC roundtrip", miles: 3200 },
    { trip: "Seattle roundtrip", miles: 2800 },
    { trip: "SF roundtrip", miles: 2400 },
    { trip: "Chicago roundtrip", miles: 2100 },
    { trip: "Austin roundtrip", miles: 1950 },
  ],
};

const drawerConfig: Record<KPIType, { title: string; icon: typeof Plane; color: string }> = {
  upcomingTrips: { title: "Upcoming Trips", icon: Plane, color: "text-primary" },
  hoursSaved: { title: "Hours Saved", icon: Clock, color: "text-success" },
  pendingExpenses: { title: "Pending Expenses", icon: DollarSign, color: "text-warning" },
  milesTraveled: { title: "Miles Traveled", icon: MapPin, color: "text-accent" },
};

export function KPIDrawer({ open, onOpenChange, type }: KPIDrawerProps) {
  const navigate = useNavigate();
  const config = drawerConfig[type];
  const Icon = config.icon;

  const handleClose = () => onOpenChange(false);

  const content = createPortal(
    <AnimatePresence>
      {open && (
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
          
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-[420px] max-w-[90vw] bg-background shadow-2xl z-50 flex flex-col"
          >
            {/* Sticky Header */}
            <div className="shrink-0 px-6 py-5 border-b border-border/40 flex items-center justify-between bg-background">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                  type === "upcomingTrips" && "bg-primary/10",
                  type === "hoursSaved" && "bg-success/10",
                  type === "pendingExpenses" && "bg-warning/10",
                  type === "milesTraveled" && "bg-accent/10"
                )}>
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6">
              {type === "upcomingTrips" && <UpcomingTripsContent />}
              {type === "hoursSaved" && <HoursSavedContent />}
              {type === "pendingExpenses" && <PendingExpensesContent />}
              {type === "milesTraveled" && <MilesTraveledContent />}
            </div>

            {/* Sticky Footer CTA */}
            <div className="shrink-0 px-6 py-4 border-t border-border/40 bg-background">
              {type === "upcomingTrips" && (
                <Button className="w-full" onClick={() => { handleClose(); navigate("/trips"); }}>
                  View all trips
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {type === "hoursSaved" && (
                <Button variant="outline" className="w-full">
                  See activity log
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {type === "pendingExpenses" && (
                <Button className="w-full" onClick={() => { handleClose(); navigate("/expenses"); }}>
                  Go to Expenses
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {type === "milesTraveled" && (
                <Button variant="outline" className="w-full">
                  Export travel report
                  <FileText className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return content;
}

function UpcomingTripsContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{mockUpcomingTrips.length}</span>
        <span className="text-sm text-muted-foreground">trips scheduled</span>
      </div>

      <div className="space-y-4">
        {mockUpcomingTrips.map((trip) => (
          <div key={trip.id} className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{trip.destination}</h3>
                <p className="text-sm text-muted-foreground">{trip.dates}</p>
              </div>
              <Badge variant="outline" className={cn(
                "text-xs",
                trip.status === "approved" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
              )}>
                {trip.status === "approved" ? "Approved" : "Pending"}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Plane className="w-4 h-4" />
                <span>{trip.flight.airline} • {trip.flight.departure}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{trip.hotel.name} • {trip.hotel.area}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{trip.ground}</span>
              </div>
            </div>

            {trip.alerts.length > 0 && (
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{trip.alerts[0]}</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground pt-1 border-t border-border/40">
              {trip.purpose}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoursSavedContent() {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-border/40">
        <p className="text-4xl font-bold text-success">{mockHoursSaved.total}h</p>
        <p className="text-sm text-muted-foreground mt-1">saved this month</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">By automation type</h3>
        {mockHoursSaved.breakdown.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.type}</p>
            </div>
            <span className="text-sm font-semibold text-success">{item.hours}h</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-border/40">
        <h3 className="text-sm font-medium text-foreground">By trip</h3>
        {mockHoursSaved.byTrip.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium text-foreground">{item.trip}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span className="text-sm font-semibold text-success">{item.hours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingExpensesContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <p className="text-3xl font-bold text-warning">${mockPendingExpenses.total.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{mockPendingExpenses.count} items pending</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">Needs receipt: 2</Badge>
          <Badge variant="outline" className="text-xs">Submitted: 2</Badge>
        </div>
      </div>

      {mockPendingExpenses.byTrip.map((group, i) => (
        <div key={i} className="space-y-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            {group.trip}
          </h3>
          <div className="space-y-2">
            {group.expenses.map((expense, j) => (
              <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{expense.merchant}</p>
                    <p className="text-xs text-muted-foreground">{expense.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${expense.amount.toFixed(2)}</p>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    expense.status === "needs_receipt" && "bg-destructive/10 text-destructive border-destructive/20",
                    expense.status === "submitted" && "bg-primary/10 text-primary border-primary/20",
                    expense.status === "pending_approval" && "bg-warning/10 text-warning border-warning/20"
                  )}>
                    {expense.status === "needs_receipt" ? "Needs receipt" : 
                     expense.status === "submitted" ? "Submitted" : "Awaiting approval"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MilesTraveledContent() {
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-border/40">
        <p className="text-4xl font-bold">{mockMiles.total.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">miles traveled YTD</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Avg per trip</p>
            <p className="text-lg font-semibold">{mockMiles.avgPerTrip.toLocaleString()}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">CO₂ estimate</p>
            <p className="text-lg font-semibold">{mockMiles.co2Estimate}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">By month</h3>
        <div className="space-y-2">
          {mockMiles.byMonth.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-10">{item.month}</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(item.miles / mockMiles.total) * 100 * 3}%` }}
                />
              </div>
              <span className="text-sm font-medium w-16 text-right">{item.miles.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border/40">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Top trips by distance
        </h3>
        {mockMiles.byTrip.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-foreground">{item.trip}</span>
            <span className="text-sm font-semibold">{item.miles.toLocaleString()} mi</span>
          </div>
        ))}
      </div>
    </div>
  );
}
