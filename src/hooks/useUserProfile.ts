import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  phone: string | null;
  timezone: string | null;
  company_id: string | null;
  theme_preference: string | null;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const updateAvatarUrl = useCallback((newUrl: string | null) => {
    setProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : null));
  }, []);

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    updateAvatarUrl,
    refetch,
  };
}
