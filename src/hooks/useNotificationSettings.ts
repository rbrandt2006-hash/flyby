import { useState, useEffect, useCallback } from "react";
import { backend, isUnauthenticated } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NotificationSettings {
  notifyTripUpdates: boolean;
  notifyFlightDisruptions: boolean;
  notifyExpenseApprovals: boolean;
  notifyWeeklySummary: boolean;
  autoMatchExpenses: boolean;
}

const defaultSettings: NotificationSettings = {
  notifyTripUpdates: true,
  notifyFlightDisruptions: true,
  notifyExpenseApprovals: true,
  notifyWeeklySummary: true,
  autoMatchExpenses: true,
};

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await backend
        .from("profiles")
        .select(
          "notify_trip_updates, notify_flight_disruptions, notify_expense_approvals, notify_weekly_summary, auto_match_expenses"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setSettings({
          notifyTripUpdates: data.notify_trip_updates ?? true,
          notifyFlightDisruptions: data.notify_flight_disruptions ?? true,
          notifyExpenseApprovals: data.notify_expense_approvals ?? true,
          notifyWeeklySummary: data.notify_weekly_summary ?? true,
          autoMatchExpenses: data.auto_match_expenses ?? true,
        });
      }
    } catch (err: any) {
      // Signed out or browsing as a guest: the defaults already in state apply.
      if (!isUnauthenticated(err)) {
        console.error("Failed to fetch notification settings:", err);
        setError(err.message || "Failed to load notification settings");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Generic update function for any setting
  const updateSetting = useCallback(
    async <K extends keyof NotificationSettings>(
      key: K,
      value: NotificationSettings[K]
    ): Promise<boolean> => {
      if (!user) {
        toast.error("You must be logged in to change settings");
        return false;
      }

      // Optimistically update local state
      const previousSettings = { ...settings };
      setSettings((prev) => ({ ...prev, [key]: value }));
      setIsSaving(true);

      // Map camelCase to snake_case for database
      const dbKeyMap: Record<keyof NotificationSettings, string> = {
        notifyTripUpdates: "notify_trip_updates",
        notifyFlightDisruptions: "notify_flight_disruptions",
        notifyExpenseApprovals: "notify_expense_approvals",
        notifyWeeklySummary: "notify_weekly_summary",
        autoMatchExpenses: "auto_match_expenses",
      };

      try {
        const { error: updateError } = await backend
          .from("profiles")
          .update({ [dbKeyMap[key]]: value, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err: any) {
        console.error("Failed to update setting:", err);
        // Revert on failure
        setSettings(previousSettings);
        toast.error("Failed to save setting. Please try again.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, settings]
  );

  // Convenience functions for each setting
  const toggleTripUpdates = useCallback(
    (value: boolean) => updateSetting("notifyTripUpdates", value),
    [updateSetting]
  );

  const toggleFlightDisruptions = useCallback(
    (value: boolean) => updateSetting("notifyFlightDisruptions", value),
    [updateSetting]
  );

  const toggleExpenseApprovals = useCallback(
    (value: boolean) => updateSetting("notifyExpenseApprovals", value),
    [updateSetting]
  );

  const toggleWeeklySummary = useCallback(
    (value: boolean) => updateSetting("notifyWeeklySummary", value),
    [updateSetting]
  );

  const toggleAutoMatchExpenses = useCallback(
    (value: boolean) => updateSetting("autoMatchExpenses", value),
    [updateSetting]
  );

  return {
    settings,
    isLoading,
    isSaving,
    error,
    refetch: fetchSettings,
    toggleTripUpdates,
    toggleFlightDisruptions,
    toggleExpenseApprovals,
    toggleWeeklySummary,
    toggleAutoMatchExpenses,
  };
}
