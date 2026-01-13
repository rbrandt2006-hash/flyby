import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check, Loader2, Calendar, Mail, MessageSquare, Users } from "lucide-react";

type ConnectionStatus = "not_connected" | "connecting" | "connected";

interface IntegrationState {
  status: ConnectionStatus;
  email?: string;
  lastSync?: string;
}

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  connectedEmail?: string;
}

const integrationConfigs: IntegrationConfig[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync travel events with your calendar",
    icon: <Calendar className="w-5 h-5 text-red-600" />,
    iconBg: "bg-red-50 dark:bg-red-950/30",
    connectedEmail: "john.doe@gmail.com",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Email and calendar sync",
    icon: <Mail className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    connectedEmail: "john.doe@outlook.com",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications in Slack",
    icon: <MessageSquare className="w-5 h-5 text-purple-600" />,
    iconBg: "bg-purple-50 dark:bg-purple-950/30",
    connectedEmail: "acme-workspace",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Team collaboration and notifications",
    icon: <Users className="w-5 h-5 text-violet-600" />,
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
    connectedEmail: "acme-team",
  },
];

// Load persisted state from localStorage
const loadPersistedStates = (): Record<string, IntegrationState> => {
  try {
    const saved = localStorage.getItem("integration_states");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
};

// Save state to localStorage
const persistStates = (states: Record<string, IntegrationState>) => {
  try {
    localStorage.setItem("integration_states", JSON.stringify(states));
  } catch {
    // Ignore storage errors
  }
};

export function IntegrationsSettings() {
  const navigate = useNavigate();
  const [integrationStates, setIntegrationStates] = useState<Record<string, IntegrationState>>(() => {
    const persisted = loadPersistedStates();
    // Initialize all integrations with persisted state or default to not_connected
    const initial: Record<string, IntegrationState> = {};
    integrationConfigs.forEach((config) => {
      initial[config.id] = persisted[config.id] || { status: "not_connected" };
    });
    return initial;
  });

  const handleConnect = useCallback((integrationId: string) => {
    // Set to connecting state
    setIntegrationStates((prev) => {
      const updated = {
        ...prev,
        [integrationId]: { status: "connecting" as ConnectionStatus },
      };
      persistStates(updated);
      return updated;
    });

    // Simulate connection delay (1-1.5 seconds)
    const delay = 1000 + Math.random() * 500;
    
    setTimeout(() => {
      const config = integrationConfigs.find((c) => c.id === integrationId);
      setIntegrationStates((prev) => {
        const updated = {
          ...prev,
          [integrationId]: {
            status: "connected" as ConnectionStatus,
            email: config?.connectedEmail,
            lastSync: "Just now",
          },
        };
        persistStates(updated);
        return updated;
      });
    }, delay);
  }, []);

  const handleManage = useCallback((integrationId: string) => {
    navigate(`/settings/integrations/${integrationId}`);
  }, [navigate]);

  return (
    <div className="space-y-3">
      {integrationConfigs.map((integration) => {
        const state = integrationStates[integration.id] || { status: "not_connected" };
        
        return (
          <IntegrationRow
            key={integration.id}
            config={integration}
            state={state}
            onConnect={() => handleConnect(integration.id)}
            onManage={() => handleManage(integration.id)}
          />
        );
      })}
    </div>
  );
}

interface IntegrationRowProps {
  config: IntegrationConfig;
  state: IntegrationState;
  onConnect: () => void;
  onManage: () => void;
}

function IntegrationRow({ config, state, onConnect, onManage }: IntegrationRowProps) {
  const isConnecting = state.status === "connecting";
  const isConnected = state.status === "connected";

  return (
    <motion.div
      layout
      className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <motion.div
          layout="position"
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300",
            config.iconBg
          )}
        >
          {config.icon}
        </motion.div>
        <div>
          <p className="font-medium">{config.name}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={isConnected ? "connected" : "description"}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {isConnected ? state.email : config.description}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div
              key="connected-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-2"
            >
              <Badge 
                variant="secondary" 
                className="bg-success/10 text-success border-success/20 gap-1 transition-all duration-300"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="w-3 h-3" />
                </motion.span>
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={onManage}
              >
                Manage
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="connect-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-xl min-w-[110px] transition-all duration-300",
                  isConnecting && "pointer-events-none"
                )}
                onClick={onConnect}
                disabled={isConnecting}
              >
                <AnimatePresence mode="wait">
                  {isConnecting ? (
                    <motion.span
                      key="connecting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting…</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="connect"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Connect
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
