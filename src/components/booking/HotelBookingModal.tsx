import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, Loader2, ShieldAlert, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HotelOption } from "@/components/chats/booking/types";
import { getDuffelStatus, getComponentKey, type DuffelStatus } from "@/services/duffelFlights";
import {
  bookHotel, createHotelQuote, fetchHotelRates,
  type HotelBookingResult, type HotelQuote, type HotelRate,
} from "@/services/duffelStays";
import { useUserProfileContext } from "@/contexts/UserProfileContext";
import { DuffelCardForm, useDuffelCardFormActions, createThreeDSecureSession } from "@duffel/components";
import { toast } from "sonner";

/**
 * Reserving a real hotel room.
 *
 * Flow: load the hotel's live rates → pick a room and confirm the guest → lock
 * the rate to get its final price and cancellation terms → pay by card → the
 * hotel confirms. Nothing is charged until the final "Pay & reserve", and the
 * price paid is the one the supplier quoted at that moment, not the one from
 * the search list.
 */

export interface HotelGuestDefaults {
  given_name?: string;
  family_name?: string;
  email?: string;
  phone_number?: string;
}

interface HotelBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: HotelOption | null;
  /** Prefill from the traveler who just booked the flight. */
  guestDefaults?: HotelGuestDefaults;
  onBooked?: (result: HotelBookingResult) => void;
}

type Step = "loading" | "rates" | "quoting" | "review" | "payment" | "booking" | "done" | "unavailable";

