import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authedFetch, backend } from "@/integrations/backend/client";

/**
 * Whether Flyby can actually send email, and a way to prove it.
 *
 * The switches above only mean something if there is a mail server behind
 * them, so this says plainly when there isn't. The test goes to the signed-in
 * account's own address and reports what the mail server answered.
 */
export function EmailNotificationsStatus({ address }: { address?: string | null }) {
  const [status, setStatus] = useState<{ configured: boolean; from: string | null } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!backend.getCurrentSession()) return;
      try {
        const response = await authedFetch("/api/email/status");
        if (!response.ok) return; // a backend without email support: say nothing
        const body = await response.json();
        if (!cancelled && typeof body?.configured === "boolean") {
          setStatus({ configured: body.configured, from: body.from ?? null });
        }
      } catch {
        /* unreachable — the row simply isn't shown */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!status) return null;

  const sendTest = async () => {
    setSending(true);
    try {
      const response = await authedFetch("/api/email/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const body = await response.json().catch(() => ({}));
      if (body?.sent) {
        toast.success(`Test email sent to ${body.to}`, { description: "It can take a minute to arrive. Check spam if it doesn't." });
      } else {
        toast.error("The test email wasn't sent", { description: body?.message || "The mail server couldn't be reached.", duration: 12000 });
      }
    } catch {
      toast.error("Couldn't reach Flyby to send the test email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <Mail className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        {status.configured ? (
          <>
            <p className="text-sm">Emails go to {address || "your account address"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sent from {status.from}.</p>
          </>
        ) : (
          <>
            <p className="text-sm">Email isn't set up on this server yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No emails are being sent, whatever the switches below say. Whoever runs Flyby needs to add a mail account to the server.
            </p>
          </>
        )}
      </div>
      {status.configured && (
        <Button size="sm" variant="outline" className="shrink-0" onClick={sendTest} disabled={sending}>
          {sending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Send test email
        </Button>
      )}
    </div>
  );
}
