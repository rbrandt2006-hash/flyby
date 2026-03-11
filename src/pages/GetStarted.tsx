import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import flybyLogo from "@/assets/flyby-logo-icon.png";

export default function GetStarted() {
  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    signInAsGuest();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center text-center max-w-md"
      >
        {/* Logo */}
        <motion.img
          src={flybyLogo}
          alt="Flyby"
          className="h-12 mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        />

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Business travel,{" "}
          <span className="text-primary">simplified.</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg mb-10 leading-relaxed">
          Manage trips, expenses, and your team — all in one place.
        </p>

        {/* CTA */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-base gap-2.5 shadow-lg shadow-primary/20"
            onClick={handleGetStarted}
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Subtle footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground/60"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>No account required · Instant access</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
