import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTravelPreferences } from "@/hooks/useTravelPreferences";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { TwoFactorSetupModal } from "@/components/settings/TwoFactorSetupModal";
import { AddPreferenceModal } from "@/components/settings/AddPreferenceModal";
import { ContactSupportModal } from "@/components/settings/ContactSupportModal";
import {
  User,
  Building2,
  Plane,
  CreditCard,
  Bell,
  Shield,
  Puzzle,
  HelpCircle,
  Camera,
  Mail,
  Phone,
  Clock,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  ChevronRight,
  ChevronDown,
  Settings2,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";

// Nav sections configuration
const navSections = [
  { id: "profile", label: "Profile & Account", icon: User },
  { id: "travel", label: "Travel Preferences", icon: Plane },
  { id: "security", label: "Security & Privacy", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "support", label: "Product & Support", icon: HelpCircle },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

interface SettingsSectionProps {
  id: string;
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function SettingsSection({ id, icon: Icon, title, description, children, isLoading, error, onRetry }: SettingsSectionProps) {
  return (
    <motion.div id={id} variants={itemVariants} className="scroll-mt-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-0.5">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-1/2" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="w-4 h-4" />
                <p className="font-medium text-sm">Couldn't load this section</p>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked = false, onCheckedChange, disabled = false }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

// Seat options
const seatOptions = [
  { value: "window", label: "Window" },
  { value: "aisle", label: "Aisle" },
  { value: "middle", label: "Middle" },
] as const;

// Meal options
const mealOptions = [
  { value: "standard", label: "Standard" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "kosher", label: "Kosher" },
  { value: "halal", label: "Halal" },
] as const;

// Integration data
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  connected: boolean;
  email?: string;
  lastSync?: string;
}

const integrations: Integration[] = [
  { id: "google-calendar", name: "Google Calendar", description: "Sync travel events", icon: "📅", color: "bg-red-500/10", connected: true, email: "john@acme.com", lastSync: "2 minutes ago" },
  { id: "outlook", name: "Outlook", description: "Email and calendar sync", icon: "📧", color: "bg-blue-500/10", connected: false },
  { id: "slack", name: "Slack", description: "Get notifications in Slack", icon: "💬", color: "bg-purple-500/10", connected: true, email: "acme-workspace", lastSync: "5 minutes ago" },
  { id: "teams", name: "Microsoft Teams", description: "Team collaboration", icon: "👥", color: "bg-violet-500/10", connected: false },
];

export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Modals
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [addPreferenceOpen, setAddPreferenceOpen] = useState(false);
  const [addPreferenceType, setAddPreferenceType] = useState<"airline" | "hotel" | "custom">("airline");
  const [contactSupportOpen, setContactSupportOpen] = useState(false);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Travel preferences
  const {
    preferences,
    isLoading: prefsLoading,
    isSaving: prefsSaving,
    updateSeatPreference,
    updateMealPreference,
    addAirline,
    removeAirline,
    addHotelBrand,
    removeHotelBrand,
    addCustomPreference,
    removeCustomPreference,
  } = useTravelPreferences();
  
  const userName = user?.user_metadata?.full_name || "User";
  const userEmail = user?.email || "user@company.com";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  // Handle hash navigation
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && navSections.some(s => s.id === hash)) {
      setActiveSection(hash);
      // Scroll to section after a brief delay
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileNavOpen(false);
    navigate(`/settings#${sectionId}`, { replace: true });
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    toast.success("Profile saved");
  };

  const handleManageIntegration = (integrationId: string) => {
    navigate(`/settings/integrations/${integrationId}`);
  };

  const handleConnectIntegration = (integration: Integration) => {
    toast.info(`Connecting to ${integration.name}...`);
  };

  const handleOpenAddPreference = (type: "airline" | "hotel" | "custom") => {
    setAddPreferenceType(type);
    setAddPreferenceOpen(true);
  };

  const handleAddPreference = (value: string) => {
    if (addPreferenceType === "airline") {
      addAirline(value);
    } else if (addPreferenceType === "hotel") {
      addHotelBrand(value);
    } else {
      addCustomPreference(value);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto pb-20 md:pb-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Mobile Nav Dropdown */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="w-full flex items-center justify-between p-4 bg-card border rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">
              {navSections.find(s => s.id === activeSection)?.label}
            </span>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            mobileNavOpen && "rotate-180"
          )} />
        </button>
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 bg-card border rounded-xl overflow-hidden"
            >
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors",
                    activeSection === section.id 
                      ? "bg-primary/5 text-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Left Nav - Desktop */}
        <motion.div 
          variants={itemVariants}
          className="hidden lg:block w-[280px] shrink-0"
        >
          <div className="sticky top-6 space-y-1">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNavClick(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  activeSection === section.id 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <section.icon className="w-5 h-5" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Right Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Profile & Account */}
          <SettingsSection 
            id="profile" 
            icon={User} 
            title="Profile & Account" 
            description="Your personal information"
            isLoading={isLoading}
          >
            <div className="flex items-center gap-4 pb-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{userName}</p>
                <p className="text-sm text-muted-foreground">Travel Manager</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 pt-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" defaultValue={userName} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input id="email" defaultValue={userEmail} className="h-11 rounded-xl pl-10" disabled />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Input id="phone" placeholder="+1 (555) 000-0000" className="h-11 rounded-xl pl-10" />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time zone</Label>
                  <div className="relative">
                    <Input id="timezone" defaultValue="America/New_York (EST)" className="h-11 rounded-xl pl-10" disabled />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Acme Corporation</p>
                  <p className="text-sm text-muted-foreground">Enterprise Plan</p>
                </div>
                <Badge variant="secondary">Admin</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">Sales & Marketing</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manager</p>
                  <p className="font-medium">Sarah Johnson</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button className="rounded-xl" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </SettingsSection>

          {/* Travel Preferences */}
          <SettingsSection 
            id="travel" 
            icon={Plane} 
            title="Travel Preferences" 
            description="Customize your travel experience"
            isLoading={isLoading || prefsLoading}
          >
            {/* Preferred Airlines */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Airlines</Label>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredAirlines.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No airlines added</span>
                  ) : (
                    preferences.preferredAirlines.map((airline) => (
                      <Badge key={airline} variant="outline" className="px-3 py-1 gap-1">
                        {airline}
                        <button
                          onClick={() => removeAirline(airline)}
                          className="ml-1 hover:text-destructive"
                          disabled={prefsSaving}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => handleOpenAddPreference("airline")}
                    disabled={prefsSaving}
                  >
                    + Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Hotels</Label>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredHotelBrands.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No hotels added</span>
                  ) : (
                    preferences.preferredHotelBrands.map((brand) => (
                      <Badge key={brand} variant="outline" className="px-3 py-1 gap-1">
                        {brand}
                        <button
                          onClick={() => removeHotelBrand(brand)}
                          className="ml-1 hover:text-destructive"
                          disabled={prefsSaving}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => handleOpenAddPreference("hotel")}
                    disabled={prefsSaving}
                  >
                    + Add
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Seat & Meal Preferences */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seat Preference</Label>
                <div className="flex gap-2 flex-wrap">
                  {seatOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={preferences.preferredSeat === option.value ? "default" : "outline"}
                      className={cn(
                        "px-3 py-1 cursor-pointer transition-all",
                        preferences.preferredSeat === option.value 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-secondary"
                      )}
                      onClick={() => updateSeatPreference(option.value)}
                    >
                      {preferences.preferredSeat === option.value && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Meal Preference</Label>
                <div className="flex gap-2 flex-wrap">
                  {mealOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={preferences.mealPreference === option.value ? "default" : "outline"}
                      className={cn(
                        "px-3 py-1 cursor-pointer transition-all",
                        preferences.mealPreference === option.value 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-secondary"
                      )}
                      onClick={() => updateMealPreference(option.value)}
                    >
                      {preferences.mealPreference === option.value && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <Separator />

            {/* Custom Preferences */}
            <div className="space-y-2">
              <Label>Custom Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {preferences.customPreferences.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No custom preferences</span>
                ) : (
                  preferences.customPreferences.map((pref) => (
                    <Badge key={pref} variant="outline" className="px-3 py-1 gap-1">
                      {pref}
                      <button
                        onClick={() => removeCustomPreference(pref)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => handleOpenAddPreference("custom")}
                >
                  + Add
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Loyalty Programs</Label>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-sm font-medium">Delta SkyMiles</p>
                  <p className="text-xs text-muted-foreground">Gold Medallion</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-xl">
                  <p className="text-sm font-medium">Marriott Bonvoy</p>
                  <p className="text-xs text-muted-foreground">Platinum Elite</p>
                </div>
                <div className="p-3 border border-dashed border-border rounded-xl flex items-center justify-center">
                  <Button variant="ghost" size="sm" className="text-xs">+ Add program</Button>
                </div>
              </div>
            </div>

            {/* Expenses & Payments */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Expenses & Payments
              </h4>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Corporate Amex</p>
                    <p className="text-sm text-muted-foreground">•••• 4521</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Connected</Badge>
              </div>
              <ToggleRow
                label="Auto-match expenses to trips"
                description="Automatically link expenses to associated trips"
                checked={true}
              />
            </div>

            {/* Notifications */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h4>
              <div className="space-y-1">
                <ToggleRow label="Trip updates" description="Booking confirmations and changes" checked={true} />
                <Separator />
                <ToggleRow label="Flight disruptions" description="Delays, cancellations, and gate changes" checked={true} />
                <Separator />
                <ToggleRow label="Expense approvals" description="When expenses are approved or rejected" checked={true} />
                <Separator />
                <ToggleRow label="Weekly summary" description="Digest of your travel activity" checked={true} />
              </div>
            </div>
          </SettingsSection>

          {/* Security & Privacy */}
          <SettingsSection 
            id="security" 
            icon={Shield} 
            title="Security & Privacy"
            isLoading={isLoading}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  Change password
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Two-factor authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <div className="flex items-center gap-3">
                  {is2FAEnabled && (
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      Enabled
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setTwoFactorOpen(true)}
                  >
                    {is2FAEnabled ? "Manage" : "Enable"}
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-3">Active Sessions</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Laptop className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">MacBook Pro • Chrome</p>
                        <p className="text-xs text-muted-foreground">New York, NY • Active now</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Current</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">iPhone 15 Pro • Safari</p>
                        <p className="text-xs text-muted-foreground">New York, NY • 2 hours ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">Revoke</Button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Integrations */}
          <SettingsSection 
            id="integrations" 
            icon={Puzzle} 
            title="Integrations" 
            description="Connect your favorite tools"
            isLoading={isLoading}
          >
            {integrations.every(i => !i.connected) ? (
              <div className="p-6 text-center border border-dashed rounded-xl">
                <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">No integrations connected</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect tools to sync travel, messages, and calendars.
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm">Connect Slack</Button>
                  <Button variant="outline" size="sm">Connect Calendar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div 
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", integration.color)}>
                        <span className="text-lg">{integration.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.connected ? integration.email : integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.connected ? (
                        <>
                          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Connected</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={() => handleManageIntegration(integration.id)}
                          >
                            Manage
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl"
                          onClick={() => handleConnectIntegration(integration)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SettingsSection>

          {/* Product & Support */}
          <SettingsSection 
            id="support" 
            icon={HelpCircle} 
            title="Product & Support"
            isLoading={isLoading}
          >
            <div className="space-y-2">
              <button 
                onClick={() => navigate("/help")}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors"
              >
                <span className="font-medium">Help Center</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => setContactSupportOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors"
              >
                <span className="font-medium">Contact Support</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                <span className="font-medium">Take Product Tour</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <Separator />
              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground">App Version</span>
                <span className="font-mono text-sm">1.0.0</span>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        open={changePasswordOpen} 
        onOpenChange={setChangePasswordOpen} 
      />
      
      <TwoFactorSetupModal 
        open={twoFactorOpen} 
        onOpenChange={setTwoFactorOpen}
        isEnabled={is2FAEnabled}
        onToggle={setIs2FAEnabled}
      />
      
      <AddPreferenceModal
        open={addPreferenceOpen}
        onOpenChange={setAddPreferenceOpen}
        type={addPreferenceType}
        onAdd={handleAddPreference}
        isLoading={prefsSaving}
      />
      
      <ContactSupportModal
        open={contactSupportOpen}
        onOpenChange={setContactSupportOpen}
      />
    </motion.div>
  );
}
