import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, Loader2, Calendar, Mail, MessageSquare, Users, ShieldCheck, Eye, Clock } from "lucide-react";
import {
  connectGoogleCalendar,
  disconnectCalendar,
  isCalendarConnected,
  getConnectedEmail,
} from "@/services/mockCalendarService";
import { useUserProfileContext } from "@/contexts/UserProfileContext";
import flybyLogo from "@/assets/flyby-logo-icon.png";
import { toast } from "sonner";

type StubId = "outlook" | "slack" | "teams";

const stubIntegrations: {
  id: StubId;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}[] = [
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Email and calendar sync",
    icon: <Mail className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications in Slack",
    icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
    iconBg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Team collaboration and notifications",
    icon: <Users className="w-5 h-5 text-violet-600" />,
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
  },
];

export function IntegrationsSettings() {
  const navigate = useNavigate();
  const { profile } = useUserProfileContext();

  const [gcalConnected, setGcalConnected] = useState<boolean>(() => isCalendarConnected());
  const [gcalEmail, setGcalEmail] = useState<string | null>(() => getConnectedEmail());
  const [oauthOpen, setOauthOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  // Keep in sync if state changes elsewhere
  useEffect(() => {
    const id = setInterval(() => {
      const c = isCalendarConnected();
      if (c !== gcalConnected) {
        setGcalConnected(c);
        setGcalEmail(getConnectedEmail());
      }
    }, 1000);
    return () => clearInterval(id);
  }, [gcalConnected]);

  const handleAllow = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await connectGoogleCalendar(profile?.email);
      setGcalConnected(true);
      setGcalEmail(result.email);
      setOauthOpen(false);
      toast.success("Google Calendar connected");
      // Navigate to /trips so the user sees the detected events
      navigate("/trips");
    } catch {
      toast.error("Failed to connect calendar");
    } finally {
      setSyncing(false);
    }
  }, [profile?.email, navigate]);

  const handleConfirmDisconnect = useCallback(async () => {
    await disconnectCalendar();
    setGcalConnected(false);
    setGcalEmail(null);
    setDisconnectOpen(false);
    toast.success("Google Calendar disconnected");
  }, []);

  return (
    <div className="space-y-3">
      {/* Google Calendar — real-feeling OAuth flow */}
      <motion.div
        layout
        className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium">Google Calendar</p>
            <p className="text-sm text-muted-foreground">
              {gcalConnected ? gcalEmail : "Sync travel events with your calendar"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gcalConnected ? (
            <>
              <Badge
                variant="secondary"
                className="bg-success/10 text-success border-success/20 gap-1"
              >
                <Check className="w-3 h-3" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setDisconnectOpen(true)}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl min-w-[110px]"
              onClick={() => setOauthOpen(true)}
            >
              Connect
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stubbed integrations — Coming soon */}
      {stubIntegrations.map((integration) => (
        <motion.div
          key={integration.id}
          layout
          className="flex items-center justify-between p-4 border rounded-xl opacity-80"
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", integration.iconBg)}>
              {integration.icon}
            </div>
            <div>
              <p className="font-medium">{integration.name}</p>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Coming soon
          </Badge>
        </motion.div>
      ))}

      {/* Fake Google OAuth consent screen */}
      <Dialog open={oauthOpen} onOpenChange={(o) => !syncing && setOauthOpen(o)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <img src={flybyLogo} alt="Flyby" className="w-10 h-10 rounded-lg" />
              <div className="text-sm text-muted-foreground">→</div>
              <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            </div>

            <div>
              <DialogHeader className="space-y-1 p-0 text-left">
                <DialogTitle className="text-xl">Flyby wants to access your Google Calendar</DialogTitle>
                <DialogDescription>
                  Signed in as <span className="font-medium text-foreground">{profile?.email || "you@company.com"}</span>
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                This will allow Flyby to:
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 text-sm">
                  <Eye className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>Read events on your primary calendar for the next 90 days</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>Detect travel-related meetings to suggest trips</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You can review and revoke this access at any time in your Google Account settings.
            </p>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="ghost"
                onClick={() => setOauthOpen(false)}
                disabled={syncing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAllow}
                disabled={syncing}
                className="min-w-[120px]"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing your calendar...
                  </>
                ) : (
                  "Allow"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirmation */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disconnect Google Calendar?</DialogTitle>
            <DialogDescription>
              Disconnecting will stop Flyby from detecting upcoming trips. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setDisconnectOpen(false)}>
              Keep connected
            </Button>
            <Button variant="destructive" onClick={handleConfirmDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
