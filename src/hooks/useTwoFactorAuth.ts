import { useState, useEffect, useCallback } from "react";
import { backend } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";

const GUEST_USER_ID = "guest-user-id";

interface TwoFactorStatus {
  enabled: boolean;
  maskedPhone: string | null;
  verifiedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useTwoFactorAuth() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus>({
    enabled: false,
    maskedPhone: null,
    verifiedAt: null,
    isLoading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    if (!user || user.id === GUEST_USER_ID) {
      setStatus({
        enabled: false,
        maskedPhone: null,
        verifiedAt: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const { data, error } = await backend.functions.invoke("twofa-status", {
        body: {},
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setStatus({
        enabled: data.enabled || false,
        maskedPhone: data.maskedPhone || null,
        verifiedAt: data.verifiedAt || null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to fetch 2FA status:", error);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch 2FA status",
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const updateStatus = useCallback((enabled: boolean, maskedPhone: string | null) => {
    setStatus((prev) => ({
      ...prev,
      enabled,
      maskedPhone,
      verifiedAt: enabled ? new Date().toISOString() : null,
    }));
  }, []);

  return {
    ...status,
    refetch: fetchStatus,
    updateStatus,
  };
}
