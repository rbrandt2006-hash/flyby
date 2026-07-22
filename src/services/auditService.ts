import { backend } from "@/integrations/backend/client";

export type AuditAction =
  | "login_success"
  | "login_failure"
  | "logout"
  | "mfa_challenge_success"
  | "mfa_challenge_failure"
  | "token_refresh"
  | "session_revoked"
  | "role_changed"
  | "permission_changed"
  | "password_reset"
  | "mfa_enrolled"
  | "mfa_disabled"
  | "trip_created"
  | "trip_edited"
  | "trip_canceled"
  | "expense_submitted"
  | "expense_approved"
  | "expense_rejected"
  | "traveler_status_changed"
  | "export_downloaded"
  | "file_uploaded"
  | "file_deleted"
  | "approval_override"
  | "settings_changed";

interface AuditLogEntry {
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

/**
 * Logs an audit event. Silently fails to avoid disrupting user flows.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: { user } } = await backend.auth.getUser();
    if (!user) return;

    // Get tenant_id from profile
    const { data: profile } = await backend
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    await (backend.from("audit_logs") as any).insert({
      user_id: user.id,
      tenant_id: profile?.company_id ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      success: entry.success ?? true,
    });
  } catch (err) {
    console.warn("[audit] Failed to log event:", err);
  }
}

/**
 * Fetches audit logs for the current tenant. Admin-only usage.
 */
export async function fetchAuditLogs(options?: {
  limit?: number;
  action?: string;
  userId?: string;
}) {
  let query = (backend.from("audit_logs") as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.action) {
    query = query.eq("action", options.action);
  }
  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  return query;
}
