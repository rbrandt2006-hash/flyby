import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
  CompanyError, listApprovers, sendExpenseForApproval,
  type ApproversResult, type SentExpense,
} from "@/services/companyPortal";

interface SendToSupervisorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string;
  expenseMerchant: string;
  expenseAmount: number;
  /** The expense as the backend saved it, once it's with the manager. */
  onSent: (expense: SentExpense) => void;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send an expense to a manager: one of the admins of the traveler's company
 * portal. The list comes from the backend, which also checks the choice and
 * records the request where only the company's admins can decide on it.
 */
export function SendToSupervisorModal({
  open,
  onOpenChange,
  expenseId,
  expenseMerchant,
  expenseAmount,
  onSent,
}: SendToSupervisorModalProps) {
  const navigate = useNavigate();
  const [company, setCompany] = useState<ApproversResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState("");
  const [note, setNote] = useState("");
  const [includeReceipt, setIncludeReceipt] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    setCompany(null);
    setLoadError(null);
    try {
      const result = await listApprovers();
      setCompany(result);
      // One manager: they're the one, so choose them already.
      setSupervisor(result.approvers.length === 1 ? result.approvers[0].id : "");
    } catch (err) {
      setLoadError(err instanceof CompanyError ? err.message : "Couldn't load your company's managers.");
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const approvers = company?.approvers ?? [];
  const chosen = approvers.find((a) => a.id === supervisor);

  const handleSend = async () => {
    if (!chosen) return;
    setIsSending(true);
    try {
      let result;
      try {
        result = await sendExpenseForApproval(expenseId, chosen.id, note, includeReceipt);
      } catch (err) {
        // A just-added expense can still be on its way to the server.
        if (!(err instanceof CompanyError) || err.code !== "expense_not_found") throw err;
        await wait(1500);
        result = await sendExpenseForApproval(expenseId, chosen.id, note, includeReceipt);
      }
      onSent(result.expense);
      toast.success(`Sent to ${chosen.name}`, {
        description: "They can approve it or send it back from their company dashboard.",
      });
      setNote("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof CompanyError ? err.message : "Couldn't send the expense. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const goTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send to supervisor</DialogTitle>
          <DialogDescription>
            {company?.portal
              ? `Choose a manager at ${company.portal.name} to review this expense.`
              : "Send this expense to a manager in your company to review."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense summary */}
          <div className="p-3 rounded-lg bg-secondary/50 text-sm">
            <p className="font-medium">{expenseMerchant}</p>
            <p className="text-muted-foreground">${expenseAmount.toFixed(2)}</p>
          </div>

          {loadError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>
            </div>
          ) : !company ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !company.portal ? (
            // Not in a company: there's nobody to send it to yet.
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Expenses go to a manager in your company's Flyby portal. Join your company with its code
                  in Settings, then send this again.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => goTo("/settings")}>Open Settings</Button>
            </div>
          ) : approvers.length === 0 ? (
            // Only possible for a company's sole admin.
            <div className="rounded-lg border border-border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                You're the only admin of {company.portal.name}, so there's nobody else to approve your
                expenses. Make another member an admin from the company dashboard first.
              </p>
              <Button variant="outline" size="sm" onClick={() => goTo("/company")}>Open company dashboard</Button>
            </div>
          ) : (
            <>
              {/* Supervisor select */}
              <div className="space-y-2">
                <Label htmlFor="supervisor">Supervisor *</Label>
                <Select value={supervisor} onValueChange={setSupervisor}>
                  <SelectTrigger id="supervisor">
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {approvers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                        {(sup.jobTitle || sup.email) && (
                          <span className="opacity-70"> · {sup.jobTitle || sup.email}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {approvers.length === 1
                    ? `${approvers[0].name} manages ${company.portal.name} on Flyby.`
                    : `The admins of ${company.portal.name} on Flyby.`}
                </p>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="supervisor-note">Note (optional)</Label>
                <Textarea
                  id="supervisor-note"
                  placeholder="Add context for your supervisor..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
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
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => void handleSend()}
              disabled={!chosen || isSending}
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
