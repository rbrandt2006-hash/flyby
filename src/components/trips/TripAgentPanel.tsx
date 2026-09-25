import { motion } from "framer-motion";
import { CalendarClock, Plane, Receipt, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TripAgentState } from "@/hooks/useTripAgent";
import { canAutoResolve } from "@/services/tripAgent";
import type { LocalTrip } from "@/hooks/useTrips";

/**
 * What the agent noticed on the calendar.
 *
 * Three kinds of finding, each with the one action that resolves it:
 *   • a meeting that needs a trip booked
 *   • a trip whose meeting moved or was cancelled, so it needs rebooking
 *   • a finished trip with expenses ready to submit
 *
 * Renders nothing when there is nothing to act on, so it never adds noise to a
 * page where everything is already in order.
 */

interface TripAgentPanelProps {
  agent: TripAgentState;
  trips: LocalTrip[];
  onBookMeeting: (query: string) => void;
  onRebookTrip: (trip: LocalTrip) => void;
  onOpenExpenses: () => void;
}

export function TripAgentPanel({
  agent, trips, onBookMeeting, onRebookTrip, onOpenExpenses,
}: TripAgentPanelProps) {
  const findings = agent.unbooked.length + agent.drifts.length + agent.reportsDue.length;

  // Nothing connected and nothing to report — stay out of the way entirely.
  if (!agent.connected && agent.reportsDue.length === 0) return null;
  if (findings === 0) return null;

  const tripById = (id: string) => trips.find((t) => t.id === id);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20 bg-primary/[0.03]">
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Flyby noticed</h2>
          <Badge variant="secondary" className="text-xs">{findings}</Badge>
          {agent.account && (
            <span className="ml-auto text-xs text-muted-foreground truncate max-w-[45%]">
              {agent.account}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => agent.refresh()}
            disabled={agent.checking}
            title="Check the calendar again"
            className="text-muted-foreground"
          >
            <RefreshCw className={agent.checking ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
          </Button>
        </div>

        <CardContent className="px-5 pb-4 pt-0 space-y-2">
          {/* A meeting that still needs travel booked */}
          {agent.unbooked.slice(0, 4).map(({ event, summary }) => (
            <Row
              key={`unbooked-${event.id}`}
              icon={<CalendarClock className="w-4 h-4 text-primary" />}
              text={summary}
              actionLabel="Book it"
              onAction={() =>
                onBookMeeting(`Trip to ${event.location} from ${event.startDate} to ${event.endDate}`)
              }
            />
          ))}

          {/* A trip that no longer matches the calendar */}
          {agent.drifts.slice(0, 4).map((drift) => {
            const trip = tripById(drift.trip.id);
            const fixable = canAutoResolve(drift);
            return (
              <Row
                key={`drift-${drift.trip.id}`}
                icon={
                  fixable
                    ? <Plane className="w-4 h-4 text-warning" />
                    : <AlertTriangle className="w-4 h-4 text-destructive" />
                }
                text={drift.summary}
                actionLabel={fixable ? "Rebook" : undefined}
                onAction={fixable && trip ? () => onRebookTrip(trip) : undefined}
                note={fixable ? undefined : "Needs a decision — the meeting is gone, so the trip may need cancelling."}
              />
            );
          })}

          {/* A finished trip with expenses to submit */}
          {agent.reportsDue.slice(0, 4).map((report) => (
            <Row
              key={`report-${report.trip.id}`}
              icon={<Receipt className="w-4 h-4 text-success" />}
              text={report.summary}
              actionLabel="Review report"
              onAction={onOpenExpenses}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Row({
  icon, text, actionLabel, onAction, note,
}: {
  icon: React.ReactNode;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{text}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" className="shrink-0" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
