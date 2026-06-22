import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./TeamMemberCard";

interface TeamMemberRowProps {
  member: TeamMember;
  onClick: () => void;
}

function getMemberStatus(member: TeamMember): "traveling" | "upcoming" | "returned" | "office" {
  if (!member.upcomingTrip) return "office";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < member.upcomingTrip.startAt) return "upcoming";
  if (today > member.upcomingTrip.endAt) return "returned";
  return "traveling";
}

export function TeamMemberRow({ member, onClick }: TeamMemberRowProps) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const status = getMemberStatus(member);

  const statusConfig = {
    traveling: { label: "Traveling", className: "bg-success/15 text-success border-success/20" },
    upcoming: { label: "Upcoming", className: "bg-primary/15 text-primary border-primary/20" },
    returned: { label: "Returned", className: "bg-muted/40 text-muted-foreground border-border/30" },
    office: { label: "At Office", className: "bg-muted/40 text-muted-foreground border-border/30" },
  };

  return (
    <button
      onClick={onClick}
      className="w-full glass-row rounded-2xl p-4 flex items-center gap-4 text-left cursor-pointer group"
    >
      {/* Avatar */}
      <Avatar className="h-11 w-11 ring-2 ring-border/30 group-hover:ring-primary/20 transition-all duration-400">
        <AvatarImage src={member.avatar} alt={member.name} />
        <AvatarFallback className="bg-muted/60 text-foreground/70 font-medium text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight">
          {member.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {member.role} · {member.team}
        </p>
      </div>

      {/* Trip Info / Location */}
      <div className="text-right shrink-0">
        {member.upcomingTrip ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {member.upcomingTrip.destination}
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground">
                {member.upcomingTrip.startDate} – {member.upcomingTrip.endDate}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">No trips</span>
        )}
      </div>

      {/* Status Capsule */}
      <div
        className={cn(
          "glass-capsule rounded-full px-3 py-1 text-[11px] font-medium shrink-0",
          statusConfig[status].className
        )}
      >
        {statusConfig[status].label}
      </div>
    </button>
  );
}
