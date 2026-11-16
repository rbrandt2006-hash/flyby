import { motion } from "framer-motion";
import { CalendarClock, Plane, Receipt, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TripAgentState } from "@/hooks/useTripAgent";
import { canAutoResolve } from "@/services/tripAgent";
import type { TripProposal } from "@/services/calendarTrips";
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
  /** Plan the trip for a meeting — opens the normal planner with it filled in. */
  onBookMeeting: (proposal: TripProposal) => void;
  onRebookTrip: (trip: LocalTrip) => void;
  onOpenExpenses: () => void;
}

export function TripAgentPanel({
  agent, trips, onBookMeeting, onRebookTrip, onOpenExpenses,
}: TripAgentPanelProps) {
  const findings = agent.unbooked.length + agent.drifts.length + agent.reportsDue.length;

  // Nothing connected and nothing to report — stay out of the way entirely.
  if (!agent.connected && agent.reportsDue.length === 0) return null;
  // A failed read is itself worth saying: an empty panel would otherwise read as
  // "your calendar is clear" when Flyby never managed to look.
  if (findings === 0 && !agent.syncError) return null;

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
          {/* Couldn't read the calendar at all */}
          {agent.syncError && (
            <Row
              icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
              text="Flyby couldn't read your connected calendar, so this list may be incomplete."
              note={`Reason: ${agent.syncError}. Reconnecting the calendar in Settings usually fixes it.`}
              actionLabel="Try again"
              onAction={() => agent.refresh()}
            />
          )}

          {/* A meeting that still needs travel booked */}
          {agent.unbooked.slice(0, 4).map(({ summary, proposal }) => (
            <Row
              key={`unbooked-${proposal.key}`}
              icon={<CalendarClock className="w-4 h-4 text-primary" />}
              text={summary}
              note={proposalNote(proposal)}
              actionLabel="Plan trip"
              onAction={() => onBookMeeting(proposal)}
            />
          ))}

          {/* A trip that no longer matches the calendar */}
          {agent.drifts.slice(0, 4).map((drift) => {
            const trip = tripById(drift.trip.id);
            const fixable = canAutoResolve(drift);
            const replan = agent.replans[drift.trip.id];
            // A ticket can't be changed from here, so a moved meeting is
            // planned again for its new days rather than "rebooked".
            const ticketed = Boolean(trip?.flight?.bookingReference);
            return (
              <Row
                key={`drift-${drift.trip.id}`}
                icon={
                  fixable
                    ? <Plane className="w-4 h-4 text-warning" />
                    : <AlertTriangle className="w-4 h-4 text-destructive" />
                }
                text={drift.summary}
                actionLabel={fixable ? (replan ? "Plan new dates" : "Rebook") : undefined}
                onAction={
                  fixable && replan ? () => onBookMeeting(replan)
                    : fixable && trip ? () => onRebookTrip(trip)
                      : undefined
                }
                note={
                  !fixable ? "Needs a decision — the meeting is gone, so the trip may need cancelling."
                    : replan ? `${replan.plan}.${ticketed ? " Your existing ticket isn't changed by this — change or cancel it with the airline." : ""}`
                      : undefined
                }
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

/**
 * What Flyby would do about a meeting, and what it's going on: the travel days,
 * then anything the traveler should know before trusting it.
 */
function proposalNote(proposal: TripProposal): string {
  const parts = [`${proposal.plan}.`];
  if (proposal.arriveBy) parts.push("Flights are picked to land in time for it.");
  if (proposal.cityInferred) {
    parts.push(`The event doesn't name a city — Flyby AI read this as ${proposal.destinationCity}. Check before booking.`);
  }
  if (proposal.existingTravel) parts.push(proposal.existingTravel);
  return parts.join(" ");
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
