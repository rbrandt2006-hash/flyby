import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  team: string;
  upcomingTrip?: {
    destination: string;
    startDate: string;
    endDate: string;
    startAt: Date;
    endAt: Date;
  };
}

interface TeamMemberCardProps {
  member: TeamMember;
  onClick: () => void;
}

export function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card 
      className={cn(
        "group cursor-pointer border border-border/50 bg-card",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-300 ease-out"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary/30 transition-all">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {member.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {member.role} · {member.team}
              </p>
            </div>

            {/* Upcoming trip */}
            {member.upcomingTrip ? (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {member.upcomingTrip.destination}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {member.upcomingTrip.startDate} – {member.upcomingTrip.endDate}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <MapPin className="w-3.5 h-3.5" />
                <span>No upcoming trips</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
