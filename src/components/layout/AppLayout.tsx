import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import IntroAnimation, { hasIntroPlayed, prefersReducedMotion } from "@/components/home/IntroAnimation";
import { GlobalSearchDropdown } from "./GlobalSearchDropdown";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useUserRole } from "@/hooks/useUserRole";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { Switch } from "@/components/ui/switch";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Trips", path: "/trips" },
  { label: "Team", path: "/team" },
  { label: "Expenses", path: "/expenses" },
  { label: "Settings", path: "/settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { demoMode, toggleDemoMode } = useDemoMode();
  useSessionTimeout({ isAdmin });

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return !hasIntroPlayed() && !prefersReducedMotion();
  });
  const [contentReady, setContentReady] = useState(() => {
    if (typeof window === "undefined") return true;
    return hasIntroPlayed() || prefersReducedMotion();
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    setContentReady(true);
  };

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Navigation */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : -20 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
        >
          <div className="max-w-[90rem] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo */}
              <Link to="/" className="flex items-center shrink-0">
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  alt="FlyBy"
                  className="h-10 w-auto shrink-0"
                  src="/lovable-uploads/eb656c8d-2d9c-4190-9b5e-fa90371682e7.png"
                />
              </Link>

              {/* Center: Pill-style navigation */}
              <nav className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-1.5 py-1.5 border border-border/40">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNavPill"
                            className="absolute inset-0 bg-primary rounded-full shadow-sm"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Right: Demo toggle + Search */}
              <div className="flex items-center gap-3 shrink-0">
                <label
                  className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none"
                  title="Toggle demo data on or off"
                >
                  <span className="uppercase tracking-wider">
                    Demo data: {demoMode ? "ON" : "OFF"}
                  </span>
                  <Switch checked={demoMode} onCheckedChange={toggleDemoMode} aria-label="Toggle demo data" />
                </label>
                <div className="hidden lg:block">
                  <GlobalSearchDropdown />
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 8 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 w-full max-w-[90rem] mx-auto px-6 lg:px-10 py-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 flex justify-around py-2 px-4 z-50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute inset-0 bg-secondary/50 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="text-xs font-medium relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
