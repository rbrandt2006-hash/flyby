import { useCallback, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authedFetch, backend } from "@/integrations/backend/client";
import { toast } from "sonner";

/**
 * How this account can sign in: password, Google, Microsoft.
 *
 * Connecting a provider goes through the backend, which asks Google or
 * Microsoft and links the account they confirm. An account that was created by
 * Google or Microsoft sign-in has no password until one is set here.
 */

type Provider = "google" | "microsoft";

interface Identity {
  id: string;
  provider: Provider;
  providerName: string;
  email: string | null;
}

const NAMES: Record<Provider, string> = { google: "Google", microsoft: "Microsoft" };

export function SignInMethods({ onChangePassword }: { onChangePassword: () => void }) {
  const [loading, setLoading] = useState(true);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [available, setAvailable] = useState<Provider[]>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const [connecting, setConnecting] = useState<Provider | null>(null);
  const [settingPassword, setSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!backend.getCurrentSession()) { setLoading(false); return; }
    try {
      const response = await authedFetch("/auth/v1/identities");
      if (response.ok) {
        const body = await response.json();
        setIdentities(body.identities || []);
        setAvailable(body.available || []);
        setHasPassword(body.hasPassword !== false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const connect = async (provider: Provider) => {
    setConnecting(provider);
    try {
      const response = await authedFetch("/auth/v1/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.url) {
        toast.error(body?.error || `Couldn't start connecting ${NAMES[provider]}.`);
        setConnecting(null);
        return;
      }
      window.location.href = body.url;
    } catch {
      toast.error(`Couldn't reach Flyby to connect ${NAMES[provider]}.`);
      setConnecting(null);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) { toast.error("Use at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("The two passwords don't match."); return; }
    setSaving(true);
    try {
      const response = await authedFetch("/auth/v1/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.message || body?.error_description || "Couldn't set your password.");
        return;
      }
      toast.success("Password set — you can now also sign in with your email.");
      setSettingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading sign-in methods…</div>;
  }

  const linked = new Set(identities.map((i) => i.provider));
  const connectable = available.filter((p) => !linked.has(p));

  return (
    <div className="space-y-4">
      {/* Password */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Password</p>
          <p className="text-sm text-muted-foreground">
            {hasPassword
              ? "Used to sign in with your email."
              : "Not set — you sign in with Google or Microsoft. Add one to also sign in with your email."}
          </p>
        </div>
        {hasPassword ? (
          <Button variant="outline" className="rounded-xl" onClick={onChangePassword}>Change</Button>
        ) : !settingPassword ? (
          <Button variant="outline" className="rounded-xl" onClick={() => setSettingPassword(true)}>Set password</Button>
        ) : null}
      </div>
      {!hasPassword && settingPassword && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input id="new-pw" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirm password</Label>
            <Input id="confirm-pw" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setSettingPassword(false)} disabled={saving}>Cancel</Button>
            <Button onClick={savePassword} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save password
            </Button>
          </div>
        </div>
      )}

      {/* Connected providers */}
      {identities.map((identity) => (
        <div key={identity.id} className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">{identity.providerName}</p>
            <p className="text-sm text-muted-foreground">{identity.email || "Connected"}</p>
          </div>
          <span className="flex items-center gap-1 text-sm text-success"><Check className="w-4 h-4" /> Connected</span>
        </div>
      ))}

      {connectable.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {connectable.map((provider) => (
            <Button
              key={provider}
              variant="outline"
              className="rounded-xl"
              disabled={connecting !== null}
              onClick={() => connect(provider)}
            >
              {connecting === provider && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Connect {NAMES[provider]} sign-in
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
