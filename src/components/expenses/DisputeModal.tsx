import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Flag } from "lucide-react";

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseMerchant: string;
  expenseAmount: number;
  onSubmit: (reason: string, description: string) => void;
}

const disputeReasons = [
  { value: "duplicate", label: "Duplicate charge" },
  { value: "incorrect", label: "Incorrect amount" },
  { value: "fraud", label: "Fraud / Unauthorized" },
  { value: "merchant", label: "Merchant issue" },
  { value: "other", label: "Other" },
];

export function DisputeModal({
  open,
  onOpenChange,
  expenseMerchant,
  expenseAmount,
  onSubmit,
}: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [freezeCard, setFreezeCard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!reason || !description.trim()) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(
        disputeReasons.find((r) => r.value === reason)?.label || reason,
        description
      );
      setIsSubmitting(false);
      setReason("");
      setDescription("");
      setFreezeCard(false);
      onOpenChange(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="w-5 h-5" />
            Dispute charge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense summary */}
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
            <p className="font-medium">{expenseMerchant}</p>
            <p className="text-muted-foreground">${expenseAmount.toFixed(2)}</p>
          </div>

          {/* Reason select */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                {disputeReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Freeze card checkbox */}
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <Checkbox
              id="freeze-card"
              checked={freezeCard}
              onCheckedChange={(checked) => setFreezeCard(checked as boolean)}
            />
            <label
              htmlFor="freeze-card"
              className="text-sm font-medium leading-none"
            >
              Freeze this card temporarily
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={!reason || !description.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Submit dispute
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
