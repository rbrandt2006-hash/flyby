import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import flybyLogo from "@/assets/flybyLogo";
import { backend } from "@/integrations/backend/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenError, setTokenError] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // The reset link carries a recovery token. It is exchanged for a session so
  // the new password can be saved, and kept in state because the backend
  // requires either it or the current password before changing a password.
  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      if (hashParams.get("error") || hashParams.get("error_description")) {
        setTokenError(true);
        return;
      }

      const token = params.get("token") ?? hashParams.get("token");
      if (token) {
        const { error } = await backend.auth.verifyRecoveryToken(token);
        if (error) {
          setTokenError(true);
          return;
        }
        setRecoveryToken(token);
        return;
      }

      // Without a token in the link there is nothing to verify — only an
      // already-established session can continue.
      const { data: { session } } = await backend.auth.getSession();
      if (!session) setTokenError(true);
    };

    checkSession();
  }, []);

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const validateForm = () => {
    try {
      passwordSchema.parse({ password, confirmPassword });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await backend.auth.updateUser({
        password,
        ...(recoveryToken ? { recovery_token: recoveryToken } : {}),
      });

      if (error) {
        if (error.message.includes("expired") || error.message.includes("invalid")) {
          setTokenError(true);
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      setSuccess(true);
      
      // Sign out and redirect after 3 seconds
      setTimeout(async () => {
        await backend.auth.signOut();
        navigate("/auth");
      }, 3000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <img 
              alt="Flyby AI" 
              className="h-10" 
              src={flybyLogo.url} 
            />
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-destructive">Link Expired</CardTitle>
              <CardDescription className="text-base">
                This reset link has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => navigate("/forgot-password")}
              >
                Request New Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <img 
              alt="Flyby AI" 
              className="h-10" 
              src={flybyLogo.url} 
            />
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl">Password Updated</CardTitle>
              <CardDescription className="text-base">
                Your password has been updated successfully. Redirecting to login...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <img 
            alt="Flyby AI" 
            className="h-10" 
            src={flybyLogo.url} 
          />
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription className="text-base">
              Create a strong password for your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Password requirements */}
              <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                <p className="text-sm font-medium text-foreground">Password requirements:</p>
                <ul className="space-y-1">
                  <li className={`text-sm flex items-center gap-2 ${passwordChecks.length ? "text-success" : "text-muted-foreground"}`}>
                    <Check className={`w-4 h-4 ${passwordChecks.length ? "opacity-100" : "opacity-30"}`} />
                    At least 8 characters
                  </li>
                  <li className={`text-sm flex items-center gap-2 ${passwordChecks.number ? "text-success" : "text-muted-foreground"}`}>
                    <Check className={`w-4 h-4 ${passwordChecks.number ? "opacity-100" : "opacity-30"}`} />
                    At least one number
                  </li>
                  <li className={`text-sm flex items-center gap-2 ${passwordChecks.special ? "text-success" : "text-muted-foreground"}`}>
                    <Check className={`w-4 h-4 ${passwordChecks.special ? "opacity-100" : "opacity-30"}`} />
                    At least one special character
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
