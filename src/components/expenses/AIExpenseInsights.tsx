import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const insights = [
  {
    icon: TrendingUp,
    iconColor: "text-warning",
    bgColor: "bg-warning/10",
    text: "Travel spending up 18% vs last month, primarily driven by the SF Tech Summit ($14.8k across 5 team members).",
    tag: "Trend",
  },
  {
    icon: AlertTriangle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
    text: "NYC trips averaging 22% over budget. 3 of 4 recent NYC bookings exceeded hotel policy limit of $350/night.",
    tag: "Policy",
  },
  {
    icon: Zap,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
    text: "Uber spend unusually high for Q1 Planning trip — $124.80 vs avg of $47. Flagged for review.",
    tag: "Anomaly",
  },
];

export function AIExpenseInsights() {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="font-semibold text-sm">AI Expense Insights</p>
          <p className="text-xs text-muted-foreground">3 observations this month · Updated just now</p>
        </div>
        <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-2 border-t border-border/40 pt-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg ${insight.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <insight.icon className={`w-3.5 h-3.5 ${insight.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{insight.tag} · </span>
                    <span className="text-sm text-foreground/90">{insight.text}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
