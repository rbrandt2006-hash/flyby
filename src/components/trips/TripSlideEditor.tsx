import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Plane,
  Calendar as CalendarIcon,
  MapPin,
  DollarSign,
  Pencil,
  Clock,
  ArrowRight,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TripEditorData {
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  flight?: {
    airline?: string;
    flightNumber?: string;
    departTime?: string;
    returnTime?: string;
    price?: number;
    departCity?: string;
    arriveCity?: string;
    gate?: string;
    boardingTime?: string;
  } | null;
  hotel?: {
    name?: string;
    location?: string;
    address?: string;
    pricePerNight?: number;
    rating?: number;
    checkIn?: string;
    checkOut?: string;
  } | null;
}

interface TripSlideEditorProps {
  open: boolean;
  onClose: () => void;
  tripData: TripEditorData;
  onSave: (data: TripEditorData) => void;
  onChangeHotel?: () => void;
  onChangeFlight?: () => void;
  isSaving?: boolean;
}

export function TripSlideEditor({
  open,
  onClose,
  tripData,
  onSave,
  onChangeFlight,
  isSaving = false,
}: TripSlideEditorProps) {
  const [draft, setDraft] = useState<TripEditorData>(tripData);

  useEffect(() => {
    if (open) {
      setDraft(tripData);
    }
  }, [open, tripData]);

  const nights = useMemo(() => {
    return Math.max(1, differenceInDays(new Date(draft.endDate), new Date(draft.startDate)));
  }, [draft.startDate, draft.endDate]);

  const flightCost = draft.flight?.price || 0;
  const hotelCost = (draft.hotel?.pricePerNight || 0) * nights;
  const totalCost = flightCost + hotelCost || draft.estimatedCost;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] md:w-[480px] bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Trip Details</h2>
                  <p className="text-xs text-muted-foreground">{draft.destination}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="p-6 space-y-6">

                {/* Trip Overview */}
                <ViewSection icon={<MapPin className="w-4 h-4" />} title="Trip Overview">
                  <div className="space-y-3">
                    <InfoRow label="Destination" value={draft.destination} />
                    <InfoRow label="Purpose" value={draft.purpose || "—"} />
                  </div>
                </ViewSection>

                <Separator />

                {/* Travel Dates */}
                <ViewSection icon={<CalendarIcon className="w-4 h-4" />} title="Travel Dates">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <DateBlock
                        label="Departure"
                        date={draft.startDate}
                      />
                      <DateBlock
                        label="Return"
                        date={draft.endDate}
                      />
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                      {nights} night{nights !== 1 ? "s" : ""} · {format(new Date(draft.startDate), "EEEE")} to {format(new Date(draft.endDate), "EEEE")}
                    </div>
                  </div>
                </ViewSection>

                <Separator />

                {/* Flight — boarding-pass style */}
                <ViewSection icon={<Plane className="w-4 h-4" />} title="Flight">
                  {draft.flight?.airline ? (
                    <div className="space-y-4">
                      {/* Airline & flight number header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{draft.flight.airline}</p>
                          <p className="text-xs text-muted-foreground">{draft.flight.flightNumber || "—"}</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium tracking-wide uppercase">
                          Confirmed
                        </div>
                      </div>

                      {/* Route visualization */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-3">
                          {/* Departure */}
                          <div className="flex-1 text-center">
                            <p className="text-lg font-bold text-foreground tabular-nums">
                              {draft.flight.departTime || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {draft.flight.departCity || "Origin"}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div className="flex flex-col items-center gap-1 px-2">
                            <div className="w-16 h-px bg-border relative">
                              <Plane className="w-3.5 h-3.5 text-primary absolute -top-[7px] right-0 rotate-0" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">Direct</span>
                          </div>

                          {/* Arrival */}
                          <div className="flex-1 text-center">
                            <p className="text-lg font-bold text-foreground tabular-nums">
                              {draft.flight.returnTime || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {draft.destination}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <DetailBlock
                          icon={<Clock className="w-3 h-3" />}
                          label="Boarding"
                          value={draft.flight.boardingTime || "—"}
                        />
                        <DetailBlock
                          label="Gate"
                          value={draft.flight.gate || "TBD"}
                        />
                        <DetailBlock
                          icon={<DollarSign className="w-3 h-3" />}
                          label="Fare"
                          value={`$${flightCost.toLocaleString()}`}
                        />
                      </div>

                      {onChangeFlight && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs"
                          onClick={() => { handleClose(); onChangeFlight(); }}
                        >
                          Change Flight
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
                      <Plane className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">No flight selected</p>
                      {onChangeFlight && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs mt-2"
                          onClick={() => { handleClose(); onChangeFlight(); }}
                        >
                          Select Flight
                        </Button>
                      )}
                    </div>
                  )}
                </ViewSection>

                <Separator />

                {/* Cost Summary */}
                <div className="rounded-xl bg-muted/30 border border-border/50 p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Estimated Cost
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Flight</span>
                      <span className="font-medium tabular-nums">${flightCost.toLocaleString()}</span>
                    </div>
                    {hotelCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hotel ({nights} nights)</span>
                        <span className="font-medium tabular-nums">${hotelCost.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary tabular-nums">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-border bg-background">
              <Button
                className="w-full"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

/* ── Sub-components ── */

function ViewSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function DateBlock({ label, date }: { label: string; date: string }) {
  const d = new Date(date);
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-lg font-bold text-foreground mt-1 tabular-nums">{format(d, "MMM d")}</p>
      <p className="text-xs text-muted-foreground">{format(d, "yyyy")}</p>
    </div>
  );
}

function DetailBlock({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
