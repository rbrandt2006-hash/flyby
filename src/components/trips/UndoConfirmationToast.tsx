import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UndoConfirmationToastProps {
  visible: boolean;
  tripDestination: string;
  countdown: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoConfirmationToast({
  visible,
  tripDestination,
  countdown,
  onUndo,
  onDismiss,
}: UndoConfirmationToastProps) {
  const progressPercent = (countdown / 10) * 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className="bg-card border border-border shadow-2xl rounded-xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-muted relative overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1 }}
                className="absolute inset-y-0 left-0 bg-primary"
              />
            </div>

            <div className="p-4 flex items-center gap-4">
              {/* Success icon */}
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-success" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Trip confirmed</p>
                <p className="text-sm text-muted-foreground truncate">
                  {tripDestination} — awaiting approval
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  className="gap-1.5 text-warning hover:text-warning hover:border-warning/50"
                >
                  <Undo2 className="w-4 h-4" />
                  Undo ({countdown}s)
                </Button>
                <button
                  onClick={onDismiss}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface UseUndoConfirmationOptions {
  onUndo: () => void;
  onTimeout: () => void;
  duration?: number;
}

export function useUndoConfirmation({
  onUndo,
  onTimeout,
  duration = 10,
}: UseUndoConfirmationOptions) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(duration);
  const [tripDestination, setTripDestination] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const show = (destination: string) => {
    clearTimers();
    setTripDestination(destination);
    setCountdown(duration);
    setVisible(true);

    // Countdown
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimers();
          setVisible(false);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timeout
    timerRef.current = setTimeout(() => {
      clearTimers();
      setVisible(false);
    }, duration * 1000);
  };

  const handleUndo = () => {
    clearTimers();
    setVisible(false);
    onUndo();
  };

  const handleDismiss = () => {
    clearTimers();
    setVisible(false);
    onTimeout();
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return {
    visible,
    countdown,
    tripDestination,
    show,
    handleUndo,
    handleDismiss,
  };
}