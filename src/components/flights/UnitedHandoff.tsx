import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Plane, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UNITED, readConfirmation, unitedSearchUrl,
  type ExternalBooking, type HandoffSearch,
} from "@/services/airlineHandoff";

interface UnitedHandoffProps {
  search: HandoffSearch;
  /** Save a flight booked on united.com to a trip. Throws if it couldn't be saved. */
  onAddBooking: (search: HandoffSearch, booking: ExternalBooking) => void | Promise<void>;
}

/**
 * United isn't sold through Flyby's flight provider, so it never appears in the
 * results above. This sends the traveler to united.com with the same search,
 * and lets them bring the booking back once it's made.
 */
export function UnitedHandoff({ search, onAddBooking }: UnitedHandoffProps) {
  const [adding, setAdding] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1 basis-64">
          <p className="font-medium flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            Looking for United?
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            United flights can't be booked in Flyby yet, so they aren't in the list above. Book on {UNITED.site} with
            your own card, then add the booking here to keep it with your trip and expenses.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" asChild>
            <a href={unitedSearchUrl(search)} target="_blank" rel="noopener noreferrer">
              Search {search.origin}→{search.destination} on {UNITED.site}
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            I booked on United
          </Button>
        </div>
      </div>

      <AddUnitedBookingDialog
        open={adding}
        onOpenChange={setAdding}
        search={search}
        onAddBooking={onAddBooking}
      />
    </Card>
  );
}

const TIME_PATTERN = /^\d{1,2}:\d{2}\s?(AM|PM)$/i;
const blankForm = (search: HandoffSearch) => ({
  confirmationCode: "",
  flightNumber: "",
  departureDate: search.departureDate,
  departTime: "",
  arrivalTime: "",
  returnFlightNumber: "",
  returnDate: search.returnDate ?? "",
  returnDepartTime: "",
  returnArrivalTime: "",
  totalPaid: "",
});

