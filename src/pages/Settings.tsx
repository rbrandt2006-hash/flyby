import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
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
  MapPin,
  Clock,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  ChevronRight,
} from "lucide-react";

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
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <motion.div variants={itemVariants}>
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
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  defaultChecked?: boolean;
}

function ToggleRow({ label, description, defaultChecked = false }: ToggleRowProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || "User";
  const userEmail = user?.email || "user@company.com";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Profile & Account */}
      <SettingsSection icon={User} title="Profile & Account" description="Your personal information">
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
        <div className="pt-2">
          <Button className="rounded-xl">Save changes</Button>
        </div>
      </SettingsSection>

      {/* Company & Organization */}
      <SettingsSection icon={Building2} title="Company & Organization">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Acme Corporation</p>
              <p className="text-sm text-muted-foreground">Enterprise Plan</p>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <Separator />
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
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Travel Policy Summary</p>
            <div className="p-4 bg-secondary/30 rounded-xl text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>Economy class for flights under 6 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>Business class available for international</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>$250/night hotel limit (domestic)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>$75/day meal allowance</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Travel Preferences */}
      <SettingsSection icon={Plane} title="Travel Preferences" description="Customize your travel experience">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preferred Airlines</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-3 py-1">Delta</Badge>
              <Badge variant="outline" className="px-3 py-1">United</Badge>
              <Badge variant="outline" className="px-3 py-1">American</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">+ Add</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preferred Hotels</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-3 py-1">Marriott</Badge>
              <Badge variant="outline" className="px-3 py-1">Hilton</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">+ Add</Button>
            </div>
          </div>
        </div>
        <Separator />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Seat Preference</Label>
            <div className="flex gap-2">
              <Badge className="px-3 py-1">Window</Badge>
              <Badge variant="outline" className="px-3 py-1">Aisle</Badge>
              <Badge variant="outline" className="px-3 py-1">No preference</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Meal Preference</Label>
            <div className="flex gap-2">
              <Badge className="px-3 py-1">Standard</Badge>
              <Badge variant="outline" className="px-3 py-1">Vegetarian</Badge>
            </div>
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
      </SettingsSection>

      {/* Expenses & Payments */}
      <SettingsSection icon={CreditCard} title="Expenses & Payments">
        <div className="space-y-4">
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
            <Badge variant="success">Connected</Badge>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Reimbursement Method</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Direct Deposit</p>
                <p className="text-sm text-muted-foreground">Chase ••7890</p>
              </div>
            </div>
          </div>
          <Separator />
          <ToggleRow
            label="Auto-match expenses to trips"
            description="Automatically link expenses to associated trips"
            defaultChecked={true}
          />
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications" description="Choose what you want to be notified about">
        <div className="space-y-1">
          <ToggleRow label="Trip updates" description="Booking confirmations and changes" defaultChecked={true} />
          <Separator />
          <ToggleRow label="Flight disruptions" description="Delays, cancellations, and gate changes" defaultChecked={true} />
          <Separator />
          <ToggleRow label="Expense approvals" description="When expenses are approved or rejected" defaultChecked={true} />
          <Separator />
          <ToggleRow label="Team travel changes" description="Updates to team member travel plans" defaultChecked={false} />
          <Separator />
          <ToggleRow label="Weekly summary" description="Digest of your travel activity" defaultChecked={true} />
        </div>
      </SettingsSection>

      {/* Security & Privacy */}
      <SettingsSection icon={Shield} title="Security & Privacy">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" className="rounded-xl">Change password</Button>
          </div>
          <Separator />
          <ToggleRow
            label="Two-factor authentication"
            description="Add an extra layer of security"
            defaultChecked={true}
          />
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
                <Badge variant="success">Current</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">iPhone 15 Pro • Safari</p>
                    <p className="text-xs text-muted-foreground">New York, NY • 2 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-destructive">Revoke</Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Integrations */}
      <SettingsSection icon={Puzzle} title="Integrations" description="Connect your favorite tools">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">Sync travel events</p>
              </div>
            </div>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-lg">📧</span>
              </div>
              <div>
                <p className="font-medium">Outlook</p>
                <p className="text-sm text-muted-foreground">Email and calendar sync</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <p className="font-medium">Slack</p>
                <p className="text-sm text-muted-foreground">Get notifications in Slack</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <p className="font-medium">Microsoft Teams</p>
                <p className="text-sm text-muted-foreground">Team collaboration</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">Connect</Button>
          </div>
        </div>
      </SettingsSection>

      {/* Product & Support */}
      <SettingsSection icon={HelpCircle} title="Product & Support">
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
            <span className="font-medium">Help Center</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
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
    </motion.div>
  );
}