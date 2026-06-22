import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Sparkles, X, ChevronRight, Check } from "lucide-react";
import { format } from "date-fns";
import type { CalendarEvent } from "@/services/mockCalendarService";

interface DraftSummary {
  id: string;
  estimatedCost: number;
  status?: "draft" | "pending" | "confirmed" | "cancelled" | "archived";
  approvalStatus?: "none" | "pending" | "approved" | "rejected";
}

interface CalendarEventsDisplayProps {
  events: CalendarEvent[];
  connectedEmail: string | null;
  onDisconnect: () => void;
  onCreateTrip?: (event: CalendarEvent) => void;
  onViewTrip?: (tripId: string) => void;
  draftsByEventId?: Record<string, DraftSummary>;
}

export function CalendarEventsDisplay({
  events,
  connectedEmail,
  onDisconnect,
  onCreateTrip,
  onViewTrip,
  draftsByEventId = {},
}: CalendarEventsDisplayProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Synced Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">{connectedEmail}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDisconnect}>
            <X className="w-4 h-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {events.length} upcoming event{events.length !== 1 ? 's' : ''} detected that may require travel — drafts are generated automatically.
        </p>
        <div className="space-y-3">
          {events.map((event) => {
            const draft = draftsByEventId[event.id];
            return (
              <div
                key={event.id}
                className="p-4 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{event.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(event.startDate), "MMM d")} - {format(new Date(event.endDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    {draft ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Draft ready
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Est. ${draft.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{event.description}</p>
                      )
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={draft ? "default" : "outline"}
                    onClick={() => onCreateTrip?.(event)}
                    className="shrink-0"
                  >
                    {draft ? (
                      <>
                        Review Draft
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Generating…
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

