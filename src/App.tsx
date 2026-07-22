import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import AppLayout from "@/components/layout/AppLayout";
import { useUserRole } from "@/hooks/useUserRole";
import GetStarted from "./pages/GetStarted";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import Team from "./pages/Team";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import IntegrationManage from "./pages/IntegrationManage";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

function needsOnboarding(): boolean {
  try {
    return localStorage.getItem("flyby_pending_onboarding") === "true" &&
      localStorage.getItem("flyby_onboarding_complete") !== "true";
  } catch { return false; }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/**
 * Single parent layout route: mounted ONCE and kept across child navigations
 * (Trips ↔ Team ↔ Settings ↔ etc.). The child `<Outlet/>` swaps without
 * remounting `UserProfileProvider` or `AppLayout`, so the profile fetch and
 * intro logic don't re-run on every nav click.
 */
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/get-started" replace />;
  if (needsOnboarding()) return <Navigate to="/onboarding" replace />;

  return (
    <UserProfileProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </UserProfileProvider>
  );
}

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/get-started" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <UserProfileProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </UserProfileProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;

  // Resolve a safe same-origin ?next= path for post-auth redirect.
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  return (
    <Routes>
      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="/get-started" element={user ? <Navigate to={safeNext ?? "/"} replace /> : <GetStarted />} />
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/get-started" replace />} />
      <Route path="/auth" element={<Navigate to="/get-started" replace />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />
        <Route path="/team" element={<Team />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/integrations/:provider" element={<IntegrationManage />} />
        <Route path="/help" element={<Help />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ThemeProvider>
          <DemoModeProvider>
            {/* Opt in to the v7 behaviours now: state updates wrapped in
                startTransition, and splat-relative route resolution. Both match
                how this app already routes, so enabling them early keeps the
                eventual React Router 7 upgrade a no-op. */}
            <BrowserRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <AppRoutes />
            </BrowserRouter>
          </DemoModeProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
