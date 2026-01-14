import { createContext, useContext, ReactNode } from "react";
import { useUserProfile, UserProfile } from "@/hooks/useUserProfile";

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateAvatarUrl: (newUrl: string | null) => void;
  refetch: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const profileData = useUserProfile();

  return (
    <UserProfileContext.Provider value={profileData}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfileContext must be used within a UserProfileProvider");
  }
  return context;
}
