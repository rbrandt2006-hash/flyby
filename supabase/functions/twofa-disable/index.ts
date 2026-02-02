/**
 * 2FA Disable Endpoint
 * 
 * Disables 2FA for the authenticated user.
 * 
 * Security features:
 * - JWT authentication required
 * - Rate limiting
 * - Audit logging for all disable attempts
 * 
 * @see SECURITY.md for configuration details
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import {
  getCorsHeaders,
  checkRateLimit,
  getClientIP,
  rateLimitedResponse,
  errorResponse,
  successResponse,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const clientIP = getClientIP(req);

  try {
    // ========================================================================
    // RATE LIMITING
    // ========================================================================
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.API_DEFAULT);
    if (!rateLimitResult.allowed) {
      return rateLimitedResponse(req, rateLimitResult);
    }

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return errorResponse(req, 401, "Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logAudit(createAuditLog(req, "twofa_disable_unauthorized", undefined, false));
      return errorResponse(req, 401, "Unauthorized");
    }

    // ========================================================================
    // CHECK CURRENT 2FA STATUS
    // ========================================================================
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("two_factor_enabled, two_factor_phone")
      .eq("user_id", user.id)
      .single();

    if (!profile?.two_factor_enabled) {
      return errorResponse(req, 400, "2FA is not enabled");
    }

    // ========================================================================
    // DISABLE 2FA
    // ========================================================================
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        two_factor_enabled: false,
        two_factor_phone: null,
        two_factor_verified_at: null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[2FA Disable] Failed to update profile:", updateError.message);
      return errorResponse(req, 500, "Failed to disable 2FA");
    }

    // ========================================================================
    // AUDIT LOGGING
    // ========================================================================
    await supabaseClient.from("two_factor_audit_log").insert({
      user_id: user.id,
      action: "disable_2fa",
      phone_number_masked: null,
      ip_address: clientIP,
      user_agent: req.headers.get("user-agent"),
      success: true,
    });

    logAudit(createAuditLog(req, "twofa_disable_success", user.id, true));
    console.log(`[2FA] Disabled for user ${user.id}`);

    return successResponse(req, {
      success: true,
      message: "Two-factor authentication disabled",
    });

  } catch (error) {
    console.error("[2FA Disable] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "twofa_disable_error", undefined, false));
    return errorResponse(req, 500, "Internal server error");
  }
});
