import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send } from "lucide-react";

interface SendToSupervisorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseMerchant: string;
  expenseAmount: number;
  onSend: (supervisorName: string, note: string) => void;
}

// Populated from real workspace members; no invented supervisors.
const supervisors: { id: string; name: string }[] = [];

export function SendToSupervisorModal({
  open,
  onOpenChange,
  expenseMerchant,
  expenseAmount,
  onSend,
}: SendToSupervisorModalProps) {
  const [supervisor, setSupervisor] = useState("");
  const [note, setNote] = useState("");
  const [includeReceipt, setIncludeReceipt] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!supervisor) return;
    
    setIsSending(true);
    setTimeout(() => {
      const supervisorName = supervisors.find((s) => s.id === supervisor)?.name || "";
      onSend(supervisorName, note);
      setIsSending(false);
      setSupervisor("");
      setNote("");
      onOpenChange(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send expense report to supervisor</DialogTitle>
          <DialogDescription>
            Choose a supervisor and send the selected expenses for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense summary */}
          <div className="p-3 rounded-lg bg-secondary/50 text-sm">
            <p className="font-medium">{expenseMerchant}</p>
            <p className="text-muted-foreground">${expenseAmount.toFixed(2)}</p>
          </div>

          {/* Supervisor select */}
          <div className="space-y-2">
            <Label>Supervisor *</Label>
            <Select value={supervisor} onValueChange={setSupervisor}>
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                {supervisors.map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    {sup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Add context for your supervisor..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Include receipt checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-receipt"
              checked={includeReceipt}
              onCheckedChange={(checked) => setIncludeReceipt(checked as boolean)}
            />
            <label
              htmlFor="include-receipt"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include receipt
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSend}
              disabled={!supervisor || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
