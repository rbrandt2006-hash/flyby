import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plane, Hotel, Plus, Pencil, Trash2, Sparkles, TrendingUp } from "lucide-react";
import { useLoyaltyPrograms, LoyaltyProgram } from "@/hooks/useLoyaltyPrograms";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useTrips } from "@/hooks/useTrips";
import { getMockedStats, pointsToUsd } from "@/services/mockLoyaltyService";
import { cn } from "@/lib/utils";

const AIRLINE_PRESETS = [
  "United MileagePlus",
  "Delta SkyMiles",
  "American AAdvantage",
  "Alaska Mileage Plan",
  "Southwest Rapid Rewards",
  "JetBlue TrueBlue",
  "British Airways Executive Club",
  "Lufthansa Miles & More",
  "Air France/KLM Flying Blue",
  "Emirates Skywards",
];
const HOTEL_PRESETS = [
  "Marriott Bonvoy",
  "Hilton Honors",
  "World of Hyatt",
  "IHG One Rewards",
  "Accor ALL",
  "Wyndham Rewards",
  "Choice Privileges",
  "Best Western Rewards",
];

interface FormState {
  kind: "airline" | "hotel";
  program_name: string;
  member_id: string;
}

const emptyForm: FormState = { kind: "airline", program_name: "", member_id: "" };

export function LoyaltySection() {
  const { programs, isLoading, isSaving, add, update, remove } = useLoyaltyPrograms();
  const { demoMode } = useDemoMode();
  const { trips } = useTrips();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyProgram | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<LoyaltyProgram | null>(null);

  const presets = form.kind === "airline" ? AIRLINE_PRESETS : HOTEL_PRESETS;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (p: LoyaltyProgram) => {
    setEditing(p);
    setForm({ kind: p.kind, program_name: p.program_name, member_id: p.member_id ?? "" });
    setDialogOpen(true);
  };
  const handleSubmit = async () => {
    if (!form.program_name.trim()) return;
    if (editing) {
      await update(editing.id, {
        kind: form.kind,
        program_name: form.program_name.trim(),
        member_id: form.member_id.trim() || null,
      });
    } else {
      await add({
        kind: form.kind,
        program_name: form.program_name.trim(),
        member_id: form.member_id.trim() || null,
      });
    }
    setDialogOpen(false);
  };

  // Upgrade suggestion — pick next upcoming trip that has a flight and match it to an airline program
  const suggestion = useMemo(() => {
    if (!demoMode || programs.length === 0) return null;
    const now = Date.now();
    const upcoming = trips
      .filter(t => t.flight && new Date(t.startDate).getTime() >= now && t.status !== "cancelled")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    if (!upcoming || !upcoming.flight) return null;

    // Try airline match first
    const airlineName = upcoming.flight.airline?.toLowerCase() ?? "";
    const airlinePrograms = programs.filter(p => p.kind === "airline");
    const matched = airlinePrograms.find(p =>
      airlineName.includes(p.program_name.split(" ")[0].toLowerCase())
    ) ?? airlinePrograms[0];
    if (!matched) return null;

    const stats = getMockedStats(matched.kind, matched.program_name);
    const flightPrice = upcoming.flight.price ?? upcoming.estimatedCost ?? 0;
    // Upgrade ~ extra 15-30% of cash price worth of points, but cheaper if covered by miles
    const upgradePoints = Math.round(15_000 + (flightPrice * 50));
    if (stats.balance < upgradePoints) return null;

    return {
      trip: upcoming,
      program: matched,
      upgradePoints,
      cashValue: pointsToUsd(matched.kind, upgradePoints),
      remainingAfter: stats.balance - upgradePoints,
    };
  }, [demoMode, programs, trips]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Loyalty Programs</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track your airline and hotel memberships. Balances and tiers below are{" "}
            {demoMode ? "shown using demo data" : "hidden — turn on Demo Data in the top bar to preview"}.
          </p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add program
        </Button>
      </div>

      {/* Upgrade suggestion callout */}
      {suggestion && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">Cost-effective upgrade available</p>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Suggested</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your upcoming trip to <span className="text-foreground font-medium">{suggestion.trip.destination}</span>{" "}
                  could be upgraded using <span className="text-foreground font-medium">{suggestion.upgradePoints.toLocaleString()} {suggestion.program.kind === "airline" ? "miles" : "points"}</span>{" "}
                  from {suggestion.program.program_name} — roughly{" "}
                  <span className="text-foreground font-medium">${suggestion.cashValue.toLocaleString()}</span> in value.
                  You'd still have {suggestion.remainingAfter.toLocaleString()} left after redemption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Programs grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-40" />
            </Card>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Plane className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No loyalty programs yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Add your frequent flyer and hotel rewards memberships to track balances and unlock upgrade suggestions.
            </p>
            <Button onClick={openAdd} className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add your first program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map(p => {
            const stats = demoMode ? getMockedStats(p.kind, p.program_name) : null;
            const Icon = p.kind === "airline" ? Plane : Hotel;
            return (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        p.kind === "airline" ? "bg-sky-500/10" : "bg-amber-500/10"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          p.kind === "airline" ? "text-sky-600" : "text-amber-600"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{p.program_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.member_id ? `Member ID · ${p.member_id}` : "No member ID saved"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(p)} aria-label="Remove">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {stats ? (
                    <>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
                          <p className="text-2xl font-semibold tabular-nums">
                            {stats.balance.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground ml-1">{stats.unit}</span>
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" /> {stats.tier}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <Progress value={stats.progressPct} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {stats.nextTier
                            ? `${stats.toNextTier.toLocaleString()} ${p.kind === "airline" ? "miles" : "nights"} to ${stats.nextTier}`
                            : "Top tier reached"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      Balance and tier are hidden because Demo Data is off.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit program" : "Add loyalty program"}</DialogTitle>
            <DialogDescription>
              Save the programs you belong to. Balances are simulated for the demo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.kind}
                onValueChange={(v: "airline" | "hotel") => setForm(f => ({ ...f, kind: v, program_name: "" }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="airline">Airline</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={presets.includes(form.program_name) ? form.program_name : "__custom__"}
                onValueChange={(v) => setForm(f => ({ ...f, program_name: v === "__custom__" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Choose a program" /></SelectTrigger>
                <SelectContent>
                  {presets.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                  <SelectItem value="__custom__">Other (enter name)</SelectItem>
                </SelectContent>
              </Select>
              {!presets.includes(form.program_name) && (
                <Input
                  placeholder="Program name"
                  value={form.program_name}
                  onChange={e => setForm(f => ({ ...f, program_name: e.target.value }))}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Member ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                placeholder="e.g. XY1234567"
                value={form.member_id}
                onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.program_name.trim()}>
              {isSaving ? "Saving…" : editing ? "Save changes" : "Add program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this loyalty program?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.program_name} will no longer appear in your loyalty list. You can re-add it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete) await remove(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
