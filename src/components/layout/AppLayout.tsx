import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IntroAnimation, { hasIntroPlayed, prefersReducedMotion } from "@/components/home/IntroAnimation";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Trips", path: "/trips" },
  { label: "Team", path: "/team" },
  { label: "Chats", path: "/chats" },
  { label: "Expenses", path: "/expenses" },
  { label: "Settings", path: "/settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Intro animation state - only show on initial app load
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return !hasIntroPlayed() && !prefersReducedMotion();
  });
  const [contentReady, setContentReady] = useState(() => {
    if (typeof window === "undefined") return true;
    return hasIntroPlayed() || prefersReducedMotion();
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setContentReady(true);
  };

  return (
    <>
      {/* Intro animation - only on first load */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <div className="min-h-screen bg-background flex flex-col">
        {/* Apple-style Top Navigation */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : -20 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
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

              {/* Center Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "relative px-5 py-2.5 text-base font-medium transition-colors duration-200",
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                      {/* Animated underline indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Right side: Search, Notifications, User */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors duration-200 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Search</span>
                  <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background/80 rounded border border-border/50">
                    ⌘K
                  </kbd>
                </motion.div>

                {/* Notifications */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-full">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                  </Button>
                </motion.div>

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-secondary/50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user?.user_metadata?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main content with page transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 8 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-8 py-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 flex justify-around py-2 px-4 z-50">
          {navItems.slice(0, 4).map((item) => {
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
