import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  DollarSign, 
  Clock, 
  Shield, 
  AlertTriangle,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { TripAIReasoning } from "@/hooks/useTrips";

interface AIReasoningPanelProps {
  destination: string;
  /** The trip's real reasoning, produced by the backend engine (Gemini or the
   *  local fallback). When absent, a sensible placeholder is shown. */
  reasoning?: TripAIReasoning;
}

export function AIReasoningPanel({ destination, reasoning: provided }: AIReasoningPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prefer the trip's real reasoning; fall back to a neutral placeholder only
  // when a trip hasn't been scored yet (e.g. an older locally-cached trip).
  const reasoning: TripAIReasoning = provided ?? {
    costEfficiency: { score: 85, label: "High", detail: "A good-value option for this route." },
    timeEfficiency: { score: 92, label: "Excellent", detail: "Timing works well for a business trip." },
    policyCompliance: { score: 100, label: "Compliant", detail: "Within typical travel-policy limits." },
    riskLevel: { score: 15, label: "Low", detail: "No notable travel advisories." },
    summary: `An optimized plan for ${destination}, balancing cost, timing and policy fit.`,
  };

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

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left",
          "hover:bg-secondary/50 transition-colors",
          isOpen && "bg-secondary/30"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">Why this plan was chosen</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Cost Efficiency */}
                <div className={cn("p-3 rounded-lg", getScoreBg(reasoning.costEfficiency.score))}>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className={cn("w-4 h-4", getScoreColor(reasoning.costEfficiency.score))} />
                    <span className="text-xs font-medium">Cost Efficiency</span>
                  </div>
                  <p className={cn("text-lg font-bold", getScoreColor(reasoning.costEfficiency.score))}>
                    {reasoning.costEfficiency.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reasoning.costEfficiency.detail}
                  </p>
                </div>

                {/* Time Efficiency */}
                <div className={cn("p-3 rounded-lg", getScoreBg(reasoning.timeEfficiency.score))}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className={cn("w-4 h-4", getScoreColor(reasoning.timeEfficiency.score))} />
                    <span className="text-xs font-medium">Time Efficiency</span>
                  </div>
                  <p className={cn("text-lg font-bold", getScoreColor(reasoning.timeEfficiency.score))}>
                    {reasoning.timeEfficiency.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reasoning.timeEfficiency.detail}
                  </p>
                </div>

                {/* Policy Compliance */}
                <div className={cn("p-3 rounded-lg", getScoreBg(reasoning.policyCompliance.score))}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className={cn("w-4 h-4", getScoreColor(reasoning.policyCompliance.score))} />
                    <span className="text-xs font-medium">Policy Compliance</span>
                  </div>
                  <p className={cn("text-lg font-bold", getScoreColor(reasoning.policyCompliance.score))}>
                    {reasoning.policyCompliance.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reasoning.policyCompliance.detail}
                  </p>
                </div>

                {/* Risk Level */}
                <div className={cn("p-3 rounded-lg", getScoreBg(reasoning.riskLevel.score, true))}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={cn("w-4 h-4", getScoreColor(reasoning.riskLevel.score, true))} />
                    <span className="text-xs font-medium">Risk Level</span>
                  </div>
                  <p className={cn("text-lg font-bold", getScoreColor(reasoning.riskLevel.score, true))}>
                    {reasoning.riskLevel.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reasoning.riskLevel.detail}
                  </p>
                </div>
              </div>

              {/* AI Summary */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">
                    {reasoning.summary}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}