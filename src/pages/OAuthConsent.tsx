import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import flybyLogo from "@/assets/flyby-ai-logo.png.asset.json";

// Beta helpers on the supabase-js auth client. Typed locally so TS is happy.
type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string; redirect_uris?: string[] };
type OAuthDetails = {
  client?: OAuthClient;
  scopes?: string[];
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";

  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the URL.");
        setLoading(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        navigate(`/get-started?next=${encodeURIComponent(next)}`, { replace: true });
        return;
      }
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load authorization request.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full text-center space-y-3">
          <h1 className="text-xl font-semibold">Can't complete this connection</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to Flyby AI</Button>
        </div>
      </main>
    );
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "an app";
  const scopeList = details?.scopes ?? (details?.scope ? details.scope.split(/\s+/).filter(Boolean) : []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md space-y-6 border border-border rounded-2xl p-8 bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <img src={flybyLogo.url} alt="Flyby AI" className="h-10 w-auto" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Connect {clientName} to Flyby AI
          </h1>
          <p className="text-sm text-muted-foreground">
            {clientName} will be able to call Flyby AI's enabled tools while you are signed in.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            This will let {clientName}:
          </p>
          <div className="flex items-start gap-2.5 text-sm">
            <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>Read your trips, expenses, and travel preferences on your behalf.</span>
          </div>
          {scopeList.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Requested scopes: {scopeList.join(", ")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            This doesn't bypass Flyby AI permissions or backend policies.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={() => decide(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => decide(true)} className="min-w-[120px]">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
          </Button>
        </div>
      </div>
    </main>
  );
}
