import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
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
import { Check, Calendar, Mail, MessageSquare, Users, Clock, Cloud, Briefcase, RefreshCw } from "lucide-react";
import { getGoogleStatus, getGoogleAuthUrl } from "@/services/googleCalendar";
import { getOutlookStatus, getOutlookAuthUrl } from "@/services/outlookCalendar";
import {
  connectCalendar, connectedAccount, connectedProvider, disconnectCalendar,
  type CalendarProvider,
} from "@/services/calendarSync";
import { toast } from "sonner";

/**
 * Connected services.
 *
 * The calendar is a single slot: Flyby watches one calendar, so connecting
 * Outlook releases Google and vice versa. Showing both as independently
 * connectable was what let the app claim Outlook was connected while still
 * asking for Google.
 */

type StubId = "slack" | "teams" | "salesforce" | "workday";

const stubIntegrations: {
  id: StubId;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}[] = [
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
  {
    id: "salesforce",
    name: "Salesforce CRM",
    description: "Sync client accounts and link trips to opportunities",
    icon: <Cloud className="w-5 h-5 text-sky-600" />,
    iconBg: "bg-sky-50 dark:bg-sky-950/30",
  },
  {
    id: "workday",
    name: "Workday HRIS",
    description: "Auto-provision new hires and sync travel profiles from your HR system",
    icon: <Briefcase className="w-5 h-5 text-orange-600" />,
    iconBg: "bg-orange-50 dark:bg-orange-950/30",
  },
];

type Provider = Exclude<CalendarProvider, null>;

const CALENDARS: {
  id: Provider;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}[] = [
  {
    id: "google",
    name: "Google Calendar",
    description: "Sync travel events with your calendar",
    icon: <Calendar className="w-5 h-5 text-red-600" />,
    iconBg: "bg-red-50 dark:bg-red-950/30",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Sync travel events with your Outlook calendar",
    icon: <Mail className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
  },
];

export function IntegrationsSettings() {
  const [provider, setProvider] = useState<CalendarProvider>(() => connectedProvider());
  const [account, setAccount] = useState<string | null>(() => connectedAccount());
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  // The connection can change from the calendar dialog or an OAuth return, so
  // keep this page honest rather than trusting the value it mounted with.
  useEffect(() => {
    const sync = () => {
      const current = connectedProvider();
      setProvider((previous) => (previous === current ? previous : current));
      setAccount(connectedAccount());
    };
    const id = setInterval(sync, 1000);
    window.addEventListener("focus", sync);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // Whether each provider's credentials are configured on the backend. Until
  // they are, the integration is genuinely unavailable and says "Coming soon"
  // rather than opening a consent screen that can't lead anywhere.
  // "unknown" until we hear back, "offline" when we never did. Offline must not
  // be shown as "coming soon" — a backend that is merely down would look like a
  // feature that doesn't exist, and the fix (start the server) wouldn't be
  // discoverable from the UI.
  type Availability = "unknown" | "offline" | "ready" | "soon";
  const [available, setAvailable] = useState<Record<Provider, Availability>>({
    google: "unknown",
    outlook: "unknown",
  });

  const checkAvailability = useCallback(async () => {
    const read = (st: { configured: boolean; reachable: boolean }): Availability =>
      !st.reachable ? "offline" : st.configured ? "ready" : "soon";
    const [google, outlook] = await Promise.all([getGoogleStatus(), getOutlookStatus()]);
    setAvailable({ google: read(google), outlook: read(outlook) });
  }, []);

  useEffect(() => {
    void checkAvailability();
    // Checking only on mount meant a backend that came up later stayed "offline"
    // until a full page reload. Re-check when the traveler returns to the tab.
    const onFocus = () => void checkAvailability();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkAvailability]);

  const handleConnect = useCallback(async (target: Provider) => {
    // Real OAuth — the provider's own consent screen. The client secret stays
    // on the backend and Flyby never handles the traveler's password.
    const { authUrl } = target === "google"
      ? await getGoogleAuthUrl()
      : await getOutlookAuthUrl();
    if (!authUrl) {
      toast.error("Could not start sign-in. Please try again.");
      return;
    }
    // Release the slot before leaving the page, so coming back from consent
    // can't leave us holding tokens for two calendars at once.
    connectCalendar(target);
    window.location.href = authUrl;
  }, []);

  const handleConfirmDisconnect = useCallback(() => {
    const name = provider ? CALENDARS.find((c) => c.id === provider)?.name : "Calendar";
    disconnectCalendar();
    setProvider(null);
    setAccount(null);
    setDisconnectOpen(false);
    toast.success(`${name} disconnected`);
  }, [provider]);

  const connectedName = provider
    ? CALENDARS.find((c) => c.id === provider)?.name ?? "Calendar"
    : null;

  return (
    <div className="space-y-3">
      {/* Calendar — one connected at a time */}
      {CALENDARS.map((calendar) => {
        const isConnected = provider === calendar.id;
        const heldByOther = provider !== null && !isConnected;
        const state = available[calendar.id];
        const comingSoon = state === "soon";
        const offline = state === "offline";

        return (
          <motion.div
            key={calendar.id}
            layout
            className={cn(
              "flex items-center justify-between p-4 border rounded-xl transition-colors",
              heldByOther ? "opacity-60" : "hover:bg-secondary/30",
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", calendar.iconBg)}>
                {calendar.icon}
              </div>
              <div>
                <p className="font-medium">{calendar.name}</p>
                <p className="text-sm text-muted-foreground">
                  {isConnected
                    ? account ?? "Connected"
                    : heldByOther
                      ? `Disconnect ${connectedName} to switch — Flyby syncs one calendar at a time.`
                      : offline
                        ? "Can't reach the Flyby server — check it's running, then retry."
                        : comingSoon
                          ? "Not available yet"
                          : calendar.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
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
              ) : offline ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl min-w-[110px] gap-1"
                  onClick={() => void checkAvailability()}
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              ) : comingSoon ? (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Coming soon
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl min-w-[110px]"
                  onClick={() => handleConnect(calendar.id)}
                  disabled={state === "unknown" || heldByOther}
                >
                  Connect
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}

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

      {/* Disconnect confirmation */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disconnect {connectedName}?</DialogTitle>
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
