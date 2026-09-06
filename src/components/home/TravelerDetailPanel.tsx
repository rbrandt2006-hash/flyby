import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, MessageSquare, MapPin, Plane, Building2, Calendar, Users, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import flybyLogo from "@/assets/flybyLogo";
import { TravelerMessageComposer } from "@/components/home/TravelerMessageComposer";
import { useChats } from "@/hooks/useChats";

interface TravelerInfo {
  name: string;
  destination: string;
  status: string;
  journeyStep: number;
  totalSteps: number;
  statusType: "info" | "success" | "warning";
  initials: string;
  tripId?: string;
}

interface TravelerDetailPanelProps {
  traveler: TravelerInfo | null;
  open: boolean;
  onClose: () => void;
}

function getStatusDetails(status: string, destination: string) {
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

function createTravelerParticipantId(name: string) {
  return `traveler:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export function TravelerDetailPanel({ traveler, open, onClose }: TravelerDetailPanelProps) {
  const navigate = useNavigate();
  const { currentUser, findExistingChat, createChat, sendMessage } = useChats();
  const [composerOpen, setComposerOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [showSentState, setShowSentState] = useState(false);

  const participantId = useMemo(() => (traveler ? createTravelerParticipantId(traveler.name) : ""), [traveler]);
  const existingChat = useMemo(() => (participantId ? findExistingChat(participantId) : null), [participantId, findExistingChat]);

  useEffect(() => {
    if (!open || !traveler) {
      setComposerOpen(false);
      setMessageDraft("");
      setShowSentState(false);
    }
  }, [open, traveler]);

  if (!traveler) return null;

  const statusInfo = getStatusDetails(traveler.status, traveler.destination);

  const conversationPreview: Array<{
    id: string;
    text: string;
    createdAt: string;
    sender: "me" | "traveler" | "system";
  }> = (existingChat?.messages ?? []).slice(-8).map((message) => ({
    id: message.id,
    text: message.text,
    createdAt: message.createdAt,
    sender:
      message.senderId === currentUser.id
        ? "me"
        : message.senderId === "system"
          ? "system"
          : "traveler",
  }));

  const handleMessageTraveler = () => {
    setComposerOpen(true);
    setShowSentState(false);
  };

  const handleSendMessage = () => {
    const text = messageDraft.trim();
    if (!text) return;

    let chat = existingChat;
    if (!chat) {
      chat = createChat(`Chat with ${traveler.name}`, [participantId], {
        type: "general",
        participantIds: [currentUser.id, participantId],
      });
    }

    sendMessage(chat.id, text, currentUser.id, false);
    setMessageDraft("");
    setShowSentState(true);
    window.setTimeout(() => setShowSentState(false), 1800);
  };

  const handleViewItinerary = () => {
    onClose();
    if (traveler.tripId) {
      navigate(`/trips/${traveler.tripId}`);
    } else {
      navigate("/trips");
    }
  };

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
              className="relative w-full max-w-md pointer-events-auto bg-background rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-5 border-b border-border/40 flex items-start justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {traveler.initials}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background",
                        traveler.statusType === "success" && "bg-success",
                        traveler.statusType === "warning" && "bg-warning",
                        traveler.statusType === "info" && "bg-primary",
                      )}
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{traveler.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {traveler.destination}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <img src={flybyLogo.url} alt="Flyby AI" className="h-5 opacity-40" />
                  <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-3 bg-muted/30 shrink-0">
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

              <div className="px-6 py-5 space-y-3 flex-1 min-h-0 overflow-y-auto">
                <h3 className="text-sm font-semibold text-foreground mb-3">{statusInfo.title}</h3>
                {statusInfo.details.map((detail) => (
                  <div key={`${detail.label}-${detail.value}`} className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">{detail.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground text-right max-w-[200px]">{detail.value}</span>
                      {detail.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            detail.badge === "success" && "bg-success/10 text-success",
                            detail.badge === "info" && "bg-primary/10 text-primary",
                          )}
                        >
                          {detail.badge === "success" ? "✓" : "●"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex gap-3 shrink-0">
                <Button variant="default" className="flex-1 gap-2" size="sm" onClick={handleMessageTraveler}>
                  <MessageSquare className="w-4 h-4" />
                  Message traveler
                </Button>
                <Button variant="outline" className="flex-1 gap-2 group/btn" size="sm" onClick={handleViewItinerary}>
                  <Calendar className="w-4 h-4" />
                  View itinerary
                  <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity">→</span>
                </Button>
              </div>

              <TravelerMessageComposer
                open={composerOpen}
                traveler={{
                  name: traveler.name,
                  initials: traveler.initials,
                  destination: traveler.destination,
                  statusType: traveler.statusType,
                }}
                messages={conversationPreview}
                value={messageDraft}
                onValueChange={setMessageDraft}
                onClose={() => setComposerOpen(false)}
                onSend={handleSendMessage}
                sentStateVisible={showSentState}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
