import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamMemberCard";
import { motion, AnimatePresence } from "framer-motion";
import flybyLogo from "@/assets/flyby-logo-new.png";

type DetailView = "main" | "message" | "itinerary" | "profile";

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
function getMockItinerary(name: string, trip?: { destination: string; startDate: string; endDate: string }) {
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

  const handleBack = () => setView("main");

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
            <GlassPanel variant="strong" className="rounded-3xl relative overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={view !== "main" ? handleBack : onClose} className="p-2 -ml-2 rounded-full glass-row hover:bg-muted/40 transition-all">
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {view === "main" && (
                    <span className="text-sm font-medium text-muted-foreground">Back</span>
                  )}
                </div>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full glass-row hover:bg-muted/40 transition-all">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {view === "main" && (
                  <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-8 pb-8">
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
                            <Plane className="w-4 h-4 text-success" />
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
                      <div className="flex gap-3 w-full pt-2">
                        <Button variant="outline" className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50" onClick={() => setView("message")}>
                          <MessageCircle className="w-4 h-4 mr-2" />Message
                        </Button>
                        <Button variant="outline" className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50" onClick={() => setView("itinerary")}>
                          <Route className="w-4 h-4 mr-2" />Itinerary
                        </Button>
                        <Button variant="outline" className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50" onClick={() => setView("profile")}>
                          <User className="w-4 h-4 mr-2" />Profile
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {view === "message" && (
                  <motion.div key="message" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col" style={{ height: "420px" }}>
                    <div className="px-6 pb-3 border-b border-border/20">
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
                    <div className="px-6 pb-6 pt-3 border-t border-border/20">
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
                  <motion.div key="itinerary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 pb-8 max-h-[450px] overflow-y-auto">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      {member.upcomingTrip ? `${member.upcomingTrip.destination} Trip` : "No Trip Scheduled"}
                    </h3>
                    {itinerary ? (
                      <div className="space-y-4">
                        {/* Flight */}
                        <GlassPanel className="p-4 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Plane className="w-4 h-4 text-primary" />
                            <span>Flight</span>
                            <Badge variant="secondary" className="ml-auto text-[10px] bg-success/10 text-success">{itinerary.flight.status}</Badge>
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
                        {/* Hotel */}
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
                        {/* Meetings */}
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

                {view === "profile" && (
                  <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 pb-8">
                    <div className="flex flex-col items-center text-center mb-6">
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
                          <div><span className="text-xs text-muted-foreground">Phone</span><p className="text-sm font-medium">+1 (415) 555-0{Math.floor(Math.random() * 900 + 100)}</p></div>
                        </div>
                      </GlassPanel>
                      {member.upcomingTrip && (
                        <GlassPanel className="p-4 rounded-2xl">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Plane className="w-4 h-4 text-success" />
                            <span>Current Status</span>
                          </div>
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs">Traveling to {member.upcomingTrip.destination}</Badge>
                        </GlassPanel>
                      )}
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50" onClick={() => setView("message")}>
                          <MessageCircle className="w-4 h-4 mr-2" />Message
                        </Button>
                        <Button variant="outline" className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50">
                          <Calendar className="w-4 h-4 mr-2" />Calendar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
