import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Check, 
  ArrowLeft, 
  Building2, 
  Lock,
  Shield
} from "lucide-react";

interface Bank {
  id: string;
  name: string;
  color: string;
}

const banks: Bank[] = [
  { id: "chase", name: "Chase Business", color: "bg-blue-600" },
  { id: "amex", name: "American Express Business", color: "bg-sky-500" },
  { id: "capital-one", name: "Capital One Business", color: "bg-red-600" },
  { id: "wells-fargo", name: "Wells Fargo Commercial", color: "bg-yellow-600" },
  { id: "citi", name: "Citi Commercial Bank", color: "bg-blue-500" },
  { id: "bofa", name: "Bank of America Business", color: "bg-red-700" },
];

type Step = "bank" | "card" | "success";

interface ConnectCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function ConnectCardModal({ open, onOpenChange, onSuccess }: ConnectCardModalProps) {
  const [step, setStep] = useState<Step>("bank");
  const [direction, setDirection] = useState(1);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  const resetForm = () => {
    setStep("bank");
    setDirection(1);
    setSelectedBank(null);
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setCardholderName("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setDirection(1);
    setStep("card");
  };

  const handleBack = () => {
    setDirection(-1);
    setStep("bank");
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setDirection(1);
      setStep("success");
      setIsSubmitting(false);
    }, 1500);
  };

  const handleDone = () => {
    onSuccess();
    handleClose();
  };

  const isFormValid = cardNumber.replace(/\s/g, "").length === 16 && 
                      expiry.length === 5 && 
                      cvv.length >= 3 && 
                      cardholderName.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <AnimatePresence mode="wait" custom={direction}>
          {step === "bank" && (
            <motion.div
              key="bank"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-6"
            >
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  Select your bank
                </DialogTitle>
              </DialogHeader>

              <p className="text-sm text-muted-foreground mb-6">
                Choose your corporate card provider to securely connect your account
              </p>

              <div className="grid grid-cols-2 gap-3">
                {banks.map((bank, index) => (
                  <motion.button
                    key={bank.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleBankSelect(bank)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all duration-200 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg ${bank.color} flex items-center justify-center shrink-0`}>
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      {bank.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Bank-level encryption protects your data</span>
              </div>
            </motion.div>
          )}

          {step === "card" && selectedBank && (
            <motion.div
              key="card"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-6"
            >
              <DialogHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="rounded-xl -ml-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div className={`w-10 h-10 rounded-xl ${selectedBank.color} flex items-center justify-center`}>
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    {selectedBank.name}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <p className="text-sm text-muted-foreground mb-6">
                Enter your corporate card details to connect
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="pl-10 h-12 rounded-xl font-mono"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiration</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      className="h-12 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <div className="relative">
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                        className="h-12 rounded-xl font-mono"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="As shown on card"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="w-full mt-6 h-12 rounded-xl"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Connect card securely
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground justify-center">
                <Shield className="w-4 h-4" />
                <span>256-bit SSL encryption</span>
              </div>
            </motion.div>
          )}

          {step === "success" && selectedBank && (
            <motion.div
              key="success"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="p-6"
            >
              <div className="flex flex-col items-center text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.1 
                  }}
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-10 h-10 text-success" />
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-2"
                >
                  Card connected!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-2"
                >
                  Your {selectedBank.name} card has been successfully linked
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
                >
                  <div className={`w-6 h-6 rounded ${selectedBank.color} flex items-center justify-center`}>
                    <CreditCard className="w-3 h-3 text-white" />
                  </div>
                  <span>••••  ••••  ••••  {cardNumber.slice(-4)}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="w-full"
                >
                  <Button onClick={handleDone} className="w-full h-12 rounded-xl">
                    Done
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}