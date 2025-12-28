import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane } from "lucide-react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<"flying" | "morphing" | "settling" | "complete">("flying");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("morphing"), 1200),
      setTimeout(() => setPhase("settling"), 2200),
      setTimeout(() => {
        setPhase("complete");
        onComplete();
      }, 3000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "complete" && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Flying plane */}
          <AnimatePresence>
            {phase === "flying" && (
              <motion.div
                initial={{ x: "-100vw", y: "20vh", rotate: -10 }}
                animate={{ x: "0vw", y: "0vh", rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="absolute"
              >
                <Plane className="w-16 h-16 text-primary" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo appears and morphs */}
          {(phase === "morphing" || phase === "settling") && (
            <motion.div
              initial={{ opacity: 0, scale: 1.2 }}
              animate={
                phase === "settling"
                  ? { opacity: 1, scale: 0.6, y: "-40vh", x: "-42vw" }
                  : { opacity: 1, scale: 1 }
              }
              transition={{
                duration: phase === "settling" ? 0.8 : 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <img
                  src="/lovable-uploads/eb656c8d-2d9c-4190-9b5e-fa90371682e7.png"
                  alt="FlyBy"
                  className="h-12"
                />
              </motion.div>
              {phase === "morphing" && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-muted-foreground text-sm tracking-wide"
                >
                  Your travel command center
                </motion.p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
