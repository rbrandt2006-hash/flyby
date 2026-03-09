import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  getResponseHeaders,
  checkRateLimit,
  getClientIP,
  rateLimitedResponse,
  parseAndValidateBody,
  errorResponse,
  successResponse,
  isValidEmail,
  sanitizeString,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

const LOCKOUT_THRESHOLD = 5; // Lock after 5 failed attempts
const LOCKOUT_WINDOW_MINUTES = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return errorResponse(req, 405, "Method not allowed");
  }

  // Rate limit
  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, RATE_LIMITS.LOGIN);
  if (!rl.allowed) return rateLimitedResponse(req, rl);

  const { body, error: parseError } = await parseAndValidateBody(req, [
    "email",
    "success",
    "error_message",
  ]);

  if (parseError || !body) {
    return errorResponse(req, 400, parseError || "Invalid request");
  }

  const email = sanitizeString(body.email as string, 255);
  const success = body.success === true;
  const errorMessage = sanitizeString(body.error_message as string | undefined, 500);

  if (!isValidEmail(email)) {
    return errorResponse(req, 400, "Invalid email format");
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log the attempt
    await supabaseAdmin.from("two_factor_audit_log").insert({
      user_id: "00000000-0000-0000-0000-000000000000", // placeholder for unauthenticated
      action: success ? "login_success" : "login_failed",
      success,
      ip_address: ip,
      user_agent: req.headers.get("user-agent") || null,
      error_message: errorMessage || null,
      phone_number_masked: email, // repurpose for email tracking
    });

    // Check for lockout (count recent failures for this IP)
    if (!success) {
      const cutoff = new Date(
        Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000
      ).toISOString();

      const { count } = await supabaseAdmin
        .from("two_factor_audit_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "login_failed")
        .eq("ip_address", ip)
        .gte("created_at", cutoff);

      if ((count || 0) >= LOCKOUT_THRESHOLD) {
        const auditEntry = createAuditLog(
          req,
          "ip_lockout_triggered",
          undefined,
          false,
          { ip, failedAttempts: count }
        );
        logAudit(auditEntry);

        return errorResponse(
          req,
          429,
          "Too many failed login attempts. Please try again later."
        );
      }
    }

    const auditEntry = createAuditLog(req, success ? "login_success" : "login_failed", undefined, success, { email: "REDACTED" });
    logAudit(auditEntry);

    return successResponse(req, { logged: true });
  } catch (err) {
    console.error("[audit-login] Error:", err);
    return errorResponse(req, 500, "Internal server error");
  }
});
