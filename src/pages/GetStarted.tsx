import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Briefcase, User } from "lucide-react";
import { toast } from "sonner";
import flybyLogo from "@/assets/flyby-ai-logo.png.asset.json";

type Mode = "signup" | "signin";
type EmailMode = "work" | "personal";

export default function GetStarted() {
  const { signUp, signIn, signInAsGuest } = useAuth();
  const navigate = useNavigate();

  // Preserve ?next= (e.g. from the OAuth consent route) through sign-in / sign-up / guest.
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const postAuthTarget = safeNext ?? "/";

  const [mode, setMode] = useState<Mode>("signup");
  const [emailMode, setEmailMode] = useState<EmailMode>("work");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { toast.error("Please enter your name"); return; }
        const { error } = await signUp(email.trim(), password, name.trim());
        if (error) { toast.error(error.message); return; }
        try {
          localStorage.setItem("flyby_pending_onboarding", "true");
          localStorage.setItem("flyby_account_mode", emailMode);
          if (safeNext) localStorage.setItem("flyby_post_onboarding_next", safeNext);
        } catch { /* ignore */ }
        toast.success("Account created — let's set things up.");
        navigate("/onboarding", { replace: true });
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) { toast.error(error.message); return; }
        navigate(postAuthTarget, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    signInAsGuest();
    navigate(postAuthTarget, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <img src={flybyLogo.url} alt="Flyby AI" className="h-16 w-auto mb-6" />
          <h1 className="text-2xl font-bold tracking-tight text-center">
            {mode === "signup" ? "Create your Flyby AI account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            {mode === "signup" ? "Corporate travel, without the chaos." : "Sign in to continue."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" required autoFocus />
              </div>

              <div className="space-y-1.5">
                <Label>Account type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailMode("work")}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all ${emailMode === "work" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Work email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode("personal")}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all ${emailMode === "personal" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <User className="w-4 h-4" />
                    <span>Personal</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailMode === "work" ? "We'll enable business mode and link your company." : "Solo traveler mode — perfect for personal trips."}
                </p>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">{mode === "signup" && emailMode === "work" ? "Work email" : "Email"}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
              {mode === "signup" ? "Create account" : "Sign in"}
              <ArrowRight className="w-4 h-4" />
            </>}
          </Button>
        </form>

        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGuest}>
          Continue as guest
        </Button>
      </motion.div>
    </div>
  );
}
