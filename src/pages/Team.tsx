import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { TeamMemberCard, type TeamMember } from "@/components/team/TeamMemberCard";
import { TeamMemberPanel } from "@/components/team/TeamMemberPanel";
import { cn } from "@/lib/utils";

// Mock team data
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Product Manager",
    team: "Product",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    upcomingTrip: {
      destination: "New York, NY",
      startDate: "Jan 15",
      endDate: "Jan 18",
    },
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Sales Director",
    team: "Sales",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    upcomingTrip: {
      destination: "Chicago, IL",
      startDate: "Jan 20",
      endDate: "Jan 22",
    },
  },
  {
    id: "3",
    name: "Emily Watson",
    role: "Engineering Lead",
    team: "Engineering",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    upcomingTrip: {
      destination: "San Francisco, CA",
      startDate: "Jan 25",
      endDate: "Jan 28",
    },
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
    upcomingTrip: {
      destination: "Austin, TX",
      startDate: "Feb 5",
      endDate: "Feb 7",
    },
  },
  {
    id: "6",
    name: "James Wilson",
    role: "CFO",
    team: "Finance",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    upcomingTrip: {
      destination: "London, UK",
      startDate: "Feb 10",
      endDate: "Feb 14",
    },
  },
];

export default function Team() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setPanelOpen(true);
  };

  const travelingMembers = mockTeamMembers.filter((m) => m.upcomingTrip);
  const atHomeMembers = mockTeamMembers.filter((m) => !m.upcomingTrip);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground">
          See where your colleagues are traveling
        </p>
      </div>

      {/* Team Member Panel */}
      <TeamMemberPanel
        member={selectedMember}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />

      {/* Traveling Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground">
            Currently Traveling ({travelingMembers.length})
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {travelingMembers.map((member, index) => (
            <div
              key={member.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TeamMemberCard 
                member={member} 
                onClick={() => handleMemberClick(member)} 
              />
            </div>
          ))}
        </div>
      </section>

      {/* At Office Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          At Office ({atHomeMembers.length})
        </h2>
        {atHomeMembers.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm">
                Everyone is currently traveling!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {atHomeMembers.map((member, index) => (
              <div
                key={member.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(travelingMembers.length + index) * 50}ms` }}
              >
                <TeamMemberCard 
                  member={member} 
                  onClick={() => handleMemberClick(member)} 
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
