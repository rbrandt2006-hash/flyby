import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Loader2, Mail } from 'lucide-react';
import { getGoogleStatus, getGoogleAuthUrl } from '@/services/googleCalendar';
import { getOutlookStatus, getOutlookAuthUrl } from '@/services/outlookCalendar';
import {
  connectCalendar, connectedAccount, connectedProvider, disconnectCalendar,
  type CalendarProvider,
} from '@/services/calendarSync';
import { toast } from 'sonner';

/**
 * Connect the one calendar Flyby watches.
 *
 * One at a time, deliberately. Two connected calendars would surface the same
 * meeting twice under different ids — two trips to book, two itineraries to
 * keep in step — so connecting one releases the other rather than stacking.
 * Once a calendar is connected this shows only that calendar; the other
 * provider is offered again after disconnecting.
 */

interface CalendarSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

/**
 * Whether a provider can be connected right now.
 *
 * 'offline' means we never reached the backend to ask. It is deliberately not
 * folded into 'soon': a server that is down would otherwise be presented as a
 * feature that was never built, and the real fix wouldn't be discoverable.
 */
type Availability = 'unknown' | 'offline' | 'ready' | 'soon';

const PROVIDER_NAME: Record<Exclude<CalendarProvider, null>, string> = {
  google: 'Google Calendar',
  outlook: 'Microsoft Outlook',
};

export function CalendarSyncDialog({ open, onOpenChange, onConnected }: CalendarSyncDialogProps) {
  const [isConnecting, setIsConnecting] = useState<CalendarProvider>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  // Whether each provider's credentials are configured on the backend. Until
  // they are, connecting is genuinely unavailable — this used to simulate a
  // successful connection, which made the app act as though a calendar were
  // attached when none was.
  const [googleAvailable, setGoogleAvailable] = useState<Availability>('unknown');
  const [outlookAvailable, setOutlookAvailable] = useState<Availability>('unknown');
  const [provider, setProvider] = useState<CalendarProvider>(connectedProvider());

  const checkAvailability = useCallback(async () => {
    const read = (st: { configured: boolean; reachable: boolean }): Availability =>
      !st.reachable ? 'offline' : st.configured ? 'ready' : 'soon';
    const [google, outlook] = await Promise.all([getGoogleStatus(), getOutlookStatus()]);
    setGoogleAvailable(read(google));
    setOutlookAvailable(read(outlook));
  }, []);

  useEffect(() => {
    if (!open) return;
    void checkAvailability();
    setProvider(connectedProvider());
  }, [open, checkAvailability]);

  const handleConnect = useCallback(async (target: Exclude<CalendarProvider, null>) => {
    const available = target === 'google' ? googleAvailable : outlookAvailable;
    if (available === 'offline') {
      toast.error("Can't reach the Flyby server. Check it's running, then try again.");
      void checkAvailability();
      return;
    }
    if (available === 'soon') {
      toast.info(`${PROVIDER_NAME[target]} sync is coming soon.`);
      return;
    }
    setIsConnecting(target);
    try {
      // Real OAuth — the provider's own consent screen. The client secret stays
      // on the backend and Flyby never handles the traveler's password.
      const { authUrl } = target === 'google'
        ? await getGoogleAuthUrl()
        : await getOutlookAuthUrl();
      if (!authUrl) {
        toast.error(`Could not start ${PROVIDER_NAME[target]} sign-in. Please try again.`);
        return;
      }
      // Release the slot before leaving the page, so returning from consent
      // can't land us holding tokens for two calendars at once.
      connectCalendar(target);
      window.location.href = authUrl;
    } catch {
      toast.error('Failed to connect calendar');
    } finally {
      setIsConnecting(null);
    }
  }, [googleAvailable, outlookAvailable, checkAvailability]);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      disconnectCalendar();
      setProvider(null);
      toast.success('Calendar disconnected');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sync Work Calendar
          </DialogTitle>
          <DialogDescription>
            {provider
              ? 'Flyby is watching this calendar for meetings that need travel booked.'
              : 'Connect one calendar and Flyby will spot meetings that need travel booked. You can switch calendars at any time.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {provider ? (
            <>
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{PROVIDER_NAME[provider]} connected</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {connectedAccount() ?? 'Signed in'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Flyby syncs one calendar at a time. Disconnect this one to switch to{' '}
                {provider === 'outlook' ? 'Google Calendar' : 'Microsoft Outlook'}.
              </p>
            </>
          ) : (
            <>
              <ProviderButton
                provider="google"
                available={googleAvailable}
                connecting={isConnecting === 'google'}
                onClick={() => handleConnect('google')}
              />
              <ProviderButton
                provider="outlook"
                available={outlookAvailable}
                connecting={isConnecting === 'outlook'}
                onClick={() => handleConnect('outlook')}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProviderButton({
  provider, available, connecting, onClick,
}: {
  provider: Exclude<CalendarProvider, null>;
  available: Availability;
  connecting: boolean;
  onClick: () => void;
}) {
  const offline = available === 'offline';
  const unavailable = available === 'soon' || offline;
  return (
    <Button
      variant="outline"
      className={`w-full justify-start h-auto py-4 px-4 ${unavailable ? 'opacity-60' : ''}`}
      onClick={onClick}
      disabled={connecting}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center">
          {provider === 'google' ? <GoogleMark /> : <OutlookMark />}
        </div>
        <div className="text-left">
          <p className="font-medium">
            Connect {PROVIDER_NAME[provider]}
            {unavailable && (
              <span className="ml-2 text-[10px] uppercase tracking-wide rounded-full border border-border px-1.5 py-0.5 text-muted-foreground align-middle">
                {offline ? 'Server offline' : 'Coming soon'}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {offline
              ? "Can't reach the Flyby server — tap to retry"
              : unavailable
                ? 'Not available yet'
                : `Sync meetings from your ${provider === 'google' ? 'Google' : 'Outlook'} account`}
          </p>
        </div>
      </div>
      {connecting && <Loader2 className="w-4 h-4 ml-auto animate-spin" />}
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function OutlookMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.362.228-.61.228h-8.217V6.583h8.217c.248 0 .452.076.61.228.158.152.238.345.238.576zM9.75 2.012l-8.5 1.5a.938.938 0 0 0-.75.92v15.136c0 .46.33.856.75.92l8.5 1.5c.47.083.875-.287.875-.78V2.792c0-.493-.405-.863-.875-.78z"/>
      <path fill="#0078D4" d="M14.935 6.583v11.834H24V6.583h-9.065z"/>
      <path fill="#fff" d="M6.5 8.5c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5S10 13.933 10 12s-1.567-3.5-3.5-3.5zm0 5.5c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"/>
    </svg>
  );
}
