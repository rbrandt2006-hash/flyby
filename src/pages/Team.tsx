import { useState, useMemo } from "react";
import { Search, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type TeamMember } from "@/components/team/TeamMemberCard";
import { TeamMemberRow } from "@/components/team/TeamMemberRow";
import { TeamMemberDetailPanel } from "@/components/team/TeamMemberDetailPanel";
import { GlassPanel } from "@/components/team/GlassPanel";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { toast } from "sonner";

// Mock team data
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Product Manager",
    team: "Product",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    upcomingTrip: { destination: "New York, NY", startDate: "Apr 21", endDate: "Apr 24" },
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Sales Director",
    team: "Sales",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    upcomingTrip: { destination: "Chicago, IL", startDate: "May 5", endDate: "May 7" },
  },
  {
    id: "3",
    name: "Emily Watson",
    role: "Engineering Lead",
    team: "Engineering",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    upcomingTrip: { destination: "San Francisco, CA", startDate: "May 19", endDate: "May 22" },
  },
  {
    id: "4",
    name: "David Kim",
    role: "UX Designer",
    team: "Design",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    name: "Lisa Martinez",
    role: "Account Executive",
    team: "Sales",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    upcomingTrip: { destination: "Austin, TX", startDate: "Jun 9", endDate: "Jun 11" },
  },
  {
    id: "6",
    name: "James Wilson",
    role: "CFO",
    team: "Finance",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    upcomingTrip: { destination: "London, UK", startDate: "Jul 14", endDate: "Jul 18" },
  },
];

type Filter = "all" | "traveling" | "office";

export default function Team() {
  const { demoMode } = useDemoMode();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const teamMembers = demoMode ? mockTeamMembers : [];

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
    if (filter === "traveling") return list.filter((m) => m.upcomingTrip);
    if (filter === "office") return list.filter((m) => !m.upcomingTrip);
    return list;
  }, [filter, search, teamMembers]);

  const travelingMembers = filtered.filter((m) => m.upcomingTrip);
  const officeMembers = filtered.filter((m) => !m.upcomingTrip);

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

      {/* Empty State */}
      {filtered.length === 0 && (
        <GlassPanel className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full glass-row flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-medium text-foreground">No team members found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter
            </p>
          </div>
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
