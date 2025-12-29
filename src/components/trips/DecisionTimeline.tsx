import { motion } from "framer-motion";
import { 
  PlusCircle, 
  Sparkles, 
  Edit3, 
  MessageSquare, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TripTimelineEvent } from "@/hooks/useTrips";

interface DecisionTimelineProps {
  events: TripTimelineEvent[];
}

const getEventIcon = (type: TripTimelineEvent["type"]) => {
  switch (type) {
    case "created":
      return PlusCircle;
    case "ai_recommendation":
      return Sparkles;
    case "user_edit":
      return Edit3;
    case "message_sent":
      return MessageSquare;
    case "plan_refined":
      return RefreshCw;
    case "confirmed":
      return CheckCircle2;
    case "cancelled":
      return XCircle;
    default:
      return Clock;
  }
};

const getEventColor = (type: TripTimelineEvent["type"]) => {
  switch (type) {
    case "created":
      return "bg-primary/20 text-primary";
    case "ai_recommendation":
      return "bg-accent/20 text-accent-foreground";
    case "user_edit":
      return "bg-warning/20 text-warning";
    case "message_sent":
      return "bg-secondary text-secondary-foreground";
    case "plan_refined":
      return "bg-info/20 text-info";
    case "confirmed":
      return "bg-success/20 text-success";
    case "cancelled":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function DecisionTimeline({ events }: DecisionTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No timeline events yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event, index) => {
        const Icon = getEventIcon(event.type);
        const colorClass = getEventColor(event.type);
        const isLast = index === events.length - 1;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start gap-3"
          >
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%+4px)] bg-border" />
            )}

            {/* Icon */}
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10",
              colorClass
            )}>
              <Icon className="w-3 h-3" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium text-foreground">
                {event.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(event.timestamp), "MMM d, h:mm a")}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
