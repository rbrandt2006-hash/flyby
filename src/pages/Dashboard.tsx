import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Calendar, AlertTriangle, Sparkles, ArrowRight, Clock, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [tripInput, setTripInput] = useState("");

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  // Mock data for demo
  const upcomingTrips = [
    { id: 1, destination: "San Francisco, CA", dates: "Jan 8-10, 2025", status: "approved", purpose: "Client meeting" },
    { id: 2, destination: "Seattle, WA", dates: "Jan 15-17, 2025", status: "pending", purpose: "Team offsite" },
  ];

  const calendarSuggestions = [
    { id: 1, event: "Q1 Planning Meeting", location: "Chicago, IL", date: "Jan 20, 2025" },
  ];

  const alerts = [
    { id: 1, type: "warning", message: "Weather advisory for Seattle area - potential delays", trip: "Seattle trip" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 lg:pb-0">
      {/* Welcome header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">Good morning, {firstName}</h1>
        <p className="text-muted-foreground mt-1">Here's your travel command center</p>
      </div>

      {/* AI Trip Input */}
      <Card className="animate-slide-up border-2 border-primary/10 shadow-lg" style={{ animationDelay: "0.1s" }}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <CardTitle className="text-lg">Plan a trip with AI</CardTitle>
          </div>
          <CardDescription>Describe your travel needs in natural language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder='Try: "Book me a flight to NYC next Tuesday for a client pitch near Times Square"'
                value={tripInput}
                onChange={(e) => setTripInput(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="accent" size="lg" className="shrink-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Plan trip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.trip}</p>
                </div>
                <Button variant="outline" size="sm">View alternatives</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar suggestions */}
      {calendarSuggestions.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Travel suggestions from your calendar
          </h2>
          {calendarSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-primary/20 hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium">You have "{suggestion.event}" in {suggestion.location}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.date}</p>
                </div>
                <Button variant="default" size="sm">
                  Prepare travel options
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
        {[
          { icon: Plane, label: "Upcoming trips", value: "2", color: "text-primary" },
          { icon: Clock, label: "Hours saved", value: "48", color: "text-success" },
          { icon: DollarSign, label: "Pending expenses", value: "$1,240", color: "text-warning" },
          { icon: MapPin, label: "Miles traveled", value: "12,450", color: "text-accent" },
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming trips */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming trips</h2>
          <Button variant="ghost" size="sm">View all <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {upcomingTrips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{trip.destination}</h3>
                      <p className="text-sm text-muted-foreground">{trip.dates}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    trip.status === "approved" 
                      ? "bg-success/10 text-success" 
                      : "bg-warning/10 text-warning"
                  }`}>
                    {trip.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{trip.purpose}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