const money = (amount: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const BOARD: Record<string, string> = {
  room_only: "Room only",
  breakfast: "Breakfast included",
  half_board: "Half board",
  full_board: "Full board",
  all_inclusive: "All inclusive",
};

function refundLabel(rate: HotelRate): string {
  if (!rate.refundableUntil) return "Non-refundable";
  const until = new Date(rate.refundableUntil);
  if (Number.isNaN(until.getTime())) return "Free cancellation";
  return `Free cancellation until ${until.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function HotelBookingModal({ open, onOpenChange, hotel, guestDefaults, onBooked }: HotelBookingModalProps) {
  const { profile } = useUserProfileContext();
  const [step, setStep] = useState<Step>("loading");
  const [status, setStatus] = useState<DuffelStatus | null>(null);
  const [rates, setRates] = useState<HotelRate[]>([]);
  const [rateId, setRateId] = useState<string | null>(null);
  const [quote, setQuote] = useState<HotelQuote | null>(null);
  const [guest, setGuest] = useState({ given_name: "", family_name: "", email: "", phone_number: "" });
  const [result, setResult] = useState<HotelBookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [clientKey, setClientKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [cardValid, setCardValid] = useState(false);
  const [paying, setPaying] = useState(false);
  const cardForm = useDuffelCardFormActions();

  // Read through refs so a profile refresh or a re-rendered parent can't restart
  // the flow — and wipe what the traveler typed — while they're mid-payment.
  const defaultsRef = useRef({ profile, guestDefaults });
  defaultsRef.current = { profile, guestDefaults };

  const hotelId = hotel?.id ?? null;
  useEffect(() => {
    if (!open || !hotelId) return;
    let active = true;
    setStep("loading");
    setError(null);
    setResult(null);
    setQuote(null);
    setRates([]);
    setRateId(null);
    setClientKey(null);
    setPaying(false);

    const { profile: p, guestDefaults: d } = defaultsRef.current;
    const [profileGiven, ...profileRest] = (p?.full_name || "").split(" ");
    setGuest({
      given_name: d?.given_name || profileGiven || "",
      family_name: d?.family_name || profileRest.join(" ") || "",
      email: d?.email || p?.email || "",
      phone_number: d?.phone_number || "",
    });

    (async () => {
      const [statusRes, ratesRes] = await Promise.all([getDuffelStatus(), fetchHotelRates(hotelId)]);
      if (!active) return;
      setStatus(statusRes);
      if (ratesRes.rates.length === 0) {
        setError(
          ratesRes.error === "search_expired"
            ? "These hotel prices have expired. Search the trip again to get current ones."
            : ratesRes.error && ratesRes.error !== "unreachable"
              ? "This hotel has no rooms that can be booked here for these dates."
              : "Couldn't load this hotel's rooms right now. Nothing was reserved.",
        );
        setStep("unavailable");
        return;
      }
      setRates(ratesRes.rates);
      setRateId(ratesRes.rates[0].id);
      setStep("rates");
    })();

    return () => { active = false; };
  }, [open, hotelId]);

  const selectedRate = rates.find((r) => r.id === rateId) ?? null;
  const guestValid =
    guest.given_name.trim() && guest.family_name.trim() && guest.email.trim() && guest.phone_number.trim();

  // Lock the chosen rate. The quote, not the search list, is the real price.
  const goToReview = async () => {
    if (!selectedRate) return;
    setStep("quoting");
    const { quote: q, error: quoteError } = await createHotelQuote(selectedRate.id);
    if (!q) {
      setError(
        quoteError === "rate_unavailable"
          ? "That room rate was just taken. Choose another."
          : "Couldn't confirm the price for that room. Nothing was reserved.",
      );
      // Rates may be stale now — drop the one that failed and let them pick again.
      const remaining = rates.filter((r) => r.id !== selectedRate.id);
      if (remaining.length === 0) { setStep("unavailable"); return; }
      setRates(remaining);
      setRateId(remaining[0].id);
      setStep("rates");
      toast.error("That room rate is no longer available. Pick another.");
      return;
    }
    setError(null);
    setQuote(q);
    setStep("review");
  };

  const goToPayment = async () => {
    setStep("payment");
    setKeyError(null);
    setCardValid(false);
    const { clientKey: key, error: err } = await getComponentKey();
    if (!key) { setKeyError(err || "unavailable"); return; }
    setClientKey(key);
  };

  const handlePayAndBook = () => {
    setPaying(true);
    cardForm.createCardForTemporaryUse();
  };

  // Card tokenized → 3-D Secure against the quote → reserve with that session.
  const onCardCreated = async (card: { id: string }) => {
    if (!quote || !clientKey) return;
    try {
      const session = await createThreeDSecureSession(clientKey, card.id, quote.id, [], true);
      if (session.status !== "ready_for_payment") {
        setPaying(false);
        setResult({ ok: false, error: "Card authentication didn't complete. Please try again or use a different card." });
        setStep("done");
        return;
      }
      setStep("booking");
      const res = await bookHotel({
        quoteId: quote.id,
        guests: [{ given_name: guest.given_name.trim(), family_name: guest.family_name.trim() }],
        email: guest.email.trim(),
        phoneNumber: guest.phone_number.trim(),
        threeDSecureSessionId: session.id,
      });
      setResult(res);
      setStep("done");
      onBooked?.(res);
      if (res.ok) {
        toast.success("Hotel reserved", { description: res.booking?.reference ? `Confirmation ${res.booking.reference}` : undefined });
      } else {
        toast.error("Hotel not reserved", { description: res.error });
      }
    } catch {
      setPaying(false);
      setResult({ ok: false, error: "Payment couldn't be processed. Nothing was reserved." });
      setStep("done");
    }
  };

  const currency = quote?.currency || selectedRate?.currency || hotel?.currency || "USD";
  const total = quote?.totalPrice ?? selectedRate?.totalPrice ?? hotel?.totalPrice ?? 0;
  const dueAtHotel = quote?.dueAtAccommodation ?? selectedRate?.dueAtAccommodation ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Reserve hotel
          </DialogTitle>
          <DialogDescription>
            {hotel
              ? `${hotel.name}${hotel.checkInDate && hotel.checkOutDate ? ` · ${hotel.checkInDate} → ${hotel.checkOutDate}` : ""}`
              : "Review and confirm your stay."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {(step === "loading" || step === "quoting") && (
            <motion.div key={step} className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">{step === "loading" ? "Loading live room rates…" : "Confirming the final price…"}</p>
            </motion.div>
          )}

          {step === "unavailable" && (
            <motion.div key="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">This hotel can't be reserved right now</p>
              <p className="text-sm text-muted-foreground">{error || "Nothing was reserved or charged."}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </motion.div>
          )}

          {step === "rates" && (
            <motion.div key="rates" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="space-y-2">
                <Label>Room</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {rates.slice(0, 12).map((rate) => (
                    <button
                      key={rate.id}
                      type="button"
                      onClick={() => setRateId(rate.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${
                        rate.id === rateId ? "border-primary ring-2 ring-primary/20" : "border-border/60 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{rate.roomName}</p>
                          <p className="text-xs text-muted-foreground">
                            {BOARD[rate.boardType] || rate.boardType} · {refundLabel(rate)}
                            {rate.dueAtAccommodation > 0 && ` · plus ${money(rate.dueAtAccommodation, rate.currency)} in fees at the hotel`}
                          </p>
                        </div>
                        <p className="text-sm font-bold shrink-0">{money(rate.totalPrice, rate.currency)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border/60 p-4">
                <p className="text-sm font-semibold">Guest checking in</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First name</Label>
                    <Input value={guest.given_name} onChange={(e) => setGuest((g) => ({ ...g, given_name: e.target.value }))} placeholder="As on ID" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name</Label>
                    <Input value={guest.family_name} onChange={(e) => setGuest((g) => ({ ...g, family_name: e.target.value }))} placeholder="As on ID" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={guest.phone_number} onChange={(e) => setGuest((g) => ({ ...g, phone_number: e.target.value }))} placeholder="+14155550123" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))} placeholder="traveler@company.com" />
                  </div>
                </div>
              </div>

              <Button className="w-full gap-2" disabled={!selectedRate || !guestValid} onClick={goToReview}>
                Confirm price <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === "review" && quote && (
            <motion.div key="review" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-xl border border-border/60 divide-y divide-border/40">
                <Row label="Hotel" value={quote.hotelName || hotel?.name || ""} />
                {quote.address && <Row label="Address" value={quote.address} />}
                <Row label="Stay" value={`${quote.checkInDate} → ${quote.checkOutDate} (${quote.nights} night${quote.nights > 1 ? "s" : ""})`} />
                {selectedRate && <Row label="Room" value={`${selectedRate.roomName} · ${BOARD[selectedRate.boardType] || selectedRate.boardType}`} />}
                {selectedRate && <Row label="Cancellation" value={refundLabel(selectedRate)} />}
                <Row label="Guest" value={`${guest.given_name} ${guest.family_name}`.trim()} />
                {quote.taxAmount != null && quote.taxAmount > 0 && <Row label="Taxes (included)" value={money(quote.taxAmount, currency)} />}
                <Row label="Charged now" value={money(total, currency)} emphasize />
                {dueAtHotel > 0 && <Row label="Fees due at the hotel (extra)" value={money(dueAtHotel, currency)} />}
              </div>

              {/* The supplier's conditions for this rate. Duffel requires these
                  to be shown before booking — they are part of what's agreed. */}
              {selectedRate && selectedRate.conditions.length > 0 && (
                <div className="rounded-xl border border-border/60 p-3 space-y-2 max-h-40 overflow-y-auto">
                  {selectedRate.conditions.map((condition, index) => (
                    <div key={index}>
                      <p className="text-xs font-semibold">{condition.title}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{condition.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {status && !status.bookingEnabled ? (
                <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-sm">
                  <p className="font-medium text-warning">Booking isn't turned on yet</p>
                  <p className="text-muted-foreground mt-1">
                    This room is real and available. To take payment and reserve it, set{" "}
                    <code>DUFFEL_BOOKING_ENABLED=true</code> in the backend.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                  Next you'll enter your card. Reserving charges {money(total, currency)} now
                  {dueAtHotel > 0 ? `; the hotel collects a further ${money(dueAtHotel, currency)} in fees on arrival` : ""} and
                  creates a real reservation. {selectedRate ? refundLabel(selectedRate) : ""}.
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep("rates")}>Back</Button>
                <Button className="flex-1 gap-2" disabled={!status?.bookingEnabled} onClick={goToPayment}>
                  Continue to payment <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {keyError ? (
                <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-sm space-y-1">
                  <p className="font-medium text-warning">Card payment isn't available</p>
                  <p className="text-muted-foreground">
                    Duffel Payments needs to be active on the account before cards can be charged.
                  </p>
                </div>
              ) : !clientKey ? (
                <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm">Preparing secure card entry…</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-border/60 bg-white text-neutral-900 p-4 [color-scheme:light]">
                    <DuffelCardForm
                      ref={cardForm.ref}
                      clientKey={clientKey}
                      intent="to-create-card-for-temporary-use"
                      onValidateSuccess={() => setCardValid(true)}
                      onValidateFailure={() => setCardValid(false)}
                      onCreateCardForTemporaryUseSuccess={onCardCreated}
                      onCreateCardForTemporaryUseFailure={() => {
                        setPaying(false);
                        toast.error("Card details couldn't be verified. Please check and try again.");
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Card details are handled securely by Duffel — Flyby never sees or stores them.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" disabled={paying} onClick={() => setStep("review")}>Back</Button>
                    <Button className="flex-1 gap-2" disabled={!cardValid || paying} onClick={handlePayAndBook}>
                      {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Pay {money(total, currency)} &amp; reserve
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === "booking" && (
            <motion.div key="booking" className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Reserving your room with the hotel…</p>
            </motion.div>
          )}

          {step === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-3">
              {result.ok ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <p className="text-lg font-bold">Hotel reserved</p>
                  {result.booking?.reference && (
                    <p className="text-sm text-muted-foreground">
                      Confirmation <span className="font-mono font-semibold text-foreground">{result.booking.reference}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {result.booking?.hotelName} · {money(result.booking?.totalPrice ?? total, result.booking?.currency || currency)}
                  </p>
                  {result.booking?.keyCollection && (
                    <p className="text-xs text-muted-foreground">{result.booking.keyCollection}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-7 h-7 text-destructive" />
                  </div>
                  <p className="text-lg font-bold">Not reserved</p>
                  <p className="text-sm text-muted-foreground">{result.error}</p>
                </>
              )}
              <Button variant={result.ok ? "default" : "outline"} onClick={() => onOpenChange(false)}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${emphasize ? "text-sm font-bold" : "text-sm font-medium"}`}>{value}</span>
    </div>
  );
}
