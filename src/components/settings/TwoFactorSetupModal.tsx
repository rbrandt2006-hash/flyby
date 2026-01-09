import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Phone, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnabled: boolean;
  maskedPhone?: string | null;
  onStatusChange: (enabled: boolean, maskedPhone: string | null) => void;
}

type Step = "phone" | "verify" | "success" | "disable";

export function TwoFactorSetupModal({ 
  open, 
  onOpenChange, 
  isEnabled, 
  maskedPhone,
  onStatusChange 
}: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<Step>(isEnabled ? "disable" : "phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(isEnabled ? "disable" : "phone");
      setPhoneNumber("");
      setVerificationCode("");
      setErrorMessage(null);
      setResendDisabled(false);
      setResendCountdown(0);
    }
    onOpenChange(newOpen);
  };

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [resendCountdown, resendDisabled]);

  // Validate phone number format (E.164)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
  const isValidPhone = /^\+[1-9]\d{6,14}$/.test(cleanPhone);

  const handleSendCode = useCallback(async () => {
    if (!isValidPhone) {
      toast.error("Please enter a valid phone number in E.164 format (e.g., +17135551234)");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke("2fa-send-sms", {
        body: { phone: cleanPhone },
      });

      if (error) {
        throw new Error(error.message || "Failed to send verification code");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Verification code sent to your phone");
      setStep("verify");
      
      // Start resend countdown
      setResendDisabled(true);
      setResendCountdown(30);
    } catch (error: any) {
      console.error("Send SMS error:", error);
      const message = error.message || "Failed to send verification code";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [cleanPhone, isValidPhone]);

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke("2fa-verify-sms", {
        body: { 
          phone: cleanPhone, 
          code: verificationCode,
          enableAfterVerify: true 
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to verify code");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setStep("success");
      onStatusChange(true, data.maskedPhone || null);
      toast.success("Two-factor authentication enabled successfully!");
    } catch (error: any) {
      console.error("Verify code error:", error);
      const message = error.message || "Failed to verify code";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    await handleSendCode();
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke("2fa-disable", {
        body: {},
      });

      if (error) {
        throw new Error(error.message || "Failed to disable 2FA");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      onStatusChange(false, null);
      toast.success("Two-factor authentication disabled");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Disable 2FA error:", error);
      const message = error.message || "Failed to disable 2FA";
      setErrorMessage(message);
      toast.error(message);
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
                Enable Two-Step Verification
              </DialogTitle>
              <DialogDescription>
                Add an extra layer of security by verifying your phone via SMS.
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
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="h-11 rounded-xl pl-10"
                    placeholder="+17135551234"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your phone in E.164 format (e.g., +1 for US)
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{errorMessage}</p>
                </div>
              )}

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
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setErrorMessage(null);
                  }}
                  className="h-11 rounded-xl text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{errorMessage}</p>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={resendDisabled || isLoading}
                  className="text-sm"
                >
                  {resendDisabled ? `Resend code in ${resendCountdown}s` : "Resend code"}
                </Button>
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
                  Your account is now protected with two-step verification.
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
              <DialogTitle>Disable Two-Step Verification</DialogTitle>
              <DialogDescription>
                Are you sure you want to disable 2FA? This will make your account less secure.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {maskedPhone && (
                <div className="p-3 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Current phone:</p>
                  <p className="font-medium">{maskedPhone}</p>
                </div>
              )}

              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">
                  Without 2FA, your account will only be protected by your password.
                  We recommend keeping 2FA enabled for maximum security.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{errorMessage}</p>
                </div>
              )}

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
