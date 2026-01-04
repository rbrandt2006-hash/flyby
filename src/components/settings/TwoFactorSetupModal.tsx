import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Phone, Shield, CheckCircle2 } from "lucide-react";

interface TwoFactorSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

type Step = "phone" | "verify" | "success" | "disable";

export function TwoFactorSetupModal({ open, onOpenChange, isEnabled, onToggle }: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<Step>(isEnabled ? "disable" : "phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(isEnabled ? "disable" : "phone");
      setPhoneNumber("");
      setVerificationCode("");
    }
    onOpenChange(newOpen);
  };

  // Validate phone number format
  const isValidPhone = /^\+?[1-9]\d{9,14}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ""));

  const handleSendCode = async () => {
    if (!isValidPhone) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending SMS code (in production, this would call your backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Verification code sent to your phone");
      setStep("verify");
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate verifying code (in production, this would call your backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, accept code "123456"
      if (verificationCode === "123456") {
        setStep("success");
        onToggle(true);
      } else {
        toast.error("Invalid verification code. Try 123456 for demo.");
      }
    } catch (error) {
      toast.error("Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    try {
      // Simulate disabling 2FA (in production, this would call your backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      onToggle(false);
      toast.success("Two-factor authentication disabled");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "phone" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Enable Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Add an extra layer of security to your account by verifying your phone number.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a verification code to this number
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendCode}
                  className="flex-1 rounded-xl"
                  disabled={isLoading || !isValidPhone}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Code"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to {phoneNumber}. Enter it below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-11 rounded-xl text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  For demo purposes, enter 123456
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("phone")}
                  className="flex-1 rounded-xl"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  className="flex-1 rounded-xl"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                2FA Enabled Successfully
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                <p className="text-sm">
                  Your account is now protected with two-factor authentication.
                  You'll receive a verification code via SMS when signing in from a new device.
                </p>
              </div>

              <Button
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl"
              >
                Done
              </Button>
            </div>
          </>
        )}

        {step === "disable" && (
          <>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Are you sure you want to disable 2FA? This will make your account less secure.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">
                  Without 2FA, your account will only be protected by your password.
                  We recommend keeping 2FA enabled for maximum security.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl"
                  disabled={isLoading}
                >
                  Keep 2FA
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  className="flex-1 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable 2FA"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
