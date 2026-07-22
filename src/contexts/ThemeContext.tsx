import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { backend, isUnauthenticated } from "@/integrations/backend/client";
import { useAuth } from "@/contexts/AuthContext";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "flyby-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    // Load from localStorage immediately to prevent flash
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        return stored;
      }
    }
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme immediately on mount and when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      applyTheme(newResolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Load theme preference from database when user is logged in
  useEffect(() => {
    async function loadThemeFromDB() {
      // Guests have no stored profile, so the theme stays whatever the local
      // preference is rather than being fetched from a protected table.
      if (!user?.id || isGuest) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await backend
          .from("profiles")
          .select("theme_preference")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // Signed out or guest: the locally stored theme stays in effect.
          if (!isUnauthenticated(error)) {
            console.error("Error loading theme preference:", error);
          }
          setIsLoading(false);
          return;
        }

        if (data?.theme_preference && ["light", "dark", "system"].includes(data.theme_preference)) {
          const dbTheme = data.theme_preference as Theme;
          setThemeState(dbTheme);
          localStorage.setItem(STORAGE_KEY, dbTheme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadThemeFromDB();
  }, [user?.id, isGuest]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    // Update state and localStorage immediately
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    // Persist to the account, when there is one. A guest's choice stays local.
    if (user?.id && !isGuest) {
      try {
        await backend
          .from("profiles")
          .update({ theme_preference: newTheme })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  }, [user?.id, isGuest]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
