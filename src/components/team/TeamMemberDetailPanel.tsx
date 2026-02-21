import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Calendar,
  MapPin,
  MessageCircle,
  Route,
  User,
  X,
} from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamMemberCard";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMemberDetailPanelProps {
  member: TeamMember | null;
  open: boolean;
  onClose: () => void;
}

export function TeamMemberDetailPanel({
  member,
  open,
  onClose,
}: TeamMemberDetailPanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!member) return null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            <GlassPanel variant="strong" className="p-8 rounded-3xl relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full glass-row hover:bg-muted/40 transition-all"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="flex flex-col items-center text-center space-y-5">
                {/* Avatar */}
                <Avatar className="h-20 w-20 ring-4 ring-border/20 shadow-lg">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-muted/60 text-foreground font-semibold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Name & Role */}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">
                    {member.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {member.role} · {member.team}
                  </p>
                </div>

                {/* Trip Details */}
                {member.upcomingTrip && (
                  <GlassPanel className="w-full p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Plane className="w-4 h-4 text-success" />
                      <span>Upcoming Trip</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-center">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {member.upcomingTrip.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {member.upcomingTrip.startDate} –{" "}
                          {member.upcomingTrip.endDate}
                        </span>
                      </div>
                    </div>
                  </GlassPanel>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 w-full pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50"
                  >
                    <Route className="w-4 h-4 mr-2" />
                    Itinerary
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 glass-row rounded-2xl border-none h-11 text-sm font-medium hover:bg-muted/50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
