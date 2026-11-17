import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Copy, Loader2, Plane, Receipt, RefreshCw, ShieldCheck, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CompanyPortalCard } from "@/components/company/CompanyPortalCard";
import { announceCompanyChange, useCompanyPortal } from "@/hooks/useCompanyPortal";
import {
  CompanyError, getMember, listMembers, removeMember, rotateJoinCode, setMemberRole,
  type CompanyMember, type MemberExpense, type MemberTrip, type Portal,
} from "@/services/companyPortal";

/** $388.80, $1,200 — cents only when there are some. */
const money = (amount: number) => {
  const value = amount || 0;
  const cents = Math.round(value * 100) % 100 !== 0;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 })}`;
};

function dayRange(start?: string | null, end?: string | null): string {
  const fmt = (iso: string) => {
    // A bare date is a calendar day, not midnight UTC — read it as such, or a
    // trip on Dec 8 shows as Dec 7 anywhere west of London.
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  if (!start) return "";
  return end && end.slice(0, 10) !== start.slice(0, 10) ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

/**
 * The company dashboard: everyone in the company, where they're going and what
 * they've spent. Only a company admin sees it; anyone else gets their own
 * company card instead.
 */
export default function CompanyDashboard() {
  const { loading: portalLoading, isCompanyAdmin } = useCompanyPortal();

  if (portalLoading) {
    return <div className="max-w-5xl mx-auto space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-40 w-full" /></div>;
  }

  if (!isCompanyAdmin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company</h1>
          <p className="text-muted-foreground mt-1">
            The company dashboard is for your company's admins. Here's your company membership.
          </p>
        </div>
        <Card><CardContent className="p-6"><CompanyPortalCard showDashboardLink={false} /></CardContent></Card>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMember, setOpenMember] = useState<CompanyMember | null>(null);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotating, setRotating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listMembers();
      setPortal(result.portal);
      setMembers(result.members);
    } catch (err) {
      setError(err instanceof CompanyError ? err.message : "Couldn't load your company.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => ({
    traveling: members.filter((m) => m.travelingNow).length,
    upcoming: members.filter((m) => m.upcomingTrip && !m.travelingNow).length,
    pending: members.reduce((sum, m) => sum + m.pendingExpenses, 0),
    spend: members.reduce((sum, m) => sum + m.spend, 0),
  }), [members]);

  const rotate = async () => {
    setRotating(true);
    try {
      const result = await rotateJoinCode();
      setPortal(result.portal);
      announceCompanyChange();
      toast.success("New join code ready", { description: "The old code no longer works. Everyone already in stays in." });
      setRotateOpen(false);
    } catch (err) {
      toast.error(err instanceof CompanyError ? err.message : "Couldn't replace the code.");
    } finally {
      setRotating(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (error || !portal) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card><CardContent className="p-6 space-y-3">
          <p className="font-medium">Couldn't load your company</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load(); }}>Try again</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{portal.name}</h1>
            <Badge variant="outline" className="gap-1 font-normal text-success border-success/30">
              <ShieldCheck className="w-3 h-3" /> Verified
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Your team's trips and expenses. You're an admin of this company.
          </p>
        </div>
        <Card className="w-full sm:w-auto min-w-0">
          <CardContent className="p-3 flex items-center gap-x-2 gap-y-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Join code</span>
            <code className="font-mono text-base tracking-widest">{portal.joinCode}</code>
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => {
                void navigator.clipboard?.writeText(portal.joinCode || "");
                toast.success("Join code copied");
              }}>
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => setRotateOpen(true)}>
                <RefreshCw className="w-3.5 h-3.5" /> Replace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Members" value={String(members.length)} />
        <Stat label="Traveling now" value={String(totals.traveling)} hint={totals.upcoming ? `${totals.upcoming} with a trip coming up` : undefined} />
        <Stat label="Expenses to review" value={String(totals.pending)} attention={totals.pending > 0} />
        <Stat label="Total spend" value={money(totals.spend)} numeric />
      </div>

      {/* Members */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Members</h2>
          <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">Share the join code to add people</span>
        </div>
        {/* Phones: one block per person. */}
        <ul className="sm:hidden divide-y divide-border">
          {members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpenMember(m)}
                className="w-full text-left px-4 py-3 space-y-1 hover:bg-secondary/40 focus-visible:outline-none focus-visible:bg-secondary/60"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{m.name}</span>
                  {m.role === "admin" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>}
                  {m.isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                <div className="text-sm">
                  {m.upcomingTrip
                    ? <>{m.travelingNow ? "Traveling now: " : "Next: "}{m.upcomingTrip.destination} · {dayRange(m.upcomingTrip.startDate, m.upcomingTrip.endDate)}</>
                    : <span className="text-muted-foreground">No trips planned</span>}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {m.tripCount} {m.tripCount === 1 ? "trip" : "trips"} · {money(m.spend)} spent
                  {m.pendingExpenses > 0 && <span className="text-warning"> · {m.pendingExpenses} to review</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Person</th>
                <th className="px-3 py-3 font-medium">Next trip</th>
                <th className="px-3 py-3 font-medium text-right">Trips</th>
                <th className="px-3 py-3 font-medium text-right">Spend</th>
                <th className="px-5 py-3 font-medium text-right">To review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr
                  key={m.id}
                  tabIndex={0}
                  onClick={() => setOpenMember(m)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenMember(m); } }}
                  className="cursor-pointer hover:bg-secondary/40 focus-visible:outline-none focus-visible:bg-secondary/60"
                  aria-label={`Open ${m.name}'s trips and expenses`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{m.name}</span>
                      {m.role === "admin" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>}
                      {m.isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{[m.jobTitle, m.email].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="px-3 py-3">
                    {m.upcomingTrip ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          {m.travelingNow && <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden />}
                          <span>{m.upcomingTrip.destination}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.travelingNow ? "Traveling now · " : ""}{dayRange(m.upcomingTrip.startDate, m.upcomingTrip.endDate)}
                        </div>
                      </div>
                    ) : <span className="text-muted-foreground">No trips planned</span>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{m.tripCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(m.spend)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {m.pendingExpenses > 0
                      ? <Badge variant="outline" className="border-warning/40 text-warning">{m.pendingExpenses}</Badge>
                      : <span className="text-muted-foreground">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {members.length === 1 && (
          <p className="px-5 py-4 text-sm text-muted-foreground border-t border-border">
            It's just you so far. Share the join code {portal.joinCode} with your team — they enter it in Settings.
          </p>
        )}
      </Card>

      <MemberSheet
        member={openMember}
        adminCount={members.filter((m) => m.role === "admin").length}
        onClose={() => setOpenMember(null)}
        onChanged={() => { void load(); }}
      />

      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the join code?</AlertDialogTitle>
            <AlertDialogDescription>
              {portal.joinCode} will stop working straight away, so anyone who has it but hasn't joined yet will need the new
              one. Everyone already in the company stays in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rotating}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void rotate(); }} disabled={rotating}>
              {rotating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Replace code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, hint, attention, numeric }: { label: string; value: string; hint?: string; attention?: boolean; numeric?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${numeric ? "tabular-nums" : ""} ${attention ? "text-warning" : ""}`}>{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function MemberSheet({ member, adminCount, onClose, onChanged }: {
  member: CompanyMember | null;
  adminCount: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [trips, setTrips] = useState<MemberTrip[] | null>(null);
  const [expenses, setExpenses] = useState<MemberExpense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    if (!member) return;
    setTrips(null); setExpenses(null); setError(null);
    let active = true;
    getMember(member.id)
      .then((result) => { if (active) { setTrips(result.trips); setExpenses(result.expenses); } })
      .catch((err) => { if (active) setError(err instanceof CompanyError ? err.message : "Couldn't load their trips."); });
    return () => { active = false; };
  }, [member]);

  if (!member) return null;
  const lastAdmin = member.role === "admin" && adminCount <= 1;

  const changeRole = async () => {
    setBusy(true);
    try {
      const role = member.role === "admin" ? "member" : "admin";
      await setMemberRole(member.id, role);
      toast.success(role === "admin" ? `${member.name} is now an admin` : `${member.name} is now a member`);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof CompanyError ? err.message : "Couldn't change their role.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeMember(member.id);
      toast.success(`${member.name} was removed from the company`);
      setRemoveOpen(false);
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof CompanyError ? err.message : "Couldn't remove them.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{member.name}</SheetTitle>
            {member.role === "admin" && <Badge variant="secondary">Admin</Badge>}
          </div>
          <SheetDescription>{[member.jobTitle, member.email].filter(Boolean).join(" · ")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Plane className="w-4 h-4 text-muted-foreground" /> Trips</h3>
            {trips === null && !error ? <Skeleton className="h-16 w-full" /> : trips && trips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trips yet.</p>
            ) : (
              <ul className="space-y-2">
                {(trips ?? []).map((t) => (
                  <li key={t.id} className="rounded-lg border border-border/60 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{t.destination}</span>
                      <Badge variant="outline" className="capitalize font-normal">{t.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[dayRange(t.startDate, t.endDate), t.purpose].filter(Boolean).join(" · ")}
                    </p>
                    {t.flight?.airline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.flight.airline}{t.flight.flightNumber ? ` ${t.flight.flightNumber}` : ""}
                        {t.flight.bookingReference ? ` · confirmation ${t.flight.bookingReference}` : " · not booked"}
                        {t.flight.bookedVia ? ` (booked on ${t.flight.bookedVia})` : ""}
                        {t.flight.price ? ` · ${money(t.flight.price)}` : ""}
                      </p>
                    )}
                    {t.hotel?.name && <p className="text-xs text-muted-foreground">{t.hotel.name}{t.hotel.reserved ? " · reserved" : " · not reserved"}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-muted-foreground" /> Expenses</h3>
            {expenses === null && !error ? <Skeleton className="h-16 w-full" /> : expenses && expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border/60">
                {(expenses ?? []).map((x) => (
                  <li key={x.id} className="p-3 text-sm flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{x.merchant || x.description || "Expense"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[x.date ? dayRange(x.date) : "", x.category, x.tripName].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="tabular-nums font-medium">{money(x.amount)}</p>
                      <p className={`text-xs capitalize ${x.status === "pending" ? "text-warning" : "text-muted-foreground"}`}>{x.status || "pending"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!member.isSelf && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Access</h3>
              <p className="text-xs text-muted-foreground">
                Admins can see everyone's trips and expenses and manage the company. Members see only their own.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={changeRole} disabled={busy || lastAdmin}>
                  {member.role === "admin" ? "Make member" : "Make admin"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setRemoveOpen(true)} disabled={busy}>
                  <UserMinus className="w-4 h-4" /> Remove from company
                </Button>
              </div>
              {lastAdmin && <p className="text-xs text-muted-foreground">They're the only admin, so they can't be made a member.</p>}
            </section>
          )}
        </div>

        <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                They'll leave the company and you'll no longer see their trips or expenses. Their own account and data stay as
                they are. If they still have the join code they could rejoin — replace the code if that's a concern.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); void remove(); }} disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
