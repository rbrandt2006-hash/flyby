/**
 * 2FA Status Endpoint
 * 
 * Returns the current 2FA status for the authenticated user.
 * 
 * Security features:
 * - JWT authentication required
 * - Rate limiting
 * - Phone numbers always masked
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

/**
 * Mask phone number for display.
 */
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return phone ? "****" + phone.slice(-4) : "";
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

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
      logAudit(createAuditLog(req, "twofa_status_unauthorized", undefined, false));
      return errorResponse(req, 401, "Unauthorized");
    }

    // ========================================================================
    // GET 2FA STATUS
    // ========================================================================
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("two_factor_enabled, two_factor_phone, two_factor_verified_at")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("[2FA Status] Failed to fetch profile:", profileError.message);
      return errorResponse(req, 500, "Failed to fetch 2FA status");
    }

    return successResponse(req, {
      enabled: profile?.two_factor_enabled || false,
      maskedPhone: profile?.two_factor_phone ? maskPhoneNumber(profile.two_factor_phone) : null,
      verifiedAt: profile?.two_factor_verified_at || null,
    });

  } catch (error) {
    console.error("[2FA Status] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "twofa_status_error", undefined, false));
    return errorResponse(req, 500, "Internal server error");
  }
});
