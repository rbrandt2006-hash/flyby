import { useState, useEffect, useCallback } from "react";
import { backend, isUnauthenticated } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

export function useUserRole() {
  const { user, isGuest } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    // A guest has no account behind it, so there is no role to look up. They
    // get the baseline role without a request that could only come back 401.
    if (isGuest) {
      setRole("user");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await backend
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Signed out or guest: fall back to the baseline role without noise.
        if (!isUnauthenticated(error)) {
          console.error("Error fetching user role:", error);
        }
        setRole("user"); // Default to user
      } else {
        setRole((data?.role as AppRole) || "user");
      }
    } catch {
      setRole("user");
    } finally {
      setLoading(false);
    }
  }, [user?.id, isGuest]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || role === "admin";

  const assignRole = useCallback(async (targetUserId: string, newRole: AppRole) => {
    const { error } = await backend
      .from("user_roles")
      .upsert(
        { user_id: targetUserId, role: newRole },
        { onConflict: "user_id,role" }
      );
    if (error) throw error;
  }, []);

  const removeRole = useCallback(async (targetUserId: string) => {
    const { error } = await backend
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);
    if (error) throw error;
  }, []);

  return { role, loading, isAdmin, isModerator, assignRole, removeRole, refetch: fetchRole };
}
