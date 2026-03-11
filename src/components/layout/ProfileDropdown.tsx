import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfileContext } from "@/contexts/UserProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  User,
  Settings,
  Shield,
  CreditCard,
  Building2,
  LogOut,
  Users,
  Loader2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { SwitchWorkspaceModal } from "./SwitchWorkspaceModal";
import { cn } from "@/lib/utils";

export function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfileContext();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/get-started");
    } catch (error) {
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavigateToSection = (section: string) => {
    navigate(`/settings#${section}`);
    // Scroll to section after navigation
    setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "User";
  const displayEmail = user?.email || "";
  const displayRole = profile?.job_title || user?.user_metadata?.role || "Team Member";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-secondary/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                initials || displayEmail.charAt(0).toUpperCase()
              )}
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 bg-popover border border-border shadow-lg"
          sideOffset={8}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  initials || displayEmail.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                  {displayRole}
                </span>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Theme
            </p>
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  title={label}
                  className={cn(
                    "flex-1 p-2 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    theme === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Section */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem 
              className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5"
              onClick={() => handleNavigateToSection("profile")}
            >
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5"
              onClick={() => handleNavigateToSection("profile")}
            >
              <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5"
              onClick={() => handleNavigateToSection("security")}
            >
              <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Security & Privacy</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-border" />

          {/* Organization Section */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Organization
            </DropdownMenuLabel>
            {isAdmin && (
              <>
                <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5">
                  <Link to="/admin" className="flex items-center">
                    <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5">
                  <Link to="/team" className="flex items-center">
                    <Users className="w-4 h-4 mr-3 text-muted-foreground" />
                    <span>Team Management</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5"
                  onClick={() => handleNavigateToSection("integrations")}
                >
                  <CreditCard className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span>Billing & Plan</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem 
              className="px-4 py-2.5 cursor-pointer focus:bg-primary/5 data-[highlighted]:bg-primary/5"
              onClick={() => setWorkspaceModalOpen(true)}
            >
              <Building2 className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Switch Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-border" />

          {/* Session Section */}
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="px-4 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 data-[highlighted]:bg-destructive/5 data-[highlighted]:text-destructive"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-3" />
              )}
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Workspace Switcher Modal */}
      <SwitchWorkspaceModal 
        open={workspaceModalOpen} 
        onOpenChange={setWorkspaceModalOpen} 
      />
    </>
  );
}
