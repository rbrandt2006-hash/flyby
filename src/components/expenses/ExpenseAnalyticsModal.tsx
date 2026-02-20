import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Plane } from "lucide-react";

const CATEGORY_DATA = [
  { name: "Flights", value: 14820, color: "hsl(217 91% 60%)" },
  { name: "Hotels", value: 11340, color: "hsl(262 52% 60%)" },
  { name: "Meals", value: 7280, color: "hsl(24 95% 55%)" },
  { name: "Transport", value: 4120, color: "hsl(170 64% 45%)" },
  { name: "Conference", value: 6890, color: "hsl(239 84% 67%)" },
  { name: "Other", value: 3780, color: "hsl(220 9% 46%)" },
];

const EMPLOYEE_DATA = [
  { name: "Julia C.", total: 9240 },
  { name: "Marcus J.", total: 8760 },
  { name: "Sarah K.", total: 11320 },
  { name: "Priya P.", total: 7890 },
  { name: "Alex R.", total: 11020 },
];

const MONTHLY_DATA = [
  { month: "Sep", spend: 32100, budget: 40000 },
  { month: "Oct", spend: 38450, budget: 40000 },
  { month: "Nov", spend: 29800, budget: 40000 },
  { month: "Dec", spend: 41200, budget: 40000 },
  { month: "Jan", spend: 44900, budget: 45000 },
  { month: "Feb", spend: 48230, budget: 45000 },
];

const TOP_TRIPS = [
  { trip: "SF Tech Summit", employee: "Team", cost: 14800, dates: "Feb 12–15" },
  { trip: "NYC Q1 Planning", employee: "Julia C.", cost: 11320, dates: "Jan 28–31" },
  { trip: "Boston Investor Mtg", employee: "Alex R.", cost: 8940, dates: "Jan 20–22" },
  { trip: "Chicago Client Visit", employee: "Sarah K.", cost: 7650, dates: "Jan 18–20" },
  { trip: "Seattle Partnership", employee: "Marcus J.", cost: 6890, dates: "Jan 10–12" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export function ExpenseAnalyticsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const totalSpend = MONTHLY_DATA[MONTHLY_DATA.length - 1].spend;
  const prevSpend = MONTHLY_DATA[MONTHLY_DATA.length - 2].spend;
  const changePercent = (((totalSpend - prevSpend) / prevSpend) * 100).toFixed(1);
  const avgCostPerTrip = Math.round(totalSpend / 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl font-bold">Travel Analytics Dashboard</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">February 2025 · Enterprise spend overview</p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Monthly Spend", value: "$48,230", icon: DollarSign, trend: `+${changePercent}%`, up: true },
              { label: "Avg / Trip", value: `$${avgCostPerTrip.toLocaleString()}`, icon: Plane, trend: "+8.2%", up: true },
              { label: "Budget Utilization", value: "107%", icon: TrendingUp, trend: "Over budget", up: false },
              { label: "Approved Rate", value: "72%", icon: TrendingDown, trend: "-3% vs Jan", up: false },
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
            {/* Pie: by category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Spend by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {CATEGORY_DATA.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {CATEGORY_DATA.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium">${(item.value / 1000).toFixed(1)}k</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bar: by employee */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Spend by Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={EMPLOYEE_DATA} barSize={20} margin={{ left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Total" fill="hsl(222 47% 35%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Line chart: MoM */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Month-over-Month Travel Spend vs Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={MONTHLY_DATA} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="spend" name="Actual Spend" stroke="hsl(217 91% 60%)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="budget" name="Budget" stroke="hsl(0 84% 60%)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 trips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top 5 Most Expensive Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TOP_TRIPS.map((trip, i) => (
                  <div key={trip.trip} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{trip.trip}</p>
                      <p className="text-xs text-muted-foreground">{trip.employee} · {trip.dates}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">${trip.cost.toLocaleString()}</p>
                      <div className="h-1.5 bg-muted rounded-full mt-1 w-24 overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(trip.cost / 15000) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
