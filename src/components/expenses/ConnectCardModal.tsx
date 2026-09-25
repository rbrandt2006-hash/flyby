import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Lock, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createLinkToken, completeLink, getPlaidStatus, getStoredLink, clearStoredLink,
} from "@/services/plaidCards";

/**
 * Connect a corporate or personal card, so trip spend is captured on its own.
 *
 * This opens **Plaid Link**: the traveler authenticates with their bank inside
 * Plaid's own widget. Flyby never sees a card number, a bank password, or any
 * credential — only an opaque access token that can read transactions.
 *
 * It previously collected a raw card number, expiry and CVV in our own form.
 * That is not how Plaid works, and handling raw card data would put the app in
 * PCI scope for no benefit, so that form is gone.
 */

interface ConnectCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired once a card is linked, so the caller can pull expenses in. */
  onSuccess: () => void;
}

export default function ConnectCardModal({ open, onOpenChange, onSuccess }: ConnectCardModalProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [connected, setConnected] = useState<boolean>(Boolean(getStoredLink()?.accessToken));

  // Ask the backend whether card linking is switched on, then fetch the
  // short-lived token that opens Plaid Link.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setConnected(Boolean(getStoredLink()?.accessToken));
    (async () => {
      const { configured } = await getPlaidStatus();
      if (!active) return;
      setAvailable(configured);
      if (!configured) return;
      setPreparing(true);
      const { linkToken: token } = await createLinkToken();
      if (!active) return;
      setLinkToken(token);
      setPreparing(false);
    })();
    return () => { active = false; };
  }, [open]);

  const onPlaidSuccess = useCallback(
    async (publicToken: string) => {
      const ok = await completeLink(publicToken);
      if (!ok) {
        toast.error("Couldn't finish connecting that account. Please try again.");
        return;
      }
      setConnected(true);
      toast.success("Card connected", {
        description: "Trip charges will be captured automatically from now on.",
      });
      onSuccess();
      onOpenChange(false);
    },
    [onSuccess, onOpenChange],
  );

  const { open: openPlaid, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => { onPlaidSuccess(publicToken); },
    onExit: (error) => {
      // Exiting without finishing is normal — only surface real failures.
      if (error) toast.error("Bank connection was interrupted.");
    },
  });

  const handleDisconnect = () => {
    clearStoredLink();
    setConnected(false);
    toast.success("Card disconnected", {
      description: "Existing expenses are kept; no new charges will be imported.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {connected ? "Card connected" : "Connect a card"}
          </DialogTitle>
          <DialogDescription>
            {connected
              ? "Trip charges are captured automatically and matched to the trip they happened on."
              : "Link a corporate or personal card so trip spend is tracked as it happens — and an expense report is ready the moment you get back."}
          </DialogDescription>
        </DialogHeader>

        {connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
              <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-success" />
              </div>
              <p className="text-sm">
                Connected. New charges are imported and matched to your trips automatically.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : available === false ? (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm space-y-1">
            <p className="font-medium text-warning">Card linking isn't available yet</p>
            <p className="text-muted-foreground">
              We're finishing setup with our banking provider. Expenses can still be
              added by hand in the meantime.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  You sign in with your bank inside Plaid — <span className="text-foreground">Flyby
                  never sees your card number or banking password.</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Read-only access. Flyby can see transactions, and can't move money.
                </p>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              disabled={!ready || !linkToken || preparing}
              onClick={() => openPlaid()}
            >
              {preparing || !linkToken ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing secure connection…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Continue to your bank
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
