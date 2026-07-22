import { backend } from "@/integrations/backend/client";

/**
 * Tracks the current session in the active_sessions table.
 */
export async function trackSession(): Promise<void> {
  try {
    const { data: { user } } = await backend.auth.getUser();
    if (!user) return;

    const ua = navigator.userAgent;
    const browser = detectBrowser(ua);
    const tokenHash = simpleHash(user.id + Date.now().toString());

    await (backend.from("active_sessions") as any).insert({
      user_id: user.id,
      session_token_hash: tokenHash,
      device_info: ua.slice(0, 200),
      browser,
    });
  } catch (err) {
    console.warn("[session] Failed to track session:", err);
  }
}

/**
 * Fetches active sessions for the current user.
 */
export async function getActiveSessions() {
  return (backend.from("active_sessions") as any)
    .select("*")
    .eq("revoked", false)
    .order("last_active_at", { ascending: false });
}

/**
 * Revokes a specific session.
 */
export async function revokeSession(sessionId: string) {
  return (backend.from("active_sessions") as any)
    .update({ revoked: true, revoked_at: new Date().toISOString() })
    .eq("id", sessionId);
}

/**
 * Revokes all sessions except current.
 */
export async function revokeAllOtherSessions(currentSessionId: string) {
  const { data: { user } } = await backend.auth.getUser();
  if (!user) return;

  return (backend.from("active_sessions") as any)
    .update({ revoked: true, revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("revoked", false)
    .neq("id", currentSessionId);
}

function detectBrowser(ua: string): string {
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Unknown";
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
