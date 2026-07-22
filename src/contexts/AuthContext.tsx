import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Session } from "@/integrations/backend/types";
import { backend } from "@/integrations/backend/client";

const GUEST_KEY = "flyby_guest_session";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signInAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Minimal fake user object for guest mode
const guestUser: User = {
  id: "guest-user-id",
  app_metadata: {},
  user_metadata: { full_name: "Guest User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "guest@flyby.app",
  role: "authenticated",
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const browsingAsGuest = localStorage.getItem(GUEST_KEY) === "true";

    // Guests get the placeholder user, but the listener is still attached below
    // so a token expiring or being revoked is handled rather than ignored.
    if (browsingAsGuest) {
      setUser(guestUser);
      setIsGuest(true);
      setLoading(false);
    }

    // Set up auth state listener
    const { data: { subscription } } = backend.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          // A real session always wins: signing in ends guest browsing.
          localStorage.removeItem(GUEST_KEY);
          setIsGuest(false);
          setSession(session);
          setUser(session.user);
        } else if (localStorage.getItem(GUEST_KEY) === "true") {
          setSession(null);
          setUser(guestUser);
          setIsGuest(true);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    if (!browsingAsGuest) {
      backend.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInAsGuest = () => {
    localStorage.setItem(GUEST_KEY, "true");
    // Choosing to browse as a guest means giving up any signed-in session.
    // Leaving one behind would let hooks keep calling the backend with
    // credentials the guest isn't supposed to be using.
    void backend.auth.signOut();
    setSession(null);
    setUser(guestUser);
    setIsGuest(true);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await backend.auth.signInWithPassword({ email, password });
    if (!error) {
      localStorage.removeItem(GUEST_KEY);
      setIsGuest(false);
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await backend.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    await backend.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signInAsGuest, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
