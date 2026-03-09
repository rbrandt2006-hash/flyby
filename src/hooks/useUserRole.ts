import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        setRole("user"); // Default to user
      } else {
        setRole((data?.role as AppRole) || "user");
      }
    } catch {
      setRole("user");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || role === "admin";

  const assignRole = useCallback(async (targetUserId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .upsert(
        { user_id: targetUserId, role: newRole },
        { onConflict: "user_id,role" }
      );
    if (error) throw error;
  }, []);

  const removeRole = useCallback(async (targetUserId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);
    if (error) throw error;
  }, []);

  return { role, loading, isAdmin, isModerator, assignRole, removeRole, refetch: fetchRole };
}
