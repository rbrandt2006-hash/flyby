import { Plane, Building2, Calendar, Users, DollarSign, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SyncedConversation } from "./ChannelsContainer";

interface ChatContextPanelProps {
  conversation: SyncedConversation | null;
}

// Mock context data based on conversation
function getContextData(conversation: SyncedConversation | null) {
  if (!conversation) return null;

  if (conversation.hasTravelIntent) {
    return {
      trip: {
        destination: "New York, NY",
        dates: "Jan 15 – Jan 18",
        status: "Confirmed",
      },
      flight: {
        airline: "United Airlines",
        flight: "UA 214",
        departure: "2:45 PM SFO",
        arrival: "5:30 PM JFK",
        status: "On time",
      },
      hotel: {
        name: "Marriott Downtown",
        checkIn: "Jan 15",
        checkOut: "Jan 18",
      },
      meetings: [
        { title: "Q1 Planning", time: "10:00 AM", attendees: 6 },
        { title: "Client Presentation", time: "2:00 PM", attendees: 4 },
      ],
      expenses: { estimated: 2450, approved: 1800 },
    };
  }

  if (conversation.expenseId) {
    return {
      expenses: { estimated: 524.80, approved: 0 },
      trip: null, flight: null, hotel: null, meetings: [],
    };
  }

  return null;
}

export function ChatContextPanel({ conversation }: ChatContextPanelProps) {
  const data = getContextData(conversation);

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 p-6">
        <Calendar className="w-6 h-6 mb-2 opacity-30" />
        <p className="text-xs text-center">Select a travel conversation to see context</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Context</h3>

      {data.trip && (
        <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Trip Overview
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">{data.trip.destination}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {data.trip.dates}
            </div>
            <span className="inline-block px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-medium">
              {data.trip.status}
            </span>
          </div>
        </div>
      )}

      {data.flight && (
        <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Plane className="w-3.5 h-3.5 text-primary" />
            Flight
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-medium text-foreground">{data.flight.airline} · {data.flight.flight}</p>
            <p className="text-muted-foreground">{data.flight.departure} → {data.flight.arrival}</p>
            <span className="inline-block px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-medium">
              {data.flight.status}
            </span>
          </div>
        </div>
      )}

      {data.hotel && (
        <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Hotel
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-medium text-foreground">{data.hotel.name}</p>
            <p className="text-muted-foreground">{data.hotel.checkIn} – {data.hotel.checkOut}</p>
          </div>
        </div>
      )}

      {data.meetings && data.meetings.length > 0 && (
        <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            Meetings
          </div>
          <div className="space-y-2">
            {data.meetings.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-foreground">{m.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{m.time}</p>
                </div>
                <span className="text-muted-foreground">{m.attendees} people</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.expenses && (
        <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            Expenses
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Estimated</p>
              <p className="font-semibold text-foreground">${data.expenses.estimated.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Approved</p>
              <p className="font-semibold text-foreground">${data.expenses.approved.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
