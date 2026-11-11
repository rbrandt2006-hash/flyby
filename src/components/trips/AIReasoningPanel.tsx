import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  ChevronDown,
  DollarSign,
  Clock,
  Shield,
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { isReasoningPending, type TripAIReasoning } from "@/hooks/useTrips";

interface AIReasoningPanelProps {
  destination: string;
  /** The trip's real assessment, produced by the backend engine (Gemini, or
   *  the built-in rules when Gemini is unavailable). */
  reasoning?: TripAIReasoning;
  /** Start expanded rather than collapsed. */
  defaultOpen?: boolean;
  /** Ask for a fresh assessment. Without it, no re-assess button is shown. */
  onReassess?: () => void;
}

const getScoreColor = (score: number, isRisk = false) => {
  if (isRisk) {
    if (score <= 30) return "text-success";
    if (score <= 60) return "text-warning";
    return "text-destructive";
  }
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

const getScoreBg = (score: number, isRisk = false) => {
  if (isRisk) {
    if (score <= 30) return "bg-success/10";
    if (score <= 60) return "bg-warning/10";
    return "bg-destructive/10";
  }
  if (score >= 80) return "bg-success/10";
  if (score >= 50) return "bg-warning/10";
  return "bg-destructive/10";
};

export function AIReasoningPanel({ destination, reasoning, defaultOpen = false, onReassess }: AIReasoningPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pending = isReasoningPending(reasoning);

  // Say who wrote it — never present the built-in rules as AI.
  const source = !reasoning || pending
    ? null
    : reasoning.engine === "gemini"
      ? "Assessed by Gemini"
      : reasoning.engine === "local"
        ? "Assessed with Flyby's built-in rules — Gemini was unavailable"
        : null;
  const assessedAt = reasoning?.assessedAt && !pending ? new Date(reasoning.assessedAt) : null;

  const metrics = reasoning && !pending
    ? [
        { key: "cost", title: "Cost Efficiency", icon: DollarSign, panel: reasoning.costEfficiency, risk: false },
        { key: "time", title: "Time Efficiency", icon: Clock, panel: reasoning.timeEfficiency, risk: false },
        { key: "policy", title: "Policy Compliance", icon: Shield, panel: reasoning.policyCompliance, risk: false },
        { key: "risk", title: "Risk Level", icon: AlertTriangle, panel: reasoning.riskLevel, risk: true },
      ]
    : [];

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between gap-3 p-5 text-left",
          "hover:bg-secondary/50 transition-colors",
          isOpen && "pb-4"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">AI trip assessment</p>
            <p className="text-xs text-muted-foreground truncate">
              {pending
                ? "Assessing this trip…"
                : !reasoning
                  ? "Not assessed yet"
                  : "Cost, timing, policy fit and risk for this plan"}
            </p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {pending ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  Flyby is checking the cost, timing, policy fit and risk of your {destination} trip. This takes a few seconds.
                </div>
              ) : !reasoning ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/40">
                  <p className="text-sm text-muted-foreground">
                    This trip hasn't been assessed against your travel policy yet.
                  </p>
                  {onReassess && (
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={onReassess}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Assess trip
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {metrics.map(({ key, title, icon: Icon, panel, risk }) => (
                      <div key={key} className={cn("p-3 rounded-lg", getScoreBg(panel.score, risk))}>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4", getScoreColor(panel.score, risk))} />
                          <span className="text-xs font-medium">{title}</span>
                        </div>
                        <p className={cn("text-lg font-bold", getScoreColor(panel.score, risk))}>{panel.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{panel.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{reasoning.summary}</p>
                    </div>
                  </div>

                  {(source || assessedAt || onReassess) && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {[source, assessedAt && !isNaN(assessedAt.getTime()) ? format(assessedAt, "MMM d, h:mm a") : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {onReassess && (
                        <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs" onClick={onReassess}>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Re-assess
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
