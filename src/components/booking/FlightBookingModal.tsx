import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Check, Loader2, ShieldAlert, ArrowRight, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Flight } from "@/components/flights/FlightResults";
import {
  bookRealFlight, getDuffelStatus, authedOffer, getComponentKey,
  type Passenger, type BookingResult, type DuffelStatus, type DuffelOffer,
} from "@/services/duffelFlights";
import { useUserProfileContext } from "@/contexts/UserProfileContext";
import { DuffelCardForm, useDuffelCardFormActions, createThreeDSecureSession } from "@duffel/components";
import { toast } from "sonner";

/**
 * The customer booking interface for a real Duffel flight.
 *
 * Flow: confirm the live fare → enter passenger details → review → book. The
 * order is created on Flyby's Duffel balance (the app never touches card data
 * here). Every state is explicit — including when booking is turned off, when a
 * fare has expired, and when the airline declines — so the traveler always
 * knows exactly what happened. No charge occurs until the final "Confirm &
 * book", and only when booking is enabled on the backend.
 */

interface FlightBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: Flight | null;
  onBooked?: (result: BookingResult) => void;
}

type Step = "loading" | "passengers" | "review" | "payment" | "booking" | "done" | "unavailable";

function blankPassenger(): Passenger {
  return {
    title: "mr",
    given_name: "",
    family_name: "",
    born_on: "",
    gender: "m",
    email: "",
    phone_number: "",
  };
}

const isRealOffer = (flight: Flight | null) => Boolean(flight?.id?.startsWith("off_"));

