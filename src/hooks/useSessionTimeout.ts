import { useEffect, useRef, useCallback } from "react";
import { backend } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STANDARD_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ADMIN_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes for admins
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warn 2 min before

interface UseSessionTimeoutOptions {
  isAdmin?: boolean;
}

export function useSessionTimeout({ isAdmin = false }: UseSessionTimeoutOptions = {}) {
  const { user } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();

  const timeoutMs = isAdmin ? ADMIN_TIMEOUT_MS : STANDARD_TIMEOUT_MS;

  const handleSignOut = useCallback(async () => {
    await backend.auth.signOut();
    toast.error("Session expired due to inactivity. Please sign in again.");
  }, []);

  const resetTimers = useCallback(() => {
    if (!user) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    warningRef.current = setTimeout(() => {
      toast.warning("Your session will expire in 2 minutes due to inactivity.", {
        duration: 10000,
      });
    }, timeoutMs - WARNING_BEFORE_MS);

    timeoutRef.current = setTimeout(handleSignOut, timeoutMs);
  }, [user, timeoutMs, handleSignOut]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => resetTimers();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimers]);
}
