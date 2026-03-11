import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Paperclip, X, FileText, Save } from "lucide-react";
import type { DemoExpense } from "./demoExpenseData";

interface EditExpenseDrawerProps {
  expense: DemoExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<DemoExpense>) => void;
  trips: string[];
}

const categories = [
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "meals", label: "Meals" },
  { value: "transportation", label: "Transportation" },
  { value: "conference", label: "Conference Fees" },
  { value: "other", label: "Other" },
];

export function EditExpenseDrawer({ expense, open, onOpenChange, onSave, trips }: EditExpenseDrawerProps) {
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [tripName, setTripName] = useState("");
  const [notes, setNotes] = useState("");
  const [hasReceipt, setHasReceipt] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expense) {
      setVendor(expense.vendor);
      setAmount(String(expense.amount));
      setDate(expense.date);
      setCategory(expense.category);
      setTripName(expense.tripName);
      setNotes(expense.notes || "");
      setHasReceipt(expense.hasReceipt);
      setErrors({});
    }
  }, [expense]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vendor.trim()) errs.vendor = "Merchant is required";
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) errs.amount = "Valid positive amount required";
    if (!date.trim()) errs.date = "Date is required";
    if (!category) errs.category = "Category is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!expense || !validate()) return;
    onSave(expense.id, {
      vendor: vendor.trim(),
      amount: parseFloat(amount),
      date: date.trim(),
      category: category as DemoExpense["category"],
      tripName: tripName || expense.tripName,
      notes: notes.trim() || undefined,
      hasReceipt,
    });
    onOpenChange(false);
  };

  if (!expense) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="text-lg">Edit Expense</SheetTitle>
          <p className="text-sm text-muted-foreground">Update expense details below.</p>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Merchant */}
          <div className="space-y-2">
            <Label htmlFor="edit-vendor">Merchant *</Label>
            <Input
              id="edit-vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className={errors.vendor ? "border-destructive" : ""}
            />
            {errors.vendor && <p className="text-xs text-destructive">{errors.vendor}</p>}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`pl-7 ${errors.amount ? "border-destructive" : ""}`}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          {/* Trip */}
          <div className="space-y-2">
            <Label>Trip</Label>
            <Select value={tripName} onValueChange={setTripName}>
              <SelectTrigger>
                <SelectValue placeholder="Select trip" />
              </SelectTrigger>
              <SelectContent className="bg-background border">
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                {trips.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes..."
            />
          </div>

          {/* Receipt */}
          <div className="space-y-2">
            <Label>Receipt</Label>
            {hasReceipt ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm flex-1">receipt_attached.jpg</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHasReceipt(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => setHasReceipt(true)}>
                <Paperclip className="w-4 h-4" />
                Upload receipt
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="px-6 py-4 shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
