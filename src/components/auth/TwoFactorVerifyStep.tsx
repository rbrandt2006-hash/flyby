import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerifyStepProps {
  phone: string;
  maskedPhone: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorVerifyStep({ 
  phone, 
  maskedPhone, 
  onVerified, 
  onCancel 
}: TwoFactorVerifyStepProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Send code on mount
  useEffect(() => {
    sendCode();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const sendCode = async () => {
    setIsSendingCode(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("2fa-send-sms", {
        body: { phone },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setCodeSent(true);
      setResendCountdown(30);
    } catch (err: any) {
      console.error("Failed to send 2FA code:", err);
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("2fa-verify-sms", {
        body: { 
          phone, 
          code,
          enableAfterVerify: false // Don't update profile, just verify
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      onVerified();
    } catch (err: any) {
      console.error("Failed to verify 2FA code:", err);
      setError(err.message || "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Two-Step Verification</CardTitle>
        <CardDescription className="text-base">
          Enter the code we sent to {maskedPhone}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!codeSent && isSendingCode && (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Sending verification code...</p>
          </div>
        )}

        {codeSent && (
          <>
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                className="h-12 text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={sendCode}
                disabled={resendCountdown > 0 || isSendingCode}
                className="text-sm"
              >
                {isSendingCode 
                  ? "Sending..." 
                  : resendCountdown > 0 
                    ? `Resend code in ${resendCountdown}s` 
                    : "Resend code"
                }
              </Button>
            </div>

            <Button
              onClick={verifyCode}
              className="w-full"
              size="lg"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </>
        )}

        {!codeSent && error && (
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={sendCode} className="flex-1" disabled={isSendingCode}>
                {isSendingCode ? "Sending..." : "Retry"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
