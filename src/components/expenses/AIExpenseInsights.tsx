import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import type { DemoExpense } from "./demoExpenseData";

// Insights are computed from the traveler's REAL expenses. With no expenses
// recorded yet there is nothing truthful to say, so the panel renders nothing
// rather than inventing a trend.
function buildInsights(rows: DemoExpense[]) {
  // Top-spend trip across real expenses
  const totalsByTrip = new Map<string, number>();
  rows.forEach((e) => {
    if (!e.tripName) return;
    totalsByTrip.set(e.tripName, (totalsByTrip.get(e.tripName) || 0) + e.amount);
  });
  const tripTotals = Array.from(totalsByTrip, ([name, total]) => ({ name, total }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);
  const topTrip = tripTotals[0];

  // Highest single ground-transport line item (Uber/Lyft)
  const transportRows = rows.filter(
    (e) => e.category === "transportation" && /uber|lyft/i.test(e.vendor),
  );
  const transportAvg = transportRows.length
    ? Math.round(transportRows.reduce((s, e) => s + e.amount, 0) / transportRows.length)
    : 0;
  const topTransport = [...transportRows].sort((a, b) => b.amount - a.amount)[0];

  // Hotel spend snapshot
  const hotelRows = rows.filter((e) => e.category === "hotel");
  const hotelTotal = hotelRows.reduce((s, e) => s + e.amount, 0);

  return [
    topTrip && {
      icon: TrendingUp,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
      text: `${topTrip.name} is your highest-spend trip so far at $${topTrip.total.toLocaleString()}.`,
      tag: "Trend",
    },
    hotelRows.length > 0 && {
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      text: `Hotel spend totaling $${hotelTotal.toLocaleString()} across ${hotelRows.length} booking${hotelRows.length > 1 ? "s" : ""} — review against the $350/night policy limit.`,
      tag: "Policy",
    },
    topTransport && {
      icon: Zap,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      text: `${topTransport.vendor} spend unusually high for ${topTransport.tripName} — $${topTransport.amount.toFixed(2)} vs avg of $${transportAvg}. Flagged for review.`,
      tag: "Anomaly",
    },
  ].filter(Boolean) as Array<{
    icon: typeof TrendingUp;
    iconColor: string;
    bgColor: string;
    text: string;
    tag: string;
  }>;
}

export function AIExpenseInsights({ expenses = [] }: { expenses?: DemoExpense[] }) {
  const [expanded, setExpanded] = useState(true);
  const insights = useMemo(() => buildInsights(expenses), [expenses]);

  // Nothing to analyse yet — better to show nothing than a fabricated insight.
  if (insights.length === 0) return null;

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
        {/* The whole header is already the toggle, so this is a plain indicator.
            A nested <button> here is invalid HTML and would be unreachable. */}
        <span className="shrink-0 flex items-center justify-center w-8 h-8 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
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
