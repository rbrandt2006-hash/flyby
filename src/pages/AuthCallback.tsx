import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backend } from "@/integrations/backend/client";
import flybyLogo from "@/assets/flybyLogo";

/**
 * Where Google / Microsoft sign-in lands.
 *
 * The backend finished the provider's sign-in and sent the browser here with a
 * one-time code (or an error). The code is traded for a normal session, the
 * address bar is cleaned so the code doesn't sit in history, and the traveler
 * continues — to setup if the account is brand new.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // The code works once; React's development double-run must not spend it twice.
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("login_code");
    const failure = params.get("error");
    window.history.replaceState({}, "", window.location.pathname);

    if (failure || !code) {
      setError(failure || "The sign-in didn't complete. Please try again.");
      return;
    }

    (async () => {
      const { error: signInError, newAccount } = await backend.auth.signInWithOAuthCode(code);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      let next = "/";
      try {
        next = sessionStorage.getItem("flyby_oauth_next") || "/";
        sessionStorage.removeItem("flyby_oauth_next");
      } catch { /* ignore */ }
      if (newAccount) {
        try {
          localStorage.setItem("flyby_pending_onboarding", "true");
          if (next !== "/") localStorage.setItem("flyby_post_onboarding_next", next);
        } catch { /* ignore */ }
        navigate("/onboarding", { replace: true });
        return;
      }
      navigate(next.startsWith("/") && !next.startsWith("//") ? next : "/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-4">
        <img src={flybyLogo.url} alt="Flyby AI" className="h-10 mx-auto" />
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-medium">Couldn't sign you in</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button className="w-full" onClick={() => navigate("/get-started", { replace: true })}>
              Back to sign in
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground" role="status">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Signing you in…</p>
          </div>
        )}
      </div>
    </div>
  );
}
