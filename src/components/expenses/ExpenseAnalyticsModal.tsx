import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, DollarSign, Plane, CheckCircle2 } from "lucide-react";
import { demoExpenses, type DemoExpense } from "./demoExpenseData";

const CATEGORY_COLORS: Record<string, string> = {
  flight: "hsl(217 91% 60%)",
  hotel: "hsl(262 52% 60%)",
  meals: "hsl(24 95% 55%)",
  transportation: "hsl(170 64% 45%)",
  conference: "hsl(239 84% 67%)",
  other: "hsl(220 9% 46%)",
};

const CATEGORY_LABELS: Record<string, string> = {
  flight: "Flights",
  hotel: "Hotels",
  meals: "Meals",
  transportation: "Transport",
  conference: "Conference",
  other: "Other",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: ${Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
      ))}
    </div>
  );
};

function parseExpenseDate(s: string): Date {
  // demoExpense.date format: "Feb 12, 2025"
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  expenses?: DemoExpense[];
}

export function ExpenseAnalyticsModal({ open, onOpenChange, expenses = demoExpenses }: Props) {
  const {
    categoryData,
    employeeData,
    monthlyData,
    topTrips,
    totalSpend,
    approvedRate,
    avgCostPerTrip,
    monthChangePct,
  } = useMemo(() => {
    // Category aggregation
    const byCat = new Map<string, number>();
    expenses.forEach(e => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const categoryData = Array.from(byCat.entries())
      .map(([k, v]) => ({ name: CATEGORY_LABELS[k] ?? k, value: Number(v.toFixed(2)), color: CATEGORY_COLORS[k] ?? "hsl(220 9% 46%)" }))
      .sort((a, b) => b.value - a.value);

    // Employee aggregation
    const byEmp = new Map<string, number>();
    expenses.forEach(e => byEmp.set(e.employee, (byEmp.get(e.employee) ?? 0) + e.amount));
    const employeeData = Array.from(byEmp.entries())
      .map(([name, total]) => ({
        name: name.split(" ").map((p, i) => i === 0 ? p : p[0] + ".").join(" "),
        total: Number(total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);

    // Monthly aggregation — last 6 months (including current)
    const now = new Date();
    const months: { key: string; label: string; date: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        date: d,
      });
    }
    const byMonth = new Map<string, number>();
    expenses.forEach(e => {
      const d = parseExpenseDate(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount);
    });
    const monthlyTotals = months.map(m => Number((byMonth.get(m.key) ?? 0).toFixed(2)));
    const maxSpend = Math.max(...monthlyTotals, 1);
    // Budget = round up max spend to nearest 500, with a small headroom
    const budget = Math.max(500, Math.ceil((maxSpend * 1.1) / 500) * 500);
    const monthlyData = months.map((m, i) => ({
      month: m.label,
      spend: monthlyTotals[i],
      budget,
    }));

    // Top trips
    const byTrip = new Map<string, number>();
    expenses.forEach(e => byTrip.set(e.tripName, (byTrip.get(e.tripName) ?? 0) + e.amount));
    const topTrips = Array.from(byTrip.entries())
      .map(([trip, cost]) => ({ trip, cost: Number(cost.toFixed(2)) }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
    const approvedAmt = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);
    const approvedRate = totalSpend > 0 ? Math.round((approvedAmt / totalSpend) * 100) : 0;
    const tripCount = byTrip.size || 1;
    const avgCostPerTrip = totalSpend / tripCount;

    const lastIdx = monthlyTotals.length - 1;
    const current = monthlyTotals[lastIdx];
    const prev = monthlyTotals[lastIdx - 1] ?? 0;
    const monthChangePct = prev > 0 ? ((current - prev) / prev) * 100 : 0;

    return { categoryData, employeeData, monthlyData, topTrips, totalSpend, approvedRate, avgCostPerTrip, monthChangePct };
  }, [expenses]);

  const topTripMax = topTrips[0]?.cost ?? 1;
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl font-bold">Travel Analytics Dashboard</DialogTitle>
          <DialogDescription>
            Spend breakdowns by trip, category and month across your travel.
          </DialogDescription>
          <p className="text-sm text-muted-foreground mt-1">{monthLabel} · Enterprise spend overview</p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Spend",
                value: `$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                icon: DollarSign,
                trend: `${monthChangePct >= 0 ? "+" : ""}${monthChangePct.toFixed(1)}% MoM`,
                up: monthChangePct >= 0,
              },
              {
                label: "Avg / Trip",
                value: `$${avgCostPerTrip.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                icon: Plane,
                trend: `${topTrips.length} trips`,
                up: true,
              },
              {
                label: "Top Category",
                value: categoryData[0]?.name ?? "—",
                icon: TrendingUp,
                trend: categoryData[0] ? `$${categoryData[0].value.toLocaleString()}` : "",
                up: true,
              },
              {
                label: "Approved Rate",
                value: `${approvedRate}%`,
                icon: CheckCircle2,
                trend: `of total spend`,
                up: approvedRate >= 50,
              },
            ].map(kpi => (
              <Card key={kpi.label} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                  <p className="text-xl font-bold">{kpi.value}</p>
                  <p className={`text-xs mt-1 ${kpi.up ? "text-success" : "text-destructive"}`}>{kpi.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Spend by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No expense data yet.</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                          {categoryData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1">
                      {categoryData.map(item => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-medium">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Spend by Employee</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeData.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No expense data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={employeeData} barSize={20} margin={{ left: -10 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" name="Total" fill="hsl(222 47% 35%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Month-over-Month Travel Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="spend" name="Actual Spend" stroke="hsl(217 91% 60%)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="budget" name="Budget" stroke="hsl(0 84% 60%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top {topTrips.length} Most Expensive Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {topTrips.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No trip expenses yet.</p>
              ) : (
                <div className="space-y-2">
                  {topTrips.map((trip, i) => (
                    <div key={trip.trip} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{trip.trip}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">${trip.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <div className="h-1.5 bg-muted rounded-full mt-1 w-24 overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(trip.cost / topTripMax) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
