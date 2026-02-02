/**
 * 2FA SMS Verify Endpoint
 * 
 * Security features:
 * - Rate limiting (5 attempts per 5 minutes per IP)
 * - JWT authentication required
 * - OTP code validation (6 digits only)
 * - Audit logging for all attempts
 * - Masked phone numbers in responses
 * 
 * @see SECURITY.md for configuration details
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import {
  getResponseHeaders,
  getCorsHeaders,
  checkRateLimit,
  getClientIP,
  rateLimitedResponse,
  errorResponse,
  successResponse,
  isValidOTPCode,
  parseAndValidateBody,
  sanitizeString,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

interface VerifySMSRequest {
  phone?: string;
  code: string;
  enableAfterVerify?: boolean;
}

// Allowed fields in request body
const ALLOWED_FIELDS = ["phone", "code", "enableAfterVerify"];

/**
 * Mask phone number for display.
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length < 8) return "****" + phone.slice(-4);
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
    // RATE LIMITING - Strict limits on verification attempts
    // ========================================================================
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.TWOFA_VERIFY);
    if (!rateLimitResult.allowed) {
      logAudit(createAuditLog(req, "twofa_verify_rate_limited", undefined, false, { ip: clientIP }));
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logAudit(createAuditLog(req, "twofa_verify_unauthorized", undefined, false));
      return errorResponse(req, 401, "Unauthorized");
    }

    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================
    const { body, error: parseError } = await parseAndValidateBody(req, ALLOWED_FIELDS);
    
    if (parseError || !body) {
      return errorResponse(req, 400, parseError || "Invalid request body");
    }

    const phone = body.phone ? String(body.phone) : undefined;
    const code = body.code ? String(body.code) : undefined;
    const enableAfterVerify = body.enableAfterVerify !== false;

    // Validate OTP code format (6 digits only)
    if (!code) {
      return errorResponse(req, 400, "Verification code is required");
    }

    const sanitizedCode = sanitizeString(code, 6);
    if (!isValidOTPCode(sanitizedCode)) {
      return errorResponse(req, 400, "Invalid code format. Must be 6 digits.");
    }

    // Resolve phone number
    let resolvedPhone = phone ? sanitizeString(phone, 20) : undefined;
    
    if (!resolvedPhone) {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("two_factor_phone")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile?.two_factor_phone) {
        return errorResponse(req, 400, "No verified 2FA phone on file");
      }

      resolvedPhone = profile.two_factor_phone;
    }

    if (!resolvedPhone) {
      return errorResponse(req, 400, "No verified 2FA phone on file");
    }

    const cleanPhone = resolvedPhone.replace(/[\s\-\(\)]/g, "");

    // ========================================================================
    // TWILIO VERIFICATION
    // ========================================================================
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const verifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error("[SECURITY] Missing Twilio credentials");
      return errorResponse(req, 500, "2FA service not configured");
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    console.log(`[2FA] Verifying code for ${maskPhoneNumber(cleanPhone)}, user ${user.id}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: cleanPhone,
        Code: sanitizedCode,
      }),
    });

    const twilioResult = await twilioResponse.json();

    // ========================================================================
    // HANDLE VERIFICATION RESULT
    // ========================================================================
    if (!twilioResponse.ok || twilioResult.status !== "approved") {
      console.error("[2FA] Verification failed:", { status: twilioResult.status, code: twilioResult.code });

      // Log failed attempt
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "verify_code",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: clientIP,
        user_agent: req.headers.get("user-agent"),
        success: false,
        error_message: twilioResult.status === "pending" ? "Invalid code" : (twilioResult.message || "Verification failed"),
      });

      logAudit(createAuditLog(req, "twofa_verify_failed", user.id, false));

      // Handle specific error codes
      if (twilioResult.status === "pending") {
        return errorResponse(req, 400, "Invalid verification code");
      }

      if (twilioResult.code === 60202) {
        return errorResponse(req, 400, "Verification code expired. Please request a new one.");
      }

      if (twilioResult.code === 60203) {
        return errorResponse(req, 429, "Too many attempts. Please wait before trying again.");
      }

      return errorResponse(req, 400, "Verification failed");
    }

    // ========================================================================
    // SUCCESS - Update profile if enabling 2FA
    // ========================================================================
    if (enableAfterVerify) {
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          two_factor_enabled: true,
          two_factor_phone: cleanPhone,
          two_factor_verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[2FA] Failed to update profile:", updateError.message);
        return errorResponse(req, 500, "Failed to enable 2FA");
      }

      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "enable_2fa",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: clientIP,
        user_agent: req.headers.get("user-agent"),
        success: true,
      });
    } else {
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "verify_code",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: clientIP,
        user_agent: req.headers.get("user-agent"),
        success: true,
      });
    }

    logAudit(createAuditLog(req, "twofa_verify_success", user.id, true));

    return successResponse(req, {
      success: true,
      message: enableAfterVerify ? "Two-factor authentication enabled" : "Verification successful",
      maskedPhone: maskPhoneNumber(cleanPhone),
    });

  } catch (error) {
    console.error("[2FA] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "twofa_verify_error", undefined, false));
    return errorResponse(req, 500, "Internal server error");
  }
});
