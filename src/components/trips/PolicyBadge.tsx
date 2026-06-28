import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluatePolicy, type TravelPolicy } from "@/services/policyEvaluator";
import type { LocalTrip } from "@/hooks/useTrips";

interface Props {
  trip: Pick<LocalTrip, "estimatedCost" | "flight" | "hotel" | "startDate" | "endDate">;
  policy: TravelPolicy | null;
  className?: string;
}

export function PolicyBadge({ trip, policy, className }: Props) {
  const result = evaluatePolicy(trip, policy);
  const config = {
    "compliant":     { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400", Icon: ShieldCheck },
    "needs-approval":{ className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",         Icon: ShieldAlert },
    "over-budget":   { className: "bg-destructive/10 text-destructive border-destructive/20",                       Icon: ShieldX },
    "no-policy":     { className: "bg-muted text-muted-foreground border-border",                                   Icon: Shield },
  }[result.status];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("text-xs gap-1 cursor-help", config.className, className)}>
            <config.Icon className="w-3 h-3" />
            {result.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-medium mb-1">Policy: {result.label}</p>
          <ul className="space-y-0.5">
            {result.reasons.map((r, i) => (
              <li key={i} className="text-muted-foreground">• {r}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
