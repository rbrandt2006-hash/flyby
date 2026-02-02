/**
 * 2FA Check Required Endpoint
 * 
 * Checks if a user requires 2FA before login completes.
 * This is a PUBLIC endpoint (no auth required) since it's called before login.
 * 
 * Security features:
 * - Rate limiting (10 requests/minute per IP) to prevent enumeration
 * - No sensitive data exposed (phone masked, no user existence indication)
 * - Input validation (email format)
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
  isValidEmail,
  parseAndValidateBody,
  sanitizeString,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

interface CheckRequest {
  email: string;
}

// Allowed fields in request body
const ALLOWED_FIELDS = ["email"];

/**
 * Mask phone number for display.
 * Security: Never expose full phone numbers.
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
    // RATE LIMITING - Prevent user enumeration attacks
    // ========================================================================
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.TWOFA_CHECK);
    if (!rateLimitResult.allowed) {
      logAudit(createAuditLog(req, "twofa_check_rate_limited", undefined, false, { ip: clientIP }));
      return rateLimitedResponse(req, rateLimitResult);
    }

    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================
    const { body, error: parseError } = await parseAndValidateBody(req, ALLOWED_FIELDS);
    
    if (parseError || !body) {
      return errorResponse(req, 400, parseError || "Invalid request body");
    }

    const email = body.email ? sanitizeString(String(body.email), 255)?.toLowerCase() : undefined;

    if (!email) {
      return errorResponse(req, 400, "Email is required");
    }

    if (!isValidEmail(email)) {
      return errorResponse(req, 400, "Invalid email format");
    }

    // ========================================================================
    // CHECK 2FA STATUS
    // ========================================================================
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email and check 2FA status
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("user_id, two_factor_enabled, two_factor_phone")
      .eq("email", email)
      .single();

    // Security: Always return the same response structure regardless of user existence
    // This prevents user enumeration attacks
    if (error || !profile) {
      return successResponse(req, {
        requires2FA: false,
        maskedPhone: null,
      });
    }

    return successResponse(req, {
      requires2FA: profile.two_factor_enabled || false,
      maskedPhone: profile.two_factor_phone ? maskPhoneNumber(profile.two_factor_phone) : null,
    });

  } catch (error) {
    console.error("[2FA Check] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "twofa_check_error", undefined, false));
    return errorResponse(req, 500, "Internal server error");
  }
});