function AddUnitedBookingDialog({
  open, onOpenChange, search, onAddBooking,
}: UnitedHandoffProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState(() => blankForm(search));
  const [emailText, setEmailText] = useState("");
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState<string | null>(null);
  const [read, setRead] = useState<Partial<ExternalBooking>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(blankForm(search));
    setEmailText(""); setReadNote(null); setRead({}); setError(null);
    // Reset only when the dialog opens, not while it is being filled in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRead = async () => {
    setReading(true); setReadNote(null);
    const found = await readConfirmation(emailText);
    setReading(false);
    if (found === null) {
      setReadNote("Couldn't reach Flyby to read that. You can type the details below instead.");
      return;
    }
    const count = Object.keys(found).filter((k) => k !== "currency" && k !== "airline").length;
    if (count === 0) {
      setReadNote("Couldn't find booking details in that text. Type them below instead.");
      return;
    }
    setRead(found);
    setForm((f) => ({
      confirmationCode: found.confirmationCode ?? f.confirmationCode,
      flightNumber: found.flightNumber ?? f.flightNumber,
      departureDate: found.departureDate ?? f.departureDate,
      departTime: found.departTime ?? f.departTime,
      arrivalTime: found.arrivalTime ?? f.arrivalTime,
      returnFlightNumber: found.returnFlightNumber ?? f.returnFlightNumber,
      returnDate: found.returnDate ?? f.returnDate,
      returnDepartTime: found.returnDepartTime ?? f.returnDepartTime,
      returnArrivalTime: found.returnArrivalTime ?? f.returnArrivalTime,
      totalPaid: found.totalPaid != null ? String(found.totalPaid) : f.totalPaid,
    }));
    setReadNote("Filled in what the email says. Check each field before saving.");
  };

  const handleSave = async () => {
    const code = form.confirmationCode.trim().toUpperCase();
    const total = Number(form.totalPaid.replace(/[$,\s]/g, ""));
    const times = [form.departTime, form.arrivalTime, form.returnDepartTime, form.returnArrivalTime]
      .map((t) => t.trim()).filter(Boolean);
    if (!/^[A-Z0-9]{5,8}$/.test(code)) {
      setError("Enter United's confirmation code — 6 letters and numbers, like K7XQ2M."); return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.departureDate)) {
      setError("Enter the departure date."); return;
    }
    if (form.returnDate && form.returnDate < form.departureDate) {
      setError("The return date is before the departure date."); return;
    }
    if (times.some((t) => !TIME_PATTERN.test(t))) {
      setError("Write times like 7:40 AM."); return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError("Enter the total you paid United, so the expense is filed correctly."); return;
    }
    setError(null); setSaving(true);
    try {
      await onAddBooking(search, {
        confirmationCode: code,
        airline: UNITED.name,
        flightNumber: form.flightNumber.trim().toUpperCase() || undefined,
        departureAirport: read.departureAirport ?? search.origin,
        arrivalAirport: read.arrivalAirport ?? search.destination,
        departureDate: form.departureDate,
        departTime: form.departTime.trim().toUpperCase() || undefined,
        arrivalTime: form.arrivalTime.trim().toUpperCase() || undefined,
        stops: read.stops,
        returnFlightNumber: form.returnFlightNumber.trim().toUpperCase() || undefined,
        returnDate: form.returnDate || undefined,
        returnDepartTime: form.returnDepartTime.trim().toUpperCase() || undefined,
        returnArrivalTime: form.returnArrivalTime.trim().toUpperCase() || undefined,
        totalPaid: Math.round(total * 100) / 100,
        currency: read.currency ?? "USD",
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The trip couldn't be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Add your United booking
          </DialogTitle>
          <DialogDescription>
            For a flight you've already booked and paid for on {UNITED.site}. Flyby saves it to your trip and files the
            expense — it doesn't book or charge anything.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="united-email">Paste United's confirmation email (optional)</Label>
            <Textarea
              id="united-email"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste the email text and Flyby fills in the details below."
              className="min-h-[84px] text-sm"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button type="button" size="sm" variant="outline" onClick={handleRead} disabled={reading || emailText.trim().length < 20}>
                {reading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                {reading ? "Reading…" : "Read details"}
              </Button>
              <p className="text-xs text-muted-foreground">Used only to fill this form. The email isn't stored.</p>
            </div>
            {readNote && <p className="text-xs text-muted-foreground" role="status">{readNote}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="united-code" label="Confirmation code" value={form.confirmationCode} onChange={set("confirmationCode")} placeholder="K7XQ2M" />
            <Field id="united-total" label="Total paid (USD)" value={form.totalPaid} onChange={set("totalPaid")} placeholder="412.38" inputMode="decimal" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Outbound · {search.origin}→{search.destination}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field id="united-date" label="Date" type="date" value={form.departureDate} onChange={set("departureDate")} />
              <Field id="united-flight" label="Flight number" value={form.flightNumber} onChange={set("flightNumber")} placeholder="UA 1549" />
              <Field id="united-depart" label="Departs" value={form.departTime} onChange={set("departTime")} placeholder="7:40 AM" />
              <Field id="united-arrive" label="Arrives" value={form.arrivalTime} onChange={set("arrivalTime")} placeholder="4:05 PM" />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Return · {search.destination}→{search.origin}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field id="united-return-date" label="Date (leave empty for one-way)" type="date" value={form.returnDate} onChange={set("returnDate")} />
              <Field id="united-return-flight" label="Flight number" value={form.returnFlightNumber} onChange={set("returnFlightNumber")} placeholder="UA 2046" />
              <Field id="united-return-depart" label="Departs" value={form.returnDepartTime} onChange={set("returnDepartTime")} placeholder="5:30 PM" />
              <Field id="united-return-arrive" label="Arrives" value={form.returnArrivalTime} onChange={set("returnArrivalTime")} placeholder="8:52 PM" />
            </div>
          </fieldset>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save to my trips
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, ...input }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input id={id} {...input} />
    </div>
  );
}
