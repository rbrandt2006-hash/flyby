import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import flybyLogo from "@/assets/flyby-ai-logo.png.asset.json";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, AlertCircle } from "lucide-react";
import { z } from "zod";
import { backend } from "@/integrations/backend/client";
import { TwoFactorVerifyStep } from "@/components/auth/TwoFactorVerifyStep";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { validatePassword } from "@/lib/passwordPolicy";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(10, "Password must be at least 10 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  orgName: z.string().min(2, "Organization name must be at least 2 characters").optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminSignup, setIsAdminSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorMaskedPhone, setTwoFactorMaskedPhone] = useState("");
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    try {
      const data = isLogin ? { email, password } : { email, password, fullName };
      authSchema.parse(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
      }
    }

    // Enforce strong password policy on signup
    if (!isLogin) {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) {
        newErrors.password = pwCheck.errors[0] || "Password does not meet requirements";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isLogin) {
        // Check if 2FA is required before completing login
        const { data: check2FA } = await backend.functions.invoke("twofa-check-required", {
          body: { email }
        });

        if (check2FA?.requires2FA) {
          // First verify password is correct
          const { error } = await signIn(email, password);
          if (error) {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive"
            });
            setLoading(false);
            return;
          }

          // Password correct, now require 2FA
          setTwoFactorMaskedPhone(check2FA.maskedPhone || "your phone");
          setRequires2FA(true);
          setLoading(false);
          return;
        }

        // No 2FA required, proceed with normal login
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've signed in successfully."
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          // If admin signup, assign admin role after creation
          if (isAdminSignup) {
            // The role will be assigned via a trigger or after email verification
            // For now, we store the intent in user metadata
          }
          toast({
            title: "Account created",
            description: isAdminSignup 
              ? "Welcome! Your admin account is being set up. Please verify your email."
              : "Welcome to FlyBy! Please verify your email."
          });
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerified = () => {
    toast({
      title: "Welcome back!",
      description: "You've signed in successfully."
    });
    navigate("/");
  };

  const handle2FACancel = async () => {
    // Sign out since password was already verified
    await backend.auth.signOut();
    setRequires2FA(false);
    setTwoFactorMaskedPhone("");
  };

  // Show 2FA verification step
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <img alt="Flyby AI" className="h-10" src={flybyLogo.url} />
          </div>
          <TwoFactorVerifyStep
            maskedPhone={twoFactorMaskedPhone}
            onVerified={handle2FAVerified}
            onCancel={handle2FACancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <img alt="Flyby AI" className="h-10" src={flybyLogo.url} />
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : isAdminSignup ? "Register your organization" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin 
                ? "Sign in to access your travel dashboard" 
                : isAdminSignup 
                  ? "Set up your organization's travel management" 
                  : "Start automating your business travel"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" type="text" placeholder="Alex Johnson" value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} />
                    {errors.fullName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  {isAdminSignup && (
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization name</Label>
                      <Input id="orgName" type="text" placeholder="Acme Corp" value={orgName} onChange={e => setOrgName(e.target.value)} disabled={loading} />
                      {errors.orgName && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.orgName}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                {!isLogin && <PasswordStrengthMeter password={password} />}
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "Sign in" : "Create account"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setIsAdminSignup(false);
                  setErrors({});
                }}
                className="text-sm transition-colors text-primary"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
              {isLogin && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setIsAdminSignup(true);
                      setErrors({});
                    }}
                    className="text-sm transition-colors text-muted-foreground hover:text-primary"
                  >
                    Register your organization →
                  </button>
                </div>
              )}
              {!isLogin && !isAdminSignup && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminSignup(true);
                      setErrors({});
                    }}
                    className="text-sm transition-colors text-muted-foreground hover:text-primary"
                  >
                    Registering an organization? Sign up as Admin →
                  </button>
                </div>
              )}
              {isAdminSignup && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminSignup(false);
                      setErrors({});
                    }}
                    className="text-sm transition-colors text-muted-foreground hover:text-primary"
                  >
                    ← Back to standard signup
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm mt-6 text-primary">
          By continuing, you agree to Flyby's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
