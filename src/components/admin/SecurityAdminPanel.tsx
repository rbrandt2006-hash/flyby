import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Activity, Monitor, FileCheck, AlertTriangle,
  LogOut, RefreshCw, Lock, Bell, Key,
} from "lucide-react";
import { fetchAuditLogs } from "@/services/auditService";
import { getActiveSessions, revokeSession, revokeAllOtherSessions } from "@/services/sessionService";
import { getSecurityAlerts, resolveSecurityAlert } from "@/services/securityMonitorService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const actionColors: Record<string, string> = {
  login_success: "bg-success/10 text-success",
  login_failure: "bg-destructive/10 text-destructive",
  logout: "bg-muted text-muted-foreground",
  role_changed: "bg-warning/10 text-warning",
  trip_created: "bg-primary/10 text-primary",
  expense_submitted: "bg-primary/10 text-primary",
  expense_approved: "bg-success/10 text-success",
  expense_rejected: "bg-destructive/10 text-destructive",
  file_uploaded: "bg-secondary text-secondary-foreground",
  export_downloaded: "bg-warning/10 text-warning",
  settings_changed: "bg-warning/10 text-warning",
  mfa_challenge_success: "bg-success/10 text-success",
  mfa_challenge_failure: "bg-destructive/10 text-destructive",
};

const severityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

type TabId = "audit" | "sessions" | "alerts" | "policies";

export default function SecurityAdminPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("audit");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "audit") {
        const { data } = await fetchAuditLogs({ limit: 50 });
        setAuditLogs(data ?? []);
      } else if (activeTab === "sessions") {
        const { data } = await getActiveSessions();
        setSessions(data ?? []);
      } else if (activeTab === "alerts") {
        const { data } = await getSecurityAlerts({ limit: 50 });
        setAlerts(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    await revokeSession(id);
    toast.success("Session revoked");
    loadData();
  };

  const handleRevokeAll = async () => {
    if (sessions.length > 0) {
      await revokeAllOtherSessions(sessions[0]?.id ?? "");
      toast.success("All other sessions revoked");
      loadData();
    }
  };

  const handleResolveAlert = async (id: string) => {
    await resolveSecurityAlert(id);
    toast.success("Alert resolved");
    loadData();
  };

  const tabs = [
    { id: "audit" as const, label: "Audit Log", icon: Activity },
    { id: "sessions" as const, label: "Sessions", icon: Monitor },
    { id: "alerts" as const, label: "Alerts", icon: Bell, count: alerts.filter(a => a.status === "open").length },
    { id: "policies" as const, label: "Security Policies", icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center bg-destructive/15 text-destructive">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Security Audit Log</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={loadData} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Append-only log of all security and business events. Cannot be edited or deleted.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No audit events recorded yet.
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors text-sm">
                    <Badge variant="secondary" className={cn("text-[10px] font-medium shrink-0", actionColors[log.action] ?? "bg-muted")}>
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-muted-foreground text-xs flex-1 truncate">
                      {log.target_type && `${log.target_type}`}
                      {log.target_id && ` #${log.target_id.slice(0, 8)}`}
                    </span>
                    <span className={cn("text-xs", log.success ? "text-success" : "text-destructive")}>
                      {log.success ? "✓" : "✗"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Active Sessions</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleRevokeAll} className="gap-1.5 text-destructive hover:bg-destructive/5">
                <LogOut className="w-3.5 h-3.5" /> Revoke All Others
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No active sessions found.</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session, i) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {session.browser || "Unknown Browser"}
                          {i === 0 && <Badge variant="secondary" className="ml-2 text-[10px] bg-success/10 text-success">Current</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {format(new Date(session.last_active_at), "MMM d, HH:mm")}
                          {session.ip_address && ` · ${session.ip_address}`}
                        </p>
                      </div>
                    </div>
                    {i > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.id)} className="text-destructive hover:bg-destructive/5">
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Alerts Tab */}
      {activeTab === "alerts" && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Security Alerts</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={loadData} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Automated alerts for suspicious activity, brute force attempts, and anomalies.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No security alerts. System is healthy.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className={cn("p-3 rounded-lg border", alert.status === "open" ? "border-warning/30 bg-warning/5" : "border-border/50")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={cn("text-[10px]", severityColors[alert.severity] ?? "bg-muted")}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {alert.alert_type.replace(/_/g, " ")}
                          </Badge>
                          {alert.status === "resolved" && (
                            <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">resolved</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.created_at), "MMM d, HH:mm:ss")}
                        </p>
                      </div>
                      {alert.status === "open" && (
                        <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Policies Tab */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Authentication & Access Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <PolicyRow label="Password minimum length" value="10 characters" status="enforced" />
              <PolicyRow label="Password complexity" value="Uppercase, lowercase, number, special char" status="enforced" />
              <PolicyRow label="Session timeout (standard)" value="30 min inactivity" status="enforced" />
              <PolicyRow label="Session timeout (admin)" value="15 min inactivity" status="enforced" />
              <PolicyRow label="Login lockout" value="5 failed attempts / 15 min" status="enforced" />
              <PolicyRow label="MFA for privileged roles" value="SMS 2FA available" status="available" />
              <PolicyRow label="Email confirmation" value="Required before login" status="enforced" />
              <PolicyRow label="Anonymous signups" value="Disabled" status="enforced" />
              <PolicyRow label="PKCE auth flow" value="Default for all clients" status="enforced" />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Authorization & Permissions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <PolicyRow label="RBAC model" value="Admin, Moderator, User roles with granular permissions" status="enforced" />
              <PolicyRow label="Permission system" value="15 granular permissions across 6 resources" status="enforced" />
              <PolicyRow label="Object-level authorization" value="Tenant + user ownership validated server-side" status="enforced" />
              <PolicyRow label="Step-up auth for sensitive actions" value="Re-authentication for approvals, exports, settings" status="enforced" />
              <PolicyRow label="RLS on all tables" value="Row-level security with authenticated role" status="enforced" />
              <PolicyRow label="Tenant isolation" value="Company-based data isolation via RLS" status="enforced" />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Data Protection & Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <PolicyRow label="File upload types" value="PDF, PNG, JPG, JPEG only" status="enforced" />
              <PolicyRow label="Max file size" value="10 MB" status="enforced" />
              <PolicyRow label="Audit logging" value="Append-only, all critical actions logged" status="enforced" />
              <PolicyRow label="Security alerts" value="Automated anomaly detection" status="enforced" />
              <PolicyRow label="API rate limiting" value="Per-endpoint policies on edge functions" status="enforced" />
              <PolicyRow label="CSP headers" value="Strict content security policy" status="enforced" />
              <PolicyRow label="HTTPS enforcement" value="upgrade-insecure-requests" status="enforced" />
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Leaked Password Protection</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable leaked password checking in backend settings to prevent users from using passwords exposed in known data breaches.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PolicyRow({ label, value, status }: { label: string; value: string; status: "enforced" | "available" | "disabled" }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "text-[10px]",
          status === "enforced" && "bg-success/10 text-success",
          status === "available" && "bg-primary/10 text-primary",
          status === "disabled" && "bg-destructive/10 text-destructive"
        )}
      >
        {status}
      </Badge>
    </div>
  );
}
