import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  X,
  Plane,
  Building2,
  Calendar as CalendarIcon,
  MapPin,
  DollarSign,
  Save,
  RefreshCw,
  Pencil,
  ChevronDown,
  Star,
  Sparkles,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

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
  isSaving?: boolean;
}

export function TripSlideEditor({
  open,
  onClose,
  tripData,
  onSave,
  isSaving = false,
}: TripSlideEditorProps) {
  const [draft, setDraft] = useState<TripEditorData>(tripData);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);

  // Sync draft when tripData changes or panel opens
  useEffect(() => {
    if (open) {
      setDraft(tripData);
      setShowRefreshBanner(false);
    }
  }, [open, tripData]);

  const nights = useMemo(() => {
    return Math.max(1, differenceInDays(new Date(draft.endDate), new Date(draft.startDate)));
  }, [draft.startDate, draft.endDate]);

  const flightCost = draft.flight?.price || 0;
  const hotelCost = (draft.hotel?.pricePerNight || 0) * nights;
  const totalCost = flightCost + hotelCost || draft.estimatedCost;

  const updateField = useCallback(<K extends keyof TripEditorData>(key: K, value: TripEditorData[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      const newStart = range.from.toISOString();
      const newEnd = (range.to || range.from).toISOString();
      setDraft(prev => ({
        ...prev,
        startDate: newStart,
        endDate: newEnd,
        hotel: prev.hotel ? {
          ...prev.hotel,
          checkIn: format(range.from!, "yyyy-MM-dd"),
          checkOut: format(range.to || range.from!, "yyyy-MM-dd"),
        } : prev.hotel,
      }));
      setShowRefreshBanner(true);
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave({ ...draft, estimatedCost: totalCost });
  }, [draft, totalCost, onSave]);

  const handleDismissRefresh = () => setShowRefreshBanner(false);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Slide-out panel */}
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
                  <h2 className="text-base font-semibold text-foreground">Edit Trip</h2>
                  <p className="text-xs text-muted-foreground">{draft.destination}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="p-6 space-y-6">

                {/* Refresh suggestion banner */}
                <AnimatePresence>
                  {showRefreshBanner && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Refresh recommendations?</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Would you like FlyBy to refresh flight and hotel options for the new dates?
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleDismissRefresh}>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Refresh Options
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDismissRefresh}>
                              Keep Current
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Trip Overview */}
                <EditorSection icon={<MapPin className="w-4 h-4" />} title="Trip Overview">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Destination</Label>
                      <Input
                        value={draft.destination}
                        onChange={e => updateField("destination", e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Purpose</Label>
                      <Input
                        value={draft.purpose}
                        onChange={e => updateField("purpose", e.target.value)}
                        placeholder="e.g. Client meeting, Team offsite"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                </EditorSection>

                <Separator />

                {/* Travel Dates */}
                <EditorSection icon={<CalendarIcon className="w-4 h-4" />} title="Travel Dates">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Departure</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full mt-1 h-9 text-sm justify-start font-normal">
                              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              {format(new Date(draft.startDate), "MMM d, yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={{
                                from: new Date(draft.startDate),
                                to: new Date(draft.endDate),
                              }}
                              onSelect={handleDateRangeChange}
                              numberOfMonths={1}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Return</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full mt-1 h-9 text-sm justify-start font-normal">
                              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              {format(new Date(draft.endDate), "MMM d, yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={{
                                from: new Date(draft.startDate),
                                to: new Date(draft.endDate),
                              }}
                              onSelect={handleDateRangeChange}
                              numberOfMonths={1}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                      {nights} night{nights !== 1 ? "s" : ""} · {format(new Date(draft.startDate), "EEEE")} to {format(new Date(draft.endDate), "EEEE")}
                    </div>
                  </div>
                </EditorSection>

                <Separator />

                {/* Flight */}
                <EditorSection icon={<Plane className="w-4 h-4" />} title="Flight">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Airline</Label>
                        <Input
                          value={draft.flight?.airline || ""}
                          onChange={e => updateField("flight", { ...draft.flight, airline: e.target.value })}
                          placeholder="e.g. United Airlines"
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Flight #</Label>
                        <Input
                          value={draft.flight?.flightNumber || ""}
                          onChange={e => updateField("flight", { ...draft.flight, flightNumber: e.target.value })}
                          placeholder="e.g. UA 1234"
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Departure Time</Label>
                        <Input
                          value={draft.flight?.departTime || ""}
                          onChange={e => updateField("flight", { ...draft.flight, departTime: e.target.value })}
                          placeholder="e.g. 8:00 AM"
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Return Time</Label>
                        <Input
                          value={draft.flight?.returnTime || ""}
                          onChange={e => updateField("flight", { ...draft.flight, returnTime: e.target.value })}
                          placeholder="e.g. 6:30 PM"
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Flight Cost</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          value={draft.flight?.price || ""}
                          onChange={e => updateField("flight", { ...draft.flight, price: Number(e.target.value) || 0 })}
                          placeholder="0"
                          className="h-9 text-sm pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </EditorSection>

                <Separator />

                {/* Hotel */}
                <EditorSection icon={<Building2 className="w-4 h-4" />} title="Hotel">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Hotel Name</Label>
                      <Input
                        value={draft.hotel?.name || ""}
                        onChange={e => updateField("hotel", { ...draft.hotel, name: e.target.value })}
                        placeholder="e.g. The Westin St. Francis"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <Input
                        value={draft.hotel?.location || ""}
                        onChange={e => updateField("hotel", { ...draft.hotel, location: e.target.value })}
                        placeholder="e.g. Union Square"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Price / Night</Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            value={draft.hotel?.pricePerNight || ""}
                            onChange={e => updateField("hotel", { ...draft.hotel, pricePerNight: Number(e.target.value) || 0 })}
                            placeholder="0"
                            className="h-9 text-sm pl-8"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Rating</Label>
                        <div className="relative mt-1">
                          <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={draft.hotel?.rating || ""}
                            onChange={e => updateField("hotel", { ...draft.hotel, rating: Number(e.target.value) || 0 })}
                            placeholder="4.5"
                            className="h-9 text-sm pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground flex justify-between">
                      <span>{nights} night{nights !== 1 ? "s" : ""}</span>
                      <span className="font-medium text-foreground">${hotelCost.toLocaleString()} total</span>
                    </div>
                  </div>
                </EditorSection>

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
                      <span className="font-medium">${flightCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotel ({nights} nights)</span>
                      <span className="font-medium">${hotelCost.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-border bg-background flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full mr-2"
                  />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// Section component
function EditorSection({
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
