import { useState, useRef, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Calendar,
  MapPin,
  MessageCircle,
  Route,
  User,
  X,
  ArrowLeft,
  Send,
  Building2,
  Clock,
  Users,
  Mail,
  Phone,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamMemberCard";
import { motion, AnimatePresence } from "framer-motion";

type DetailView = "main" | "message" | "itinerary" | "profile" | "calendar";

interface TeamMemberDetailPanelProps {
  member: TeamMember | null;
  open: boolean;
  onClose: () => void;
}

// Mock chat messages per member
function getMockMessages(name: string, destination?: string) {
  const dest = destination || "the office";
  return [
    { id: "1", sender: name, text: `Hey! Just wanted to let you know I'll be heading to ${dest} next week.`, time: "9:12 AM", isMe: false },
    { id: "2", sender: "You", text: "Great, safe travels! Do you need anything before you go?", time: "9:14 AM", isMe: true },
    { id: "3", sender: name, text: `I land at the airport around 3:15 PM. Hotel check-in is at 5 PM at the Marriott Downtown.`, time: "9:16 AM", isMe: false },
    { id: "4", sender: "You", text: "Perfect. I'll send over the meeting agenda shortly.", time: "9:18 AM", isMe: true },
    { id: "5", sender: name, text: "Sounds good! Looking forward to the Q1 planning session.", time: "9:20 AM", isMe: false },
  ];
}

// Mock itinerary data
function getMockItinerary(_name: string, trip?: { destination: string; startDate: string; endDate: string }) {
  if (!trip) return null;
  return {
    flight: {
      airline: "United Airlines",
      flightNumber: "UA 214",
      departure: "2:45 PM",
      arrival: "5:30 PM",
      from: "SFO",
      to: trip.destination.includes("New York") ? "JFK" : trip.destination.slice(0, 3).toUpperCase(),
      gate: "B22",
      seat: "12A",
      status: "On time" as const,
    },
    hotel: {
      name: "Marriott Downtown",
      address: `411 University St, ${trip.destination}`,
      checkIn: trip.startDate,
      checkOut: trip.endDate,
      confirmation: "MRT-2847291",
      room: "1204",
    },
    meetings: [
      { title: "Q1 Planning Review", time: "10:00 AM – 12:00 PM", attendees: 6 },
      { title: "Client Presentation", time: "2:00 PM – 3:30 PM", attendees: 8 },
      { title: "Team Sync", time: "4:30 PM – 5:00 PM", attendees: 3 },
    ],
  };
}

// ── Calendar mock data per member ──
interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: "travel" | "meeting" | "call" | "client" | "focus" | "office";
  location?: string;
  notes?: string;
  time?: string;
  participants?: string[];
}

