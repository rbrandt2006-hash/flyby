import { useState, useEffect, useCallback } from "react";
import { getCachedPermissions, clearPermissionCache, checkPermission } from "@/services/authorizationService";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for checking user permissions in components.
 * Caches permissions for the session and provides helpers.
 */
export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    getCachedPermissions()
      .then(setPermissions)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  const refresh = useCallback(async () => {
    clearPermissionCache();
    setLoading(true);
    const perms = await getCachedPermissions();
    setPermissions(perms);
    setLoading(false);
  }, []);

  return {
    permissions,
    loading,
    hasPermission,
    refresh,
    // Convenience checks
    canCreateTrip: hasPermission("trip.create"),
    canApproveExpenses: hasPermission("expense.approve"),
    canManageUsers: hasPermission("user.manage"),
    canExportReports: hasPermission("report.generate"),
    canManageTenant: hasPermission("tenant.settings"),
    canViewAudit: hasPermission("audit.view"),
  };
}
