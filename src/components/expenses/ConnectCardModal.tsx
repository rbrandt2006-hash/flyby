import { useCallback, useEffect, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Lock, Check, ShieldCheck, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createLinkToken, completeLink, getCardStatus, disconnectCard, describeCardError,
  type LinkedCard,
} from "@/services/plaidCards";

/**
 * Connect a corporate or personal card, so trip spend is captured on its own.
 *
 * This opens **Plaid Link**: the traveler signs in to their bank inside Plaid's
 * own widget. Flyby never sees a card number, a bank password, or any
 * credential. The bank access token Plaid issues is kept by the Flyby server
 * and never reaches the browser.
 */

interface ConnectCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired once a card is linked, so the caller can pull expenses in. */
  onSuccess: () => void;
  /** The linked cards changed (one was linked or disconnected). */
  onCardsChange?: (cards: LinkedCard[]) => void;
}

export function cardLastUpdated(card: LinkedCard) {
  if (!card.lastSyncedAt) return "Waiting for your first charges";
  // The server stores UTC without a zone marker.
  const at = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(card.lastSyncedAt) ? card.lastSyncedAt : `${card.lastSyncedAt}Z`);
  return Number.isNaN(at.getTime()) ? "Updated" : `Updated ${formatDistanceToNow(at, { addSuffix: true })}`;
}

export default function ConnectCardModal({ open, onOpenChange, onSuccess, onCardsChange }: ConnectCardModalProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [cards, setCards] = useState<LinkedCard[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  // When the current link token was issued. Plaid's tokens last four hours;
  // one is kept across openings of this dialog rather than fetched each time —
  // swapping the token rebuilds Plaid Link, which would close it mid-sign-in.
  const tokenIssuedAt = useRef(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const updateCards = useCallback((next: LinkedCard[]) => {
    setCards(next);
    onCardsChange?.(next);
  }, [onCardsChange]);

  // Ask the backend whether card linking is switched on and which cards are
  // linked, then fetch the short-lived token that opens Plaid Link.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setConfirmingId(null);
    setUnreachable(false);
    (async () => {
      const status = await getCardStatus();
      if (!active) return;
      if (!status) {
        setUnreachable(true);
        setAvailable(null);
        return;
      }
      setAvailable(status.configured);
      updateCards(status.cards);
      if (!status.configured) return;
      if (linkToken && Date.now() - tokenIssuedAt.current < 3 * 60 * 60 * 1000) return;
      setLinkToken(null);
      setPreparing(true);
      const { linkToken: token } = await createLinkToken();
      if (!active) return;
      tokenIssuedAt.current = token ? Date.now() : 0;
      setLinkToken(token);
      setPreparing(false);
    })();
    return () => { active = false; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPlaidSuccess = useCallback(
    async (publicToken: string, institutionName: string | null) => {
      setFinishing(true);
      const progress = toast.loading(`Connecting ${institutionName || "your card"}…`);
      const result = await completeLink(publicToken, institutionName);
      setFinishing(false);
      // A token that has completed a sign-in isn't reused.
      setLinkToken(null);
      tokenIssuedAt.current = 0;
      if (!result.ok) {
        toast.error(result.error || "Couldn't finish connecting that account. Please try again.", { id: progress });
        return;
      }
      const status = await getCardStatus();
      if (status) updateCards(status.cards);
      toast.success(`${result.card?.institution || "Card"} connected`, {
        id: progress,
        description: "Travel charges are imported and matched to your trips automatically.",
      });
      onSuccess();
    },
    [onSuccess, updateCards],
  );

  const { open: openPlaid, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => { onPlaidSuccess(publicToken, metadata?.institution?.name ?? null); },
    onExit: (error) => {
      // Exiting without finishing is normal — only surface real failures.
      if (error) toast.error("The bank connection was interrupted. Please try again.");
    },
  });

  const handleDisconnect = async (card: LinkedCard) => {
    setDisconnectingId(card.id);
    const result = await disconnectCard(card.id);
    setDisconnectingId(null);
    setConfirmingId(null);
    if (!result.ok) {
      toast.error("Couldn't disconnect that card. Please try again.");
      return;
    }
    updateCards(result.cards ?? cards.filter((c) => c.id !== card.id));
    toast.success(`${card.institution} disconnected`, {
      description: "Flyby's access was revoked. Expenses already filed are kept.",
    });
  };

  const connectButton = (label: string, variant: "default" | "outline" = "default") => (
    <Button
      variant={variant}
      className="w-full gap-2"
      disabled={!ready || !linkToken || preparing || finishing}
      onClick={() => {
        // Plaid Link opens its own window over the page. This dialog closes
        // first so its focus trap can't fight Plaid's for the keyboard and
        // mouse; the result arrives here either way.
        onOpenChange(false);
        openPlaid();
      }}
    >
      {finishing ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Finishing connection…</>
      ) : preparing || !linkToken ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Preparing secure connection…</>
      ) : (
        <>{variant === "outline" ? <Plus className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />} {label}</>
      )}
    </Button>
  );

  const connected = cards.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {connected ? (cards.length > 1 ? "Connected cards" : "Card connected") : "Connect a card"}
          </DialogTitle>
          <DialogDescription>
            {connected
              ? "Travel charges — flights, hotels, rides, parking, fuel and meals — made during a trip are filed as expenses on that trip."
              : "Link a corporate or personal card so trip spend is tracked as it happens — and an expense report is ready the moment you get back."}
          </DialogDescription>
        </DialogHeader>

        {unreachable ? (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm space-y-1">
            <p className="font-medium text-warning">Couldn't reach Flyby</p>
            <p className="text-muted-foreground">Check your connection and open this again.</p>
          </div>
        ) : available === null ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking your cards…
          </div>
        ) : connected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {cards.map((card) => {
                const problem = describeCardError(card.lastError);
                return (
                  <div key={card.id} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${problem ? "bg-warning/15" : "bg-success/15"}`}>
                        {problem ? <AlertTriangle className="w-4 h-4 text-warning" /> : <Check className="w-4 h-4 text-success" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{card.institution}</p>
                        <p className="text-sm text-muted-foreground">{problem || cardLastUpdated(card)}</p>
                      </div>
                    </div>
                    {confirmingId === card.id ? (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmingId(null)} disabled={disconnectingId === card.id}>
                          Keep it
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-2"
                          onClick={() => handleDisconnect(card)}
                          disabled={disconnectingId === card.id}
                        >
                          {disconnectingId === card.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setConfirmingId(card.id)}
                      >
                        Disconnect {card.institution}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {available && connectButton("Connect another card", "outline")}
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
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
                  Only travel spend made during your trips becomes an expense.
                </p>
              </div>
            </div>
            {connectButton("Continue to your bank")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