function getMockCalendarEvents(memberId: string): CalendarEvent[] {
  const eventsMap: Record<string, CalendarEvent[]> = {
    "1": [ // Sarah Chen
      { id: "s1", title: "New York, NY — Product Summit", startDate: new Date(2026, 0, 15), endDate: new Date(2026, 0, 18), type: "travel", location: "New York, NY", notes: "Annual product summit with partners" },
      { id: "s2", title: "Product Planning Meeting", startDate: new Date(2026, 0, 22), endDate: new Date(2026, 0, 22), type: "meeting", location: "San Francisco HQ", notes: "Q1 roadmap planning", time: "10:00 AM", participants: ["Emily Watson", "David Kim"] },
      { id: "s2b", title: "Design Review Call", startDate: new Date(2026, 0, 22), endDate: new Date(2026, 0, 22), type: "call", location: "Zoom", time: "2:00 PM", participants: ["David Kim", "UX Team"] },
      { id: "s3", title: "Engineering Sync", startDate: new Date(2026, 0, 26), endDate: new Date(2026, 0, 26), type: "call", location: "Google Meet", time: "11:00 AM", participants: ["Emily Watson", "Dev Team"] },
      { id: "s3b", title: "Focus Work — Roadmap Draft", startDate: new Date(2026, 0, 26), endDate: new Date(2026, 0, 26), type: "focus", time: "2:00 PM – 5:00 PM" },
      { id: "s4", title: "Feature Roadmap Review", startDate: new Date(2026, 1, 3), endDate: new Date(2026, 1, 3), type: "meeting", location: "San Francisco HQ", notes: "Review Q2 feature priorities", time: "9:30 AM", participants: ["Marcus Johnson", "James Wilson"] },
      { id: "s4b", title: "Stakeholder Update Call", startDate: new Date(2026, 1, 3), endDate: new Date(2026, 1, 3), type: "call", location: "Zoom", time: "1:00 PM", participants: ["Leadership Team"] },
      { id: "s5", title: "Office Day", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 10), type: "office", location: "San Francisco HQ" },
      { id: "s5b", title: "1:1 with Emily Watson", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 10), type: "meeting", time: "11:00 AM", location: "Conference Room B", participants: ["Emily Watson"] },
      { id: "s5c", title: "Product Demo Prep", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 10), type: "focus", time: "3:00 PM – 5:00 PM" },
      { id: "s6", title: "Boston — Client Workshop", startDate: new Date(2026, 2, 2), endDate: new Date(2026, 2, 4), type: "travel", location: "Boston, MA", notes: "Enterprise client workshop" },
      { id: "s7", title: "Sprint Retrospective", startDate: new Date(2026, 2, 9), endDate: new Date(2026, 2, 9), type: "meeting", time: "10:00 AM", location: "Virtual", participants: ["Product Team"] },
      { id: "s8", title: "Client Check-in — Acme Corp", startDate: new Date(2026, 2, 11), endDate: new Date(2026, 2, 11), type: "client", time: "2:00 PM", location: "Zoom", participants: ["Acme Corp PM", "Lisa Martinez"] },
    ],
    "2": [ // Marcus Johnson
      { id: "m1", title: "Chicago, IL — Sales Conference", startDate: new Date(2026, 0, 20), endDate: new Date(2026, 0, 22), type: "travel", location: "Chicago, IL", notes: "National sales conference" },
      { id: "m2", title: "Pipeline Review", startDate: new Date(2026, 0, 27), endDate: new Date(2026, 0, 27), type: "meeting", location: "San Francisco HQ", notes: "Q1 pipeline deep dive", time: "10:00 AM", participants: ["Sales Team"] },
      { id: "m2b", title: "Sales Strategy Call", startDate: new Date(2026, 0, 27), endDate: new Date(2026, 0, 27), type: "call", location: "Zoom", time: "2:00 PM", participants: ["Lisa Martinez", "Regional Leads"] },
      { id: "m3", title: "Office Day", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 5), type: "office" },
      { id: "m3b", title: "1:1 with Lisa Martinez", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 5), type: "meeting", time: "11:00 AM", location: "Conference Room A", participants: ["Lisa Martinez"] },
      { id: "m3c", title: "Forecast Prep", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 5), type: "focus", time: "2:00 PM – 4:00 PM" },
      { id: "m4", title: "Client Check-in — Acme Corp", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 10), type: "client", time: "10:00 AM", location: "Zoom", participants: ["Acme Corp CRO", "Sarah Chen"] },
      { id: "m4b", title: "Internal Planning Call", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 12), type: "call", time: "1:30 PM", location: "Google Meet", participants: ["Sales Ops"] },
      { id: "m5", title: "Dallas — Enterprise Deal", startDate: new Date(2026, 1, 16), endDate: new Date(2026, 1, 18), type: "travel", location: "Dallas, TX", notes: "Enterprise closing meetings" },
      { id: "m6", title: "Sales Team Standup", startDate: new Date(2026, 2, 3), endDate: new Date(2026, 2, 3), type: "call", location: "Google Meet", time: "9:00 AM", participants: ["Sales Team"] },
      { id: "m6b", title: "Finance Review Meeting", startDate: new Date(2026, 2, 3), endDate: new Date(2026, 2, 3), type: "meeting", time: "11:00 AM", location: "San Francisco HQ", participants: ["James Wilson"] },
      { id: "m7", title: "Focus Work — Q2 Targets", startDate: new Date(2026, 2, 5), endDate: new Date(2026, 2, 5), type: "focus", time: "9:00 AM – 12:00 PM" },
    ],
    "3": [ // Emily Watson
      { id: "e1", title: "San Francisco, CA — Tech Summit", startDate: new Date(2026, 0, 25), endDate: new Date(2026, 0, 28), type: "travel", location: "San Francisco, CA", notes: "Engineering leadership summit" },
      { id: "e2", title: "Sprint Planning", startDate: new Date(2026, 1, 2), endDate: new Date(2026, 1, 2), type: "meeting", location: "Virtual", notes: "Sprint 14 planning", time: "10:00 AM", participants: ["Engineering Team"] },
      { id: "e2b", title: "Code Review Session", startDate: new Date(2026, 1, 2), endDate: new Date(2026, 1, 2), type: "focus", time: "2:00 PM – 4:00 PM" },
      { id: "e3", title: "Architecture Review", startDate: new Date(2026, 1, 9), endDate: new Date(2026, 1, 9), type: "meeting", location: "San Francisco HQ", time: "9:30 AM", participants: ["David Kim", "Tech Leads"] },
      { id: "e3b", title: "Vendor Call — AWS", startDate: new Date(2026, 1, 9), endDate: new Date(2026, 1, 9), type: "call", location: "Zoom", time: "1:00 PM", participants: ["AWS Account Manager"] },
      { id: "e3c", title: "Focus Work — System Design", startDate: new Date(2026, 1, 9), endDate: new Date(2026, 1, 9), type: "focus", time: "3:00 PM – 5:30 PM" },
      { id: "e4", title: "Office Day", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 12), type: "office" },
      { id: "e4b", title: "1:1 with Sarah Chen", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 12), type: "meeting", time: "11:00 AM", location: "Conference Room C", participants: ["Sarah Chen"] },
      { id: "e5", title: "Seattle — AWS Summit", startDate: new Date(2026, 2, 9), endDate: new Date(2026, 2, 11), type: "travel", location: "Seattle, WA", notes: "AWS re:Invent satellite event" },
      { id: "e6", title: "Engineering All-Hands", startDate: new Date(2026, 2, 16), endDate: new Date(2026, 2, 16), type: "meeting", time: "10:00 AM", location: "Virtual", participants: ["All Engineering"] },
    ],
    "4": [ // David Kim
      { id: "d1", title: "Design System Workshop", startDate: new Date(2026, 0, 28), endDate: new Date(2026, 0, 28), type: "meeting", location: "San Francisco HQ", time: "10:00 AM", participants: ["UX Team", "Emily Watson"] },
      { id: "d1b", title: "Focus Work — Prototyping", startDate: new Date(2026, 0, 28), endDate: new Date(2026, 0, 28), type: "focus", time: "2:00 PM – 5:00 PM" },
      { id: "d2", title: "Office Day", startDate: new Date(2026, 1, 4), endDate: new Date(2026, 1, 4), type: "office" },
      { id: "d2b", title: "Design Critique", startDate: new Date(2026, 1, 4), endDate: new Date(2026, 1, 4), type: "meeting", time: "11:00 AM", location: "Design Studio", participants: ["UX Team"] },
      { id: "d3", title: "Usability Testing", startDate: new Date(2026, 1, 11), endDate: new Date(2026, 1, 11), type: "meeting", location: "San Francisco HQ", notes: "User research sessions", time: "9:00 AM", participants: ["Research Team"] },
      { id: "d3b", title: "Client Feedback Call", startDate: new Date(2026, 1, 11), endDate: new Date(2026, 1, 11), type: "client", time: "2:00 PM", location: "Zoom", participants: ["Beta Testers"] },
      { id: "d4", title: "Portland — Design Conference", startDate: new Date(2026, 2, 16), endDate: new Date(2026, 2, 18), type: "travel", location: "Portland, OR", notes: "Annual design conference" },
      { id: "d5", title: "Design Handoff Review", startDate: new Date(2026, 2, 23), endDate: new Date(2026, 2, 23), type: "meeting", time: "10:00 AM", location: "Virtual", participants: ["Emily Watson", "Dev Team"] },
    ],
    "5": [ // Lisa Martinez
      { id: "l1", title: "Austin, TX — Client Visit", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 7), type: "travel", location: "Austin, TX", notes: "Key account review" },
      { id: "l2", title: "Sales Strategy Call", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 12), type: "call", location: "Zoom", time: "10:00 AM", participants: ["Marcus Johnson", "Sales Team"] },
      { id: "l2b", title: "Client Presentation Prep", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 12), type: "focus", time: "1:00 PM – 3:00 PM" },
      { id: "l3", title: "Office Day", startDate: new Date(2026, 1, 18), endDate: new Date(2026, 1, 18), type: "office" },
      { id: "l3b", title: "Account Review — TechCo", startDate: new Date(2026, 1, 18), endDate: new Date(2026, 1, 18), type: "client", time: "2:00 PM", location: "San Francisco HQ", participants: ["TechCo Account Team"] },
      { id: "l4", title: "Pipeline Standup", startDate: new Date(2026, 2, 3), endDate: new Date(2026, 2, 3), type: "call", time: "9:30 AM", location: "Google Meet", participants: ["Sales Ops"] },
      { id: "l5", title: "Miami — Partner Summit", startDate: new Date(2026, 2, 23), endDate: new Date(2026, 2, 25), type: "travel", location: "Miami, FL", notes: "Partner ecosystem summit" },
    ],
    "6": [ // James Wilson
      { id: "j1", title: "London, UK — Investor Meetings", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 14), type: "travel", location: "London, UK", notes: "Series C investor roadshow" },
      { id: "j2", title: "Executive Budget Review", startDate: new Date(2026, 1, 18), endDate: new Date(2026, 1, 18), type: "meeting", location: "San Francisco HQ", notes: "Annual budget review", time: "10:00 AM", participants: ["Executive Team"] },
      { id: "j2b", title: "Board Prep Call", startDate: new Date(2026, 1, 18), endDate: new Date(2026, 1, 18), type: "call", time: "2:00 PM", location: "Zoom", participants: ["CFO Team"] },
      { id: "j3", title: "Finance Strategy Call", startDate: new Date(2026, 1, 21), endDate: new Date(2026, 1, 21), type: "call", location: "Zoom", notes: "Quarterly financial strategy", time: "11:00 AM", participants: ["Finance Team"] },
      { id: "j3b", title: "Focus Work — Board Deck", startDate: new Date(2026, 1, 21), endDate: new Date(2026, 1, 21), type: "focus", time: "2:00 PM – 5:00 PM" },
      { id: "j4", title: "Board Preparation Meeting", startDate: new Date(2026, 1, 25), endDate: new Date(2026, 1, 25), type: "meeting", location: "San Francisco HQ", notes: "Board deck preparation", time: "9:00 AM", participants: ["Sarah Chen", "Marcus Johnson"] },
      { id: "j4b", title: "Investor Relations Call", startDate: new Date(2026, 1, 25), endDate: new Date(2026, 1, 25), type: "call", time: "1:00 PM", location: "Zoom", participants: ["IR Team"] },
      { id: "j4c", title: "Budget Planning", startDate: new Date(2026, 1, 25), endDate: new Date(2026, 1, 25), type: "meeting", time: "3:00 PM", location: "San Francisco HQ", participants: ["Finance Team"] },
      { id: "j5", title: "Office Day", startDate: new Date(2026, 2, 2), endDate: new Date(2026, 2, 2), type: "office" },
      { id: "j5b", title: "1:1 with Marcus Johnson", startDate: new Date(2026, 2, 2), endDate: new Date(2026, 2, 2), type: "meeting", time: "11:00 AM", location: "Executive Suite", participants: ["Marcus Johnson"] },
      { id: "j6", title: "Tokyo — Asia Expansion", startDate: new Date(2026, 2, 16), endDate: new Date(2026, 2, 20), type: "travel", location: "Tokyo, Japan", notes: "Asia market expansion meetings" },
    ],
  };
  return eventsMap[memberId] || [];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function MemberCalendarView({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 1, 1)); // Feb 2026 default
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const events = useMemo(() => getMockCalendarEvents(memberId), [memberId]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return events.filter(e => date >= new Date(e.startDate.getFullYear(), e.startDate.getMonth(), e.startDate.getDate()) && date <= new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate()));
  };

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const eventColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "travel": return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "meeting": return "bg-primary/15 text-primary border-primary/30";
      case "call": return "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30";
      case "client": return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "focus": return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
      case "office": return "bg-muted text-muted-foreground border-border/50";
    }
  };

  const eventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "travel": return <Plane className="w-3 h-3 shrink-0" />;
      case "meeting": return <Users className="w-3 h-3 shrink-0" />;
      case "call": return <Phone className="w-3 h-3 shrink-0" />;
      case "client": return <Briefcase className="w-3 h-3 shrink-0" />;
      case "focus": return <Clock className="w-3 h-3 shrink-0" />;
      case "office": return <Building2 className="w-3 h-3 shrink-0" />;
    }
  };

  const eventEmoji = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "travel": return "✈️";
      case "meeting": return "👥";
      case "call": return "📞";
      case "client": return "🤝";
      case "focus": return "🧠";
      case "office": return "🏢";
    }
  };

  const prev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const next = () => setCurrentMonth(new Date(year, month + 1, 1));
  const today = () => setCurrentMonth(new Date(2026, 1, 1));

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="px-6 pb-3 border-b border-border/20">
        <h3 className="text-sm font-semibold text-foreground">{memberName}'s Calendar</h3>
        <p className="text-xs text-muted-foreground">Travel & Meeting Schedule</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{MONTHS[month]} {year}</span>
            <button onClick={today} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors">Today</button>
          </div>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-9" />;
            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;
            return (
              <button
                key={day}
                onClick={() => { if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]); }}
                className={cn(
                  "h-9 rounded-lg text-xs font-medium relative transition-all",
                  hasEvents ? "hover:bg-muted/60 cursor-pointer" : "text-muted-foreground/60",
                  dayEvents.some(e => e.type === "travel") && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  dayEvents.some(e => e.type === "meeting") && !dayEvents.some(e => e.type === "travel") && "bg-primary/10 text-primary",
                )}
              >
                {day}
                {hasEvents && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <div key={j} className={cn("w-1 h-1 rounded-full", e.type === "travel" ? "bg-emerald-500" : e.type === "meeting" ? "bg-primary" : "bg-muted-foreground/40")} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Event popup */}
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedEvent.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <GlassPanel className="p-4 rounded-2xl space-y-2">
                <div className="flex items-start justify-between">
                  <div className={cn("flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full border", eventColor(selectedEvent.type))}>
                    {eventIcon(selectedEvent.type)}
                    <span className="capitalize">{selectedEvent.type}</span>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <h4 className="text-sm font-semibold text-foreground">{selectedEvent.title}</h4>
                {selectedEvent.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {selectedEvent.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {selectedEvent.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {selectedEvent.startDate.getTime() !== selectedEvent.endDate.getTime() && ` – ${selectedEvent.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </div>
                {selectedEvent.notes && (
                  <p className="text-xs text-muted-foreground/80 pt-1 border-t border-border/20">{selectedEvent.notes}</p>
                )}
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming events list */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Events</h4>
          {events
            .filter(e => e.startDate >= new Date(year, month, 1) && e.startDate <= new Date(year, month + 1, 0))
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            .map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEvent(e)}
                className={cn("w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all hover:bg-muted/30", eventColor(e.type))}
              >
                {eventIcon(e.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{e.title}</p>
                  <p className="text-[10px] opacity-70">
                    {e.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {e.startDate.getTime() !== e.endDate.getTime() && ` – ${e.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </p>
                </div>
              </button>
            ))}
          {events.filter(e => e.startDate >= new Date(year, month, 1) && e.startDate <= new Date(year, month + 1, 0)).length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-3">No events this month</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared tab bar component ──
function TabBar({ view, onChangeView }: { view: DetailView; onChangeView: (v: DetailView) => void }) {
  const tabs: { key: DetailView; label: string; icon: React.ReactNode }[] = [
    { key: "main", label: "Overview", icon: <User className="w-3.5 h-3.5" /> },
    { key: "message", label: "Message", icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: "itinerary", label: "Itinerary", icon: <Route className="w-3.5 h-3.5" /> },
    { key: "calendar", label: "Calendar", icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: "profile", label: "Profile", icon: <Briefcase className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="flex gap-1 px-6 py-3 border-t border-border/20 bg-background/40">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChangeView(t.key)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-medium transition-all",
            view === t.key ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TeamMemberDetailPanel({ member, open, onClose }: TeamMemberDetailPanelProps) {
  const [view, setView] = useState<DetailView>("main");
  const [messageInput, setMessageInput] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setView("main");
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!member) return null;

  const initials = member.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const messages = getMockMessages(member.name, member.upcomingTrip?.destination);
  const itinerary = getMockItinerary(member.name, member.upcomingTrip);

  const viewTitle = view === "main" ? "Overview" : view === "message" ? "Message" : view === "itinerary" ? "Itinerary" : view === "calendar" ? "Calendar" : "Profile";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            {/* FIXED SIZE SHELL */}
            <GlassPanel variant="strong" className="rounded-3xl relative overflow-hidden flex flex-col" style={{ height: "min(580px, 82vh)" }}>
              {/* ── Fixed header ── */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  {view !== "main" && (
                    <button onClick={() => setView("main")} className="p-2 -ml-2 rounded-full hover:bg-muted/40 transition-all">
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  <span className="text-sm font-medium text-muted-foreground">{viewTitle}</span>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-muted/40 transition-all">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* ── Scrollable content area ── */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {view === "main" && (
                    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="px-8 pb-6">
                      <div className="flex flex-col items-center text-center space-y-5">
                        <Avatar className="h-20 w-20 ring-4 ring-border/20 shadow-lg">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-muted/60 text-foreground font-semibold text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
                          <p className="text-sm text-muted-foreground">{member.role} · {member.team}</p>
                        </div>
                        {member.upcomingTrip && (
                          <GlassPanel className="w-full p-4 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Plane className="w-4 h-4 text-emerald-500" />
                              <span>Upcoming Trip</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 justify-center">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">{member.upcomingTrip.destination}</span>
                              </div>
                              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{member.upcomingTrip.startDate} – {member.upcomingTrip.endDate}</span>
                              </div>
                            </div>
                          </GlassPanel>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {view === "message" && (
                    <motion.div key="message" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }} className="flex flex-col h-full">
                      <div className="px-6 pb-3 border-b border-border/20 shrink-0">
                        <h3 className="text-sm font-semibold text-foreground">Chat with {member.name}</h3>
                        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
                      </div>
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {messages.map((msg) => (
                          <div key={msg.id} className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2.5",
                              msg.isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted/60 text-foreground rounded-bl-md"
                            )}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                              <p className={cn("text-[10px] mt-1", msg.isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>{msg.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-6 pb-4 pt-3 border-t border-border/20 shrink-0">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-muted/40 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30"
                            onKeyDown={(e) => { if (e.key === "Enter") setMessageInput(""); }}
                          />
                          <Button size="icon" className="rounded-xl shrink-0" onClick={() => setMessageInput("")}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {view === "itinerary" && (
                    <motion.div key="itinerary" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }} className="px-6 pb-6">
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        {member.upcomingTrip ? `${member.upcomingTrip.destination} Trip` : "No Trip Scheduled"}
                      </h3>
                      {itinerary ? (
                        <div className="space-y-4">
                          <GlassPanel className="p-4 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Plane className="w-4 h-4 text-primary" />
                              <span>Flight</span>
                              <Badge variant="secondary" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{itinerary.flight.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-muted-foreground text-xs">Airline</span><p className="font-medium">{itinerary.flight.airline}</p></div>
                              <div><span className="text-muted-foreground text-xs">Flight</span><p className="font-medium">{itinerary.flight.flightNumber}</p></div>
                              <div><span className="text-muted-foreground text-xs">Departs</span><p className="font-medium">{itinerary.flight.from} · {itinerary.flight.departure}</p></div>
                              <div><span className="text-muted-foreground text-xs">Arrives</span><p className="font-medium">{itinerary.flight.to} · {itinerary.flight.arrival}</p></div>
                              <div><span className="text-muted-foreground text-xs">Gate</span><p className="font-medium">{itinerary.flight.gate}</p></div>
                              <div><span className="text-muted-foreground text-xs">Seat</span><p className="font-medium">{itinerary.flight.seat}</p></div>
                            </div>
                          </GlassPanel>
                          <GlassPanel className="p-4 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Building2 className="w-4 h-4 text-primary" />
                              <span>Hotel</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div><span className="text-muted-foreground text-xs">Hotel</span><p className="font-medium">{itinerary.hotel.name}</p></div>
                              <div><span className="text-muted-foreground text-xs">Address</span><p className="font-medium">{itinerary.hotel.address}</p></div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-muted-foreground text-xs">Room</span><p className="font-medium">{itinerary.hotel.room}</p></div>
                                <div><span className="text-muted-foreground text-xs">Confirmation</span><p className="font-medium">{itinerary.hotel.confirmation}</p></div>
                              </div>
                            </div>
                          </GlassPanel>
                          <GlassPanel className="p-4 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Users className="w-4 h-4 text-primary" />
                              <span>Meetings</span>
                            </div>
                            <div className="space-y-2">
                              {itinerary.meetings.map((m, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                                  <div>
                                    <p className="text-sm font-medium">{m.title}</p>
                                    <p className="text-xs text-muted-foreground">{m.time}</p>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px]">{m.attendees} people</Badge>
                                </div>
                              ))}
                            </div>
                          </GlassPanel>
                        </div>
                      ) : (
                        <GlassPanel className="p-8 rounded-2xl text-center">
                          <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No upcoming trip scheduled</p>
                        </GlassPanel>
                      )}
                    </motion.div>
                  )}

                  {view === "calendar" && (
                    <motion.div key="calendar" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }} className="flex flex-col h-full">
                      <MemberCalendarView memberId={member.id} memberName={member.name} />
                    </motion.div>
                  )}

                  {view === "profile" && (
                    <motion.div key="profile" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }} className="px-6 pb-6">
                      <div className="flex flex-col items-center text-center mb-5">
                        <Avatar className="h-16 w-16 ring-4 ring-border/20 shadow-lg mb-3">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-muted/60 text-foreground font-semibold text-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="space-y-4">
                        <GlassPanel className="p-4 rounded-2xl space-y-3">
                          <div className="flex items-center gap-3 py-1">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <div><span className="text-xs text-muted-foreground">Department</span><p className="text-sm font-medium">{member.team}</p></div>
                          </div>
                          <div className="flex items-center gap-3 py-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <div><span className="text-xs text-muted-foreground">Office</span><p className="text-sm font-medium">San Francisco, CA</p></div>
                          </div>
                          <div className="flex items-center gap-3 py-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div><span className="text-xs text-muted-foreground">Email</span><p className="text-sm font-medium">{member.name.toLowerCase().replace(" ", ".")}@flyby.com</p></div>
                          </div>
                          <div className="flex items-center gap-3 py-1">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <div><span className="text-xs text-muted-foreground">Phone</span><p className="text-sm font-medium">+1 (415) 555-0{member.id}42</p></div>
                          </div>
                        </GlassPanel>
                        {member.upcomingTrip && (
                          <GlassPanel className="p-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                              <Plane className="w-4 h-4 text-emerald-500" />
                              <span>Current Status</span>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">Traveling to {member.upcomingTrip.destination}</Badge>
                          </GlassPanel>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Fixed footer tab bar ── */}
              <div className="shrink-0">
                <TabBar view={view} onChangeView={setView} />
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
