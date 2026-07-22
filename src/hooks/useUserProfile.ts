import { useState, useEffect, useCallback } from "react";
import { backend, isUnauthenticated } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";

const guestProfile: UserProfile = {
  id: "guest-profile",
  user_id: "guest-user-id",
  email: "guest@flyby.app",
  full_name: "Guest User",
  avatar_url: null,
  job_title: "Travel Manager",
  phone: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  company_id: null,
  theme_preference: null,
};

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
  const { user, isGuest } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (isGuest) {
      setProfile(guestProfile);
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await backend
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      // Signed out or browsing as a guest: there is no profile to load, and
      // that is not an error worth surfacing.
      if (!isUnauthenticated(err)) {
        console.error("Error fetching profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isGuest]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Subscribe to live profile updates.
  // Guests have a placeholder user id but no backend session, so there is
  // nothing to watch — subscribing would poll a protected table on a loop.
  useEffect(() => {
    if (isGuest || !user?.id) return;

    const channel = backend
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
      backend.removeChannel(channel);
    };
  }, [user?.id, isGuest]);

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
