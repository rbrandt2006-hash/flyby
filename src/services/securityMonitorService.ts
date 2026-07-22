import { backend } from "@/integrations/backend/client";
import { logAuditEvent } from "./auditService";

/**
 * Security event monitoring service.
 * Detects anomalies and generates security alerts.
 */

export type AlertSeverity = "low" | "medium" | "high" | "critical";

interface SecurityAlert {
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId?: string;
}

/**
 * Creates a security alert for admin review.
 */
export async function createSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    const { data: { user } } = await backend.auth.getUser();
    const { data: profile } = user
      ? await backend.from("profiles").select("company_id").eq("user_id", user.id).maybeSingle()
      : { data: null };

    await (backend.from("security_alerts") as any).insert({
      tenant_id: profile?.company_id ?? null,
      user_id: alert.userId ?? user?.id ?? null,
      alert_type: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      metadata: alert.metadata ?? {},
      status: "open",
    });
  } catch (err) {
    console.warn("[security-monitor] Failed to create alert:", err);
  }
}

/**
 * Checks for suspicious login patterns.
 * Call after each login attempt.
 */
export async function checkLoginAnomalies(userId: string, success: boolean): Promise<void> {
  if (success) return;

  try {
    // Count recent failures for this user
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await (backend.from("audit_logs") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", "login_failure")
      .gte("created_at", cutoff);

    const failCount = count ?? 0;

    if (failCount >= 3 && failCount < 5) {
      await createSecurityAlert({
        alertType: "suspicious_login",
        severity: "medium",
        title: "Multiple failed login attempts",
        description: `User has ${failCount} failed login attempts in the last 15 minutes.`,
        userId,
        metadata: { failCount },
      });
    } else if (failCount >= 5) {
      await createSecurityAlert({
        alertType: "brute_force_suspected",
        severity: "high",
        title: "Possible brute force attack",
        description: `User has ${failCount} failed login attempts in the last 15 minutes. Account may be under attack.`,
        userId,
        metadata: { failCount },
      });
    }
  } catch (err) {
    console.warn("[security-monitor] Failed to check login anomalies:", err);
  }
}

/**
 * Monitors for rapid API abuse patterns.
 */
export async function checkRapidActivity(
  userId: string,
  action: string,
  threshold: number = 50,
  windowMinutes: number = 5,
): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { count } = await (backend.from("audit_logs") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", action)
      .gte("created_at", cutoff);

    if ((count ?? 0) >= threshold) {
      await createSecurityAlert({
        alertType: "rapid_activity",
        severity: "medium",
        title: `Unusual activity: ${action}`,
        description: `User performed ${count} "${action}" actions in ${windowMinutes} minutes (threshold: ${threshold}).`,
        userId,
        metadata: { action, count, threshold, windowMinutes },
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Fetches open security alerts for the current tenant.
 */
export async function getSecurityAlerts(options?: { status?: string; limit?: number }) {
  let query = (backend.from("security_alerts") as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  return query;
}

/**
 * Resolves a security alert.
 */
export async function resolveSecurityAlert(alertId: string): Promise<void> {
  const { data: { user } } = await backend.auth.getUser();
  
  await (backend.from("security_alerts") as any)
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
    })
    .eq("id", alertId);

  await logAuditEvent({
    action: "settings_changed",
    targetType: "security_alert",
    targetId: alertId,
    metadata: { action: "resolved" },
  });
}