export function FlightBookingModal({ open, onOpenChange, flight, onBooked }: FlightBookingModalProps) {
  const { profile } = useUserProfileContext();
  const [step, setStep] = useState<Step>("loading");
  const [status, setStatus] = useState<DuffelStatus | null>(null);
  const [offer, setOffer] = useState<DuffelOffer | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([blankPassenger()]);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Duffel Payments card flow: the component client key, the card form actions,
  // and whether the entered card is currently valid.
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [cardValid, setCardValid] = useState(false);
  const [paying, setPaying] = useState(false);
  const cardForm = useDuffelCardFormActions();

  // On open: confirm the live fare and how many travelers it's for, and check
  // whether booking is switched on. This is read-only — nothing is charged.
  useEffect(() => {
    if (!open || !flight) return;
    let active = true;
    setStep("loading");
    setError(null);
    setResult(null);

    (async () => {
      const [statusRes, offerRes] = await Promise.all([
        getDuffelStatus(),
        isRealOffer(flight) ? authedOffer(flight.id) : Promise.resolve(null),
      ]);
      if (!active) return;

      setStatus(statusRes);

      if (!isRealOffer(flight) || !statusRes?.configured) {
        setStep("unavailable");
        return;
      }
      if (!offerRes) {
        setError("This fare is no longer available — please search again.");
        setStep("unavailable");
        return;
      }

      setOffer(offerRes);
      // One passenger form per traveler the fare covers, prefilled for the first.
      const count = Math.max(1, offerRes.passengerIds?.length || 1);
      const forms = Array.from({ length: count }, () => blankPassenger());
      if (profile?.full_name) {
        const [given, ...rest] = profile.full_name.split(" ");
        forms[0].given_name = given || "";
        forms[0].family_name = rest.join(" ") || "";
      }
      if (profile?.email) forms[0].email = profile.email;
      setPassengers(forms);
      setStep("passengers");
    })();

    return () => { active = false; };
  }, [open, flight, profile]);

  const updatePassenger = (i: number, patch: Partial<Passenger>) => {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const passengersValid = passengers.every(
    (p) => p.given_name.trim() && p.family_name.trim() && p.born_on && p.email.trim() && p.phone_number.trim(),
  );

  // Review → payment: fetch the card-form client key.
  const goToPayment = async () => {
    setStep("payment");
    setKeyError(null);
    setCardValid(false);
    const { clientKey: key, error: err } = await getComponentKey();
    if (!key) {
      setKeyError(err || "unavailable");
      return;
    }
    setClientKey(key);
  };

  // "Pay & book": tell the card form to tokenize the card. Success runs the 3DS
  // + order chain in `onCardCreated`.
  const handlePayAndBook = () => {
    setPaying(true);
    cardForm.createCardForTemporaryUse();
  };

  // Card tokenized → run 3-D Secure, then create the order with that session.
  const onCardCreated = async (card: { id: string }) => {
    if (!flight || !clientKey || !offer) return;
    try {
      const session = await createThreeDSecureSession(clientKey, card.id, flight.id, [], true);
      if (session.status !== "ready_for_payment") {
        setPaying(false);
        setResult({ ok: false, error: "Card authentication didn't complete. Please try again or use a different card." });
        setStep("done");
        return;
      }
      setStep("booking");
      const res = await bookRealFlight(flight.id, passengers, session.id);
      setResult(res);
      setStep("done");
      onBooked?.(res);
      res.ok
        ? toast.success("Flight booked", { description: `Confirmation ${res.order?.bookingReference}` })
        : toast.error("Booking not completed", { description: res.error });
    } catch {
      setPaying(false);
      setResult({ ok: false, error: "Payment couldn't be processed. Please try again." });
      setStep("done");
    }
  };

  const fare = offer?.price ?? flight?.price ?? 0;
  const currency = offer?.currency ?? "USD";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Book flight
          </DialogTitle>
          <DialogDescription>
            {flight ? `${flight.airline} ${flight.flightNumber} · ${flight.origin} → ${flight.destination}` : "Review and confirm your flight."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "loading" && (
            <motion.div key="loading" className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Confirming the latest fare…</p>
            </motion.div>
          )}

          {step === "unavailable" && (
            <motion.div key="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Booking isn't available for this flight</p>
              <p className="text-sm text-muted-foreground">
                {error || "This is a sample fare. Real booking works on live flights from search."}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </motion.div>
          )}

          {step === "passengers" && (
            <motion.div key="passengers" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              {passengers.map((p, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <User className="w-4 h-4 text-primary" />
                    Traveler {i + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <select
                        value={p.title}
                        onChange={(e) => updatePassenger(i, { title: e.target.value as Passenger["title"] })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="mr">Mr</option><option value="ms">Ms</option>
                        <option value="mrs">Mrs</option><option value="miss">Miss</option><option value="dr">Dr</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender</Label>
                      <select
                        value={p.gender}
                        onChange={(e) => updatePassenger(i, { gender: e.target.value as Passenger["gender"] })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="m">Male</option><option value="f">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>First name</Label>
                      <Input value={p.given_name} onChange={(e) => updatePassenger(i, { given_name: e.target.value })} placeholder="As on ID" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last name</Label>
                      <Input value={p.family_name} onChange={(e) => updatePassenger(i, { family_name: e.target.value })} placeholder="As on ID" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date of birth</Label>
                      <Input type="date" value={p.born_on} onChange={(e) => updatePassenger(i, { born_on: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={p.phone_number} onChange={(e) => updatePassenger(i, { phone_number: e.target.value })} placeholder="+14155550123" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Email</Label>
                      <Input type="email" value={p.email} onChange={(e) => updatePassenger(i, { email: e.target.value })} placeholder="traveler@company.com" />
                    </div>
                  </div>
                </div>
              ))}
              <Button className="w-full gap-2" disabled={!passengersValid} onClick={() => setStep("review")}>
                Review booking <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="rounded-xl border border-border/60 divide-y divide-border/40">
                <Row label="Flight" value={`${flight?.airline} ${flight?.flightNumber}`} />
                <Row label="Route" value={`${flight?.origin} → ${flight?.destination}`} />
                <Row label="Depart" value={flight?.departureTime || ""} />
                <Row label="Travelers" value={`${passengers.length}`} />
                <Row label="Total fare" value={`$${fare.toLocaleString()} ${currency}`} emphasize />
              </div>

              {status && !status.bookingEnabled ? (
                <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-sm">
                  <p className="font-medium text-warning">Booking isn't turned on yet</p>
                  <p className="text-muted-foreground mt-1">
                    This flight is real and ready to book. To take payments and issue tickets, set{" "}
                    <code>DUFFEL_BOOKING_ENABLED=true</code> in the backend. Until then, this reviews the
                    booking without charging.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                  Next you'll enter your card. Booking charges ${fare.toLocaleString()} {currency} and
                  issues a real ticket — this can't be undone without a cancellation.
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep("passengers")}>Back</Button>
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
                  <div className="rounded-xl border border-border/60 p-1">
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
                      Pay ${fare.toLocaleString()} &amp; book
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === "booking" && (
            <motion.div key="booking" className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Booking your flight with the airline…</p>
            </motion.div>
          )}

          {step === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-3">
              {result.ok ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <p className="text-lg font-bold">Flight booked</p>
                  <p className="text-sm text-muted-foreground">
                    Confirmation <span className="font-mono font-semibold text-foreground">{result.order?.bookingReference}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${Number(result.order?.totalAmount || fare).toLocaleString()} {result.order?.totalCurrency || currency} · {passengers.length} traveler(s)
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-7 h-7 text-destructive" />
                  </div>
                  <p className="text-lg font-bold">Not booked</p>
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
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={emphasize ? "text-sm font-bold" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}
