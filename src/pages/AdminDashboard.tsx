import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Users, Plane, DollarSign, TrendingUp, TrendingDown, MapPin,
  Search, Check, X, Clock, Shield, BarChart3, Building2,
  ChevronRight, ArrowRight, UserPlus, AlertCircle,
} from "lucide-react";
import { useTrips } from "@/hooks/useTrips";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock org data for MVP
const mockOrgMembers = [
  { id: "u1", name: "Julia Chen", email: "julia@company.com", role: "user", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop", trips: 3, spend: 4200 },
  { id: "u2", name: "Marcus Johnson", email: "marcus@company.com", role: "user", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", trips: 5, spend: 7800 },
  { id: "u3", name: "Sarah Chen", email: "sarah@company.com", role: "user", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", trips: 2, spend: 3100 },
  { id: "u4", name: "David Kim", email: "david@company.com", role: "moderator", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", trips: 1, spend: 1500 },
  { id: "u5", name: "Emily Watson", email: "emily@company.com", role: "user", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", trips: 4, spend: 6200 },
];

const mockPendingApprovals = [
  { id: "a1", traveler: "Julia Chen", destination: "London, UK", dates: "Mar 15-19", cost: 3200, status: "pending" },
  { id: "a2", traveler: "Marcus Johnson", destination: "Tokyo, Japan", dates: "Mar 22-28", cost: 5800, status: "pending" },
  { id: "a3", traveler: "Emily Watson", destination: "Chicago, IL", dates: "Apr 2-4", cost: 1200, status: "pending" },
];

const mockTopDestinations = [
  { city: "New York, NY", count: 12, spend: 18400 },
  { city: "San Francisco, CA", count: 9, spend: 14200 },
  { city: "London, UK", count: 6, spend: 22800 },
  { city: "Chicago, IL", count: 5, spend: 6500 },
  { city: "Tokyo, Japan", count: 3, spend: 14100 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "approvals">("overview");

  const totalTrips = mockOrgMembers.reduce((s, m) => s + m.trips, 0);
  const totalSpend = mockOrgMembers.reduce((s, m) => s + m.spend, 0);

  const filteredMembers = useMemo(() => {
    if (!search) return mockOrgMembers;
    const q = search.toLowerCase();
    return mockOrgMembers.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [search]);

  const handleApprove = (id: string) => {
    toast.success("Travel request approved");
  };
  const handleReject = (id: string) => {
    toast("Travel request rejected", { description: "The traveler will be notified." });
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "team" as const, label: "Team", icon: Users },
    { id: "approvals" as const, label: "Approvals", icon: Clock },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-[90rem] mx-auto space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your organization's travel</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <ArrowRight className="w-4 h-4" /> User Dashboard
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "approvals" && mockPendingApprovals.length > 0 && (
                  <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center bg-warning/15 text-warning">
                    {mockPendingApprovals.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Team Members</span>
                </div>
                <p className="text-3xl font-bold">{mockOrgMembers.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Flights</span>
                </div>
                <p className="text-3xl font-bold">{totalTrips}</p>
                <span className="text-xs text-success flex items-center gap-0.5 mt-1"><TrendingUp className="w-3 h-3" /> 18% vs last month</span>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Monthly Spend</span>
                </div>
                <p className="text-3xl font-bold">${totalSpend.toLocaleString()}</p>
                <span className="text-xs text-success flex items-center gap-0.5 mt-1"><TrendingDown className="w-3 h-3" /> 8% under budget</span>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                  <span className="text-sm text-muted-foreground">Pending Approvals</span>
                </div>
                <p className="text-3xl font-bold">{mockPendingApprovals.length}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Destinations + Recent Activity */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Top Destinations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockTopDestinations.map((dest, i) => (
                  <div key={dest.city} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{dest.city}</p>
                        <p className="text-xs text-muted-foreground">{dest.count} trips</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">${dest.spend.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <CardTitle className="text-base">Pending Approvals</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("approvals")} className="text-xs text-muted-foreground">
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockPendingApprovals.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium">{a.traveler}</p>
                      <p className="text-xs text-muted-foreground">{a.destination} · {a.dates}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">${a.cost.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:bg-success/10" onClick={() => handleApprove(a.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleReject(a.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button className="gap-2" onClick={() => toast.info("Invite sent! (MVP)")}>
              <UserPlus className="w-4 h-4" /> Invite Member
            </Button>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "text-xs",
                      member.role === "admin" && "bg-primary/10 text-primary",
                      member.role === "moderator" && "bg-warning/10 text-warning",
                    )}>
                      {member.role}
                    </Badge>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{member.trips} trips</p>
                      <p className="text-xs text-muted-foreground">${member.spend.toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/team")}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Approvals Tab */}
      {activeTab === "approvals" && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-semibold">Travel Requests</h2>
          {mockPendingApprovals.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Check className="w-10 h-10 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">All travel requests have been reviewed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mockPendingApprovals.map(a => (
                <Card key={a.id} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                          <Plane className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{a.traveler}</p>
                          <p className="text-sm text-muted-foreground">
                            {a.destination} · {a.dates}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">${a.cost.toLocaleString()}</span>
                        <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="default" className="gap-1" onClick={() => handleApprove(a.id)}>
                            <Check className="w-3 h-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive hover:bg-destructive/5" onClick={() => handleReject(a.id)}>
                            <X className="w-3 h-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
