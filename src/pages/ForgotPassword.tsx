import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email format
    try {
      emailSchema.parse({ email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Always show success message to not reveal if email exists
      if (error) {
        console.error("Password reset error:", error);
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setSubmitted(true); // Still show success to not reveal email existence
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img 
            alt="flyby" 
            className="h-10 mix-blend-multiply" 
            src="/lovable-uploads/961e595a-2d00-479f-b364-022c8127f18a.png" 
          />
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {submitted ? "Check your email" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-base">
              {submitted 
                ? "If an account exists with this email, a password reset link has been sent."
                : "Enter the email address associated with your account."
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center p-6 rounded-lg bg-secondary/50">
                  <Mail className="w-12 h-12 text-primary" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  The reset link will expire in 15 minutes. If you don't see the email, check your spam folder.
                </p>
                <Link to="/auth">
                  <Button variant="outline" className="w-full" size="lg">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  {error && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Link to="/auth" className="block">
                  <Button variant="ghost" className="w-full" type="button">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
