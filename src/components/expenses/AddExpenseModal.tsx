import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Paperclip, X, Check, FileText, ArrowRight } from "lucide-react";
import type { Expense } from "@/hooks/useExpenses";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Omit<Expense, "id">, submitNow: boolean) => void;
}

const categories = [
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "meals", label: "Meals" },
  { value: "transportation", label: "Transportation" },
  { value: "conference", label: "Conference Fees" },
  { value: "entertainment", label: "Entertainment" },
  { value: "office", label: "Office/Other" },
];

const paymentMethods = [
  { value: "corporate", label: "Corporate Card" },
  { value: "personal", label: "Personal Card" },
  { value: "cash", label: "Cash" },
];

export function AddExpenseModal({ open, onOpenChange, onSave }: AddExpenseModalProps) {
  const [step, setStep] = useState<"form" | "submit-choice">("form");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [reimbursable, setReimbursable] = useState(false);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!merchant.trim()) newErrors.merchant = "Merchant is required";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valid amount is required";
    if (!date) newErrors.date = "Date is required";
    if (!category) newErrors.category = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep("submit-choice");
    }
  };

  const handleSave = (submitNow: boolean) => {
    const expenseData: Omit<Expense, "id"> = {
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      category: category as Expense["category"],
      description: description.trim() || `${category} expense`,
      paymentMethod: paymentMethod === "corporate" ? "Corporate Amex ••4521" : 
                     paymentMethod === "personal" ? "Personal Card" : "Cash",
      reimbursable,
      status: submitNow ? "submitted" : "pending",
      location: "",
    };
    
    onSave(expenseData, submitNow);
    resetForm();
  };

  const resetForm = () => {
    setStep("form");
    setMerchant("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("");
    setDescription("");
    setPaymentMethod("");
    setReimbursable(false);
    setHasReceipt(false);
    setErrors({});
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {step === "form" ? "Add New Expense" : "Submit or Save?"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 pb-1"
            >
              {/* Merchant */}
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant / Establishment *</Label>
                <Input
                  id="merchant"
                  placeholder="e.g., Delta Air Lines"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className={errors.merchant ? "border-destructive" : ""}
                />
                {errors.merchant && (
                  <p className="text-xs text-destructive">{errors.merchant}</p>
                )}
              </div>

              {/* Amount & Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`pl-7 ${errors.amount ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-destructive">{errors.amount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={errors.date ? "border-destructive" : ""}
                  />
                  {errors.date && (
                    <p className="text-xs text-destructive">{errors.date}</p>
                  )}
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
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about this expense..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>
                        {pm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reimbursable toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium">Reimbursable</p>
                  <p className="text-xs text-muted-foreground">Mark if you need reimbursement</p>
                </div>
                <Switch checked={reimbursable} onCheckedChange={setReimbursable} />
              </div>

              {/* Receipt upload simulation */}
              <div className="space-y-2">
                <Label>Receipt</Label>
                {hasReceipt ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1">receipt_image.jpg</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setHasReceipt(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setHasReceipt(true)}
                  >
                    <Paperclip className="w-4 h-4" />
                    Upload receipt
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleContinue}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="submit-choice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <Card className="p-4 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{merchant}</p>
                    <p className="text-sm text-muted-foreground">{category} • {new Date(date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xl font-bold">${parseFloat(amount).toFixed(2)}</p>
                </div>
              </Card>

              <p className="text-sm text-muted-foreground text-center">
                Would you like to submit this expense for approval now, or save it as a draft?
              </p>

              {/* Choice buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleSave(false)}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Save as Draft</span>
                  <span className="text-xs text-muted-foreground">Submit later</span>
                </Button>
                <Button
                  className="flex-col h-auto py-4 gap-2"
                  onClick={() => handleSave(true)}
                >
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Submit Now</span>
                  <span className="text-xs text-muted-foreground/80">For approval</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("form")}
              >
                ← Back to edit
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
