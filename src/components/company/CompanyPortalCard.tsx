import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Check, Clock, Copy, Loader2, LogOut, ShieldCheck, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { announceCompanyChange, useCompanyPortal } from "@/hooks/useCompanyPortal";
import { CompanyError, joinCompany, leaveCompany, requestPortal, withdrawRequest } from "@/services/companyPortal";

const TEAM_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];

/** "abcd2345" -> "ABCD-2345" as it's typed. */
function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

function niceDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * The traveler's company: which one they're in and their role, or how to get
 * into one — join with a code, or ask Flyby to set one up.
 */
export function CompanyPortalCard({ showDashboardLink = true }: { showDashboardLink?: boolean }) {
  const { state, loading, portal, role, request } = useCompanyPortal();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }
  // Signed out, or a backend without company portals: nothing to say.
  if (!state) return null;

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    setJoinError(null);
    setJoining(true);
    try {
      const result = await joinCompany(code);
      announceCompanyChange({ portal: result.portal, role: result.role, request: null });
      toast.success(`You joined ${result.portal.name}`, {
        description: "Its admins can now see your trips and expenses.",
      });
      setCode("");
    } catch (error) {
      setJoinError(error instanceof CompanyError ? error.message : "Couldn't join. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    try {
      await withdrawRequest();
      announceCompanyChange({ portal: null, role: null, request: null });
      toast.success("Request withdrawn");
    } catch (error) {
      toast.error(error instanceof CompanyError ? error.message : "Couldn't withdraw it.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await leaveCompany();
      announceCompanyChange({ portal: null, role: null, request: null });
      toast.success(`You left ${portal?.name}`);
      setLeaveOpen(false);
    } catch (error) {
      toast.error(error instanceof CompanyError ? error.message : "Couldn't leave. Please try again.");
      setLeaveOpen(false);
    } finally {
      setBusy(false);
    }
  };

  // ---- In a company
  if (portal) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                {portal.name}
                <Badge variant="outline" className="gap-1 font-normal text-success border-success/30">
                  <ShieldCheck className="w-3 h-3" /> Verified by Flyby
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {[portal.domain, `${portal.memberCount} ${portal.memberCount === 1 ? "member" : "members"}`].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <Badge variant={role === "admin" ? "default" : "secondary"}>{role === "admin" ? "Admin" : "Member"}</Badge>
        </div>

        {role === "admin" ? (
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
            <p className="text-sm">
              As an admin you can see your members' trips and expenses, and manage who's in the company.
            </p>
            {portal.joinCode && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Join code</span>
                <code className="font-mono text-sm tracking-widest px-2 py-0.5 rounded bg-background border border-border/60">{portal.joinCode}</code>
                <Button
                  type="button" size="sm" variant="ghost" className="h-7 gap-1.5"
                  onClick={() => {
                    void navigator.clipboard?.writeText(portal.joinCode || "");
                    toast.success("Join code copied");
                  }}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
            )}
            {showDashboardLink && (
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/company"><Users className="w-4 h-4" /> Open company dashboard</Link>
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your company's admins can see your trips and expenses.
          </p>
        )}

        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setLeaveOpen(true)}>
          <LogOut className="w-4 h-4" /> Leave company
        </Button>

        <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave {portal.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Its admins will no longer see your trips and expenses. To rejoin you'll need the join code again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Stay</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); void handleLeave(); }} disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Leave company
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ---- Waiting for Flyby to verify
  if (request?.status === "pending") {
    return (
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-warning" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{request.name} is waiting for verification</p>
          <p className="text-sm text-muted-foreground">
            Flyby checks that you work at {request.domain || "the company"} before the portal goes live. You'll get an
            email with the join code once it's verified, and you'll be its admin. Asked {niceDate(request.requestedAt)}.
          </p>
          <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={handleWithdraw} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Withdraw request
          </Button>
        </div>
      </div>
    );
  }

  // ---- Not in a company (possibly after a rejected request)
  return (
    <div className="space-y-5">
      {request?.status === "rejected" && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Flyby couldn't verify {request.name}</p>
            {request.reviewNote && <p className="text-muted-foreground">{request.reviewNote}</p>}
          </div>
        </div>
      )}

      <form onSubmit={handleJoin} className="space-y-2">
        <Label htmlFor="company-code">Join your company</Label>
        <p className="text-xs text-muted-foreground">Ask your company's Flyby admin for its join code.</p>
        <div className="flex gap-2">
          <Input
            id="company-code"
            value={code}
            onChange={(e) => { setCode(formatCode(e.target.value)); setJoinError(null); }}
            placeholder="ABCD-2345"
            autoComplete="off"
            spellCheck={false}
            className="font-mono tracking-widest max-w-[12rem]"
            aria-invalid={Boolean(joinError)}
            aria-describedby={joinError ? "company-code-error" : undefined}
          />
          <Button type="submit" disabled={joining || code.replace("-", "").length !== 8}>
            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
          </Button>
        </div>
        {joinError && <p id="company-code-error" className="text-sm text-destructive" role="alert">{joinError}</p>}
      </form>

      <div className="space-y-1">
        <p className="text-sm font-medium">Setting Flyby up for your company?</p>
        <p className="text-xs text-muted-foreground">
          Ask for a company portal. Once Flyby verifies it, you'll be its admin and can invite your team with a join code.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-1.5 gap-1.5" onClick={() => setRequestOpen(true)}>
          <Building2 className="w-4 h-4" /> Create a company portal
        </Button>
      </div>

      <RequestPortalDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}

function RequestPortalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ name: "", website: "", jobTitle: "", teamSize: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await requestPortal(form);
      announceCompanyChange({ portal: null, role: null, request: result.request });
      toast.success("Request sent", { description: "You'll get an email when Flyby has verified it." });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof CompanyError ? err.message : "Couldn't send the request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a company portal</DialogTitle>
          <DialogDescription>
            A portal's admins can see their members' trips and expenses, so Flyby checks that you work at the company
            before it goes live.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="portal-name">Company name</Label>
            <Input id="portal-name" value={form.name} onChange={set("name")} placeholder="Acme Corporation" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portal-website">Company website</Label>
            <Input id="portal-website" value={form.website} onChange={set("website")} placeholder="acme.com" required />
            <p className="text-xs text-muted-foreground">Used to verify the company. It's quickest when your Flyby email is at this domain.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="portal-title">Your job title</Label>
              <Input id="portal-title" value={form.jobTitle} onChange={set("jobTitle")} placeholder="Head of Operations" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portal-size">Team size</Label>
              <Select value={form.teamSize} onValueChange={(teamSize) => setForm((f) => ({ ...f, teamSize }))}>
                <SelectTrigger id="portal-size"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((size) => <SelectItem key={size} value={size}>{size} people</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portal-note">Anything Flyby should know (optional)</Label>
            <Textarea id="portal-note" value={form.note} onChange={set("note")} className="min-h-[72px]" maxLength={500} />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || form.name.trim().length < 2 || !form.website.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              Send for verification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
