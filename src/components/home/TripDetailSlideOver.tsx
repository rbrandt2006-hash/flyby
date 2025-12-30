import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plane, MapPin, Hotel, Car, Calendar, Edit2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface TripData {
  id: string;
  destination: string;
  dates: string;
  status: "approved" | "pending" | "cancelled" | "draft";
  purpose: string;
  airline?: string;
  hotel?: string;
  groundTransport?: string;
  estimatedCost?: number;
  notes?: string;
}

interface TripDetailSlideOverProps {
  trip: TripData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (tripId: string, updates: Partial<TripData>) => void;
  onConfirm?: (tripId: string) => void;
  onCancel?: (tripId: string) => void;
  onDelete?: (tripId: string) => void;
}

export function TripDetailSlideOver({
  trip,
  open,
  onOpenChange,
  onUpdate,
  onConfirm,
  onCancel,
  onDelete,
}: TripDetailSlideOverProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TripData>>({});
  const [confirmDialog, setConfirmDialog] = useState<"cancel" | "delete" | null>(null);

  if (!trip) return null;

  const handleStartEdit = () => {
    setEditData({
      destination: trip.destination,
      dates: trip.dates,
      purpose: trip.purpose,
      airline: trip.airline,
      hotel: trip.hotel,
      groundTransport: trip.groundTransport,
      notes: trip.notes,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdate?.(trip.id, editData);
    setIsEditing(false);
    toast.success("Trip updated");
  };

  const handleCancelEdit = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleConfirmTrip = () => {
    onConfirm?.(trip.id);
    toast.success("Trip confirmed");
    onOpenChange(false);
  };

  const handleCancelTrip = () => {
    onCancel?.(trip.id);
    setConfirmDialog(null);
    toast.success("Trip cancelled");
    onOpenChange(false);
  };

  const handleDeleteTrip = () => {
    onDelete?.(trip.id);
    setConfirmDialog(null);
    toast.success("Trip removed");
    onOpenChange(false);
  };

  const statusConfig = {
    approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
    pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
    cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  };

  const status = statusConfig[trip.status] || statusConfig.pending;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{trip.destination}</h2>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{trip.dates}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && trip.status !== "cancelled" && (
                      <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Destination</Label>
                      <Input
                        value={editData.destination || ""}
                        onChange={(e) => setEditData({ ...editData, destination: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dates</Label>
                      <Input
                        value={editData.dates || ""}
                        onChange={(e) => setEditData({ ...editData, dates: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purpose</Label>
                      <Input
                        value={editData.purpose || ""}
                        onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Airline Preference</Label>
                      <Select
                        value={editData.airline || ""}
                        onValueChange={(v) => setEditData({ ...editData, airline: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select airline" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Delta">Delta</SelectItem>
                          <SelectItem value="United">United</SelectItem>
                          <SelectItem value="American">American</SelectItem>
                          <SelectItem value="Southwest">Southwest</SelectItem>
                          <SelectItem value="JetBlue">JetBlue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hotel Preference</Label>
                      <Input
                        value={editData.hotel || ""}
                        onChange={(e) => setEditData({ ...editData, hotel: e.target.value })}
                        placeholder="e.g., Marriott Downtown"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ground Transport</Label>
                      <Select
                        value={editData.groundTransport || ""}
                        onValueChange={(v) => setEditData({ ...editData, groundTransport: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select transport" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Uber">Uber</SelectItem>
                          <SelectItem value="Lyft">Lyft</SelectItem>
                          <SelectItem value="Rental Car">Rental Car</SelectItem>
                          <SelectItem value="Public Transit">Public Transit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={editData.notes || ""}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        placeholder="Special requests or notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Purpose</p>
                      <p className="font-medium">{trip.purpose}</p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trip Details</h3>
                      
                      {trip.airline && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                          <Plane className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{trip.airline}</p>
                            <p className="text-xs text-muted-foreground">Preferred airline</p>
                          </div>
                        </div>
                      )}

                      {trip.hotel && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                          <Hotel className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{trip.hotel}</p>
                            <p className="text-xs text-muted-foreground">Hotel accommodation</p>
                          </div>
                        </div>
                      )}

                      {trip.groundTransport && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                          <Car className="w-4 h-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{trip.groundTransport}</p>
                            <p className="text-xs text-muted-foreground">Ground transportation</p>
                          </div>
                        </div>
                      )}

                      {trip.estimatedCost && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-sm text-muted-foreground">Estimated Cost</p>
                          <p className="text-2xl font-bold">${trip.estimatedCost.toLocaleString()}</p>
                        </div>
                      )}

                      {trip.notes && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm mt-1">{trip.notes}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-background">
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 mr-2" />
                      Save changes
                    </Button>
                  </div>
                ) : trip.status === "cancelled" ? (
                  <Button variant="destructive" className="w-full" onClick={() => setConfirmDialog("delete")}>
                    Remove from list
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {trip.status === "pending" && (
                      <Button className="w-full" onClick={handleConfirmTrip}>
                        Confirm trip
                      </Button>
                    )}
                    {(trip.status === "pending" || trip.status === "approved") && (
                      <Button variant="outline" className="w-full" onClick={() => setConfirmDialog("cancel")}>
                        Cancel trip
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDialog === "cancel"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this trip?</DialogTitle>
            <DialogDescription>
              This will cancel your trip to {trip.destination}. You can rebook later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Keep trip</Button>
            <Button variant="destructive" onClick={handleCancelTrip}>Cancel trip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog === "delete"} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove cancelled trip?</DialogTitle>
            <DialogDescription>
              This will permanently remove the trip to {trip.destination} from your list. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTrip}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
