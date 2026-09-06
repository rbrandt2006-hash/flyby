import { useState, useMemo } from "react";
import { Search, Users, UserPlus, ShieldAlert, Clock, MapPinned, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type TeamMember } from "@/components/team/TeamMemberCard";
import { TeamMemberRow } from "@/components/team/TeamMemberRow";
import { TeamMemberDetailPanel } from "@/components/team/TeamMemberDetailPanel";
import { GlassPanel } from "@/components/team/GlassPanel";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useTeam } from "@/hooks/useTeam";
import { toast } from "sonner";

// Build a date range relative to today and format as "Mon D". Also
// returns the raw Date objects so status logic can compare against today.
function relRange(startOffsetDays: number, durationDays: number) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + startOffsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return {
    destination: "", // filled by spread below
    startDate: fmt(start),
    endDate: fmt(end),
    startAt: start,
    endAt: end,
  };
}

// Mock team data — dates generated relative to today so the demo stays current.
const mockTeamMembers: TeamMember[] = [];

// Determine a member's current travel status based on today's date.
// "traveling" = today is within the trip range (inclusive),
// "upcoming"  = trip hasn't started yet,
// "returned"  = trip has ended,
// "office"    = no trip scheduled.
function getMemberStatus(member: TeamMember): "traveling" | "upcoming" | "returned" | "office" {
  if (!member.upcomingTrip) return "office";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < member.upcomingTrip.startAt) return "upcoming";
  if (today > member.upcomingTrip.endAt) return "returned";
  return "traveling";
}

type Filter = "all" | "traveling" | "office";

export default function Team() {
  const { demoMode } = useDemoMode();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  // Real workspace teammates from the backend. A real team needs more than one
  // person, so a workspace with only you (or a personal account with none)
  // falls back to the demo roster in demo mode rather than showing a lonely
  // single card. When real teammates exist, they always win.
  const { members: realMembers } = useTeam();
  const hasRealTeam = realMembers.length >= 2;
  const teamMembers = hasRealTeam ? realMembers : (demoMode ? mockTeamMembers : realMembers);

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setPanelOpen(true);
  };

  const filtered = useMemo(() => {
    let list = teamMembers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.team.toLowerCase().includes(q) ||
          m.upcomingTrip?.destination.toLowerCase().includes(q)
      );
    }
    if (filter === "traveling") return list.filter((m) => getMemberStatus(m) === "traveling");
    if (filter === "office") return list.filter((m) => getMemberStatus(m) === "office" || getMemberStatus(m) === "returned");
    return list;
  }, [filter, search, teamMembers]);

  const travelingMembers = filtered.filter((m) => getMemberStatus(m) === "traveling");
  const upcomingMembers = filtered.filter((m) => getMemberStatus(m) === "upcoming");
  const officeMembers = filtered.filter((m) => getMemberStatus(m) === "office" || getMemberStatus(m) === "returned");

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "traveling", label: "Traveling" },
    { key: "office", label: "At Office" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Background ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-success/[0.02] blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Team
          </h1>
          <p className="text-muted-foreground mt-1">
            See where your colleagues are traveling
          </p>
        </div>

        {/* Glass Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team..."
            className="glass-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
        </div>
      </div>

      {/* Segmented Control */}
      <div className="glass-panel rounded-2xl p-1 inline-flex gap-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300",
              filter === f.key
                ? "bg-card/90 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Currently Traveling */}
      {(filter === "all" || filter === "traveling") && travelingMembers.length > 0 && (
        <GlassPanel className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-subtle" />
            <h2 className="text-base font-semibold text-foreground">
              Currently Traveling
            </h2>
            <span className="text-xs text-muted-foreground ml-1">
              {travelingMembers.length}
            </span>
          </div>
          <div className="space-y-2">
            {travelingMembers.map((member, i) => (
              <div
                key={member.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <TeamMemberRow
                  member={member}
                  onClick={() => handleMemberClick(member)}
                />
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Upcoming Travel */}
      {(filter === "all") && upcomingMembers.length > 0 && (
        <GlassPanel className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-subtle" />
            <h2 className="text-base font-semibold text-foreground">
              Upcoming Travel
            </h2>
            <span className="text-xs text-muted-foreground ml-1">
              {upcomingMembers.length}
            </span>
          </div>
          <div className="space-y-2">
            {upcomingMembers.map((member, i) => (
              <div
                key={member.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(travelingMembers.length + i) * 60}ms` }}
              >
                <TeamMemberRow
                  member={member}
                  onClick={() => handleMemberClick(member)}
                />
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* At Office */}
      {(filter === "all" || filter === "office") && officeMembers.length > 0 && (
        <GlassPanel className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-foreground">
              At Office
            </h2>
            <span className="text-xs text-muted-foreground">
              {officeMembers.length}
            </span>
          </div>
          <div className="space-y-2">
            {officeMembers.map((member, i) => (
              <div
                key={member.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(travelingMembers.length + upcomingMembers.length + i) * 60}ms` }}
              >
                <TeamMemberRow
                  member={member}
                  onClick={() => handleMemberClick(member)}
                />
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Risk & Safety — Coming soon */}
      <GlassPanel className="p-6 space-y-4 opacity-90">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Risk & Safety</h2>
              <p className="text-xs text-muted-foreground">Keep travelers safe wherever they go</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Coming soon
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-lg border border-border/60 bg-secondary/20">
            <div className="flex items-center gap-2 mb-1">
              <MapPinned className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">High-risk destination alerts</p>
            </div>
            <p className="text-xs text-muted-foreground">Flag trips to regions with active advisories before booking.</p>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-secondary/20">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Traveler check-in pings</p>
            </div>
            <p className="text-xs text-muted-foreground">Scheduled safety check-ins with escalation to managers.</p>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-secondary/20">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Travel insurance coordination</p>
            </div>
            <p className="text-xs text-muted-foreground">Attach policies per trip and surface claim contacts in-app.</p>
          </div>
        </div>
      </GlassPanel>


      {/* Empty State */}
      {filtered.length === 0 && (
        <GlassPanel className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full glass-row flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium text-foreground">
              {teamMembers.length === 0 ? "Invite teammates to see where everyone's traveling." : "No team members found"}
            </p>
            {teamMembers.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter
              </p>
            )}
          </div>
          {teamMembers.length === 0 && (
            <Button onClick={() => toast.success("Invite link copied — share it with your team")}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          )}
        </GlassPanel>
      )}

      {/* Detail Panel */}
      <TeamMemberDetailPanel
        member={selectedMember}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
