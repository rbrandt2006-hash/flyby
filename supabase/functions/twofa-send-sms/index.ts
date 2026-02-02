/**
 * 2FA SMS Send Endpoint
 * 
 * Security features:
 * - Rate limiting (3 requests/minute per IP)
 * - JWT authentication required
 * - Phone number validation (E.164 format)
 * - Audit logging
 * - Masked phone numbers in responses
 * 
 * @see SECURITY.md for configuration details
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Import shared security utilities
import {
  getResponseHeaders,
  getCorsHeaders,
  checkRateLimit,
  getClientIP,
  rateLimitedResponse,
  errorResponse,
  successResponse,
  isValidE164Phone,
  parseAndValidateBody,
  sanitizeString,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

interface SendSMSRequest {
  phone?: string;
}

// Allowed fields in request body
const ALLOWED_FIELDS = ["phone"];

/**
 * Mask phone number for display (e.g., +1713****1234)
 * Never expose full phone numbers in responses or logs.
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
    // RATE LIMITING - Check before any processing
    // ========================================================================
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.TWOFA_SEND);
    if (!rateLimitResult.allowed) {
      logAudit(createAuditLog(req, "twofa_send_rate_limited", undefined, false, { ip: clientIP }));
      return rateLimitedResponse(req, rateLimitResult);
    }

    // ========================================================================
    // AUTHENTICATION - Require valid JWT
    // ========================================================================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return errorResponse(req, 401, "Missing authorization header");
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logAudit(createAuditLog(req, "twofa_send_unauthorized", undefined, false));
      return errorResponse(req, 401, "Unauthorized");
    }

    // ========================================================================
    // INPUT VALIDATION - Parse and validate request body
    // ========================================================================
    let phone: string | undefined;
    try {
      const { body, error } = await parseAndValidateBody(req, ALLOWED_FIELDS);
      if (error) {
        return errorResponse(req, 400, error);
      }
      phone = body?.phone ? sanitizeString(String(body.phone), 20) : undefined;
    } catch {
      phone = undefined;
    }

    // If phone isn't provided, use the user's stored 2FA phone
    if (!phone) {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("two_factor_enabled, two_factor_phone")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile?.two_factor_enabled || !profile?.two_factor_phone) {
        return errorResponse(req, 400, "No verified 2FA phone on file");
      }

      phone = profile.two_factor_phone;
    }

    if (!phone) {
      return errorResponse(req, 400, "No verified 2FA phone on file");
    }

    // Clean and validate phone format (E.164 required)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!isValidE164Phone(cleanPhone)) {
      return errorResponse(req, 400, "Invalid phone format. Use E.164 format (e.g., +17135551234)");
    }

    // ========================================================================
    // TWILIO INTEGRATION - Send verification code
    // ========================================================================
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const verifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error("[SECURITY] Missing Twilio credentials - check environment configuration");
      return errorResponse(req, 500, "2FA service not configured");
    }

    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    console.log(`[2FA] Sending SMS to ${maskPhoneNumber(cleanPhone)} for user ${user.id}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: cleanPhone,
        Channel: "sms",
      }),
    });

    const twilioResult = await twilioResponse.json();

    // ========================================================================
    // HANDLE TWILIO RESPONSE
    // ========================================================================
    if (!twilioResponse.ok) {
      console.error("[2FA] Twilio error:", { code: twilioResult.code, status: twilioResult.status });

      // Log failed attempt
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "send_code",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: clientIP,
        user_agent: req.headers.get("user-agent"),
        success: false,
        error_message: twilioResult.message || "Failed to send SMS",
      });

      logAudit(createAuditLog(req, "twofa_send_failed", user.id, false, { twilioCode: twilioResult.code }));

      // Return structured errors for known Twilio codes
      if (twilioResult.code === 60203) {
        return successResponse(req, {
          success: false,
          error: "Too many attempts. Please wait before trying again.",
          code: 60203,
        });
      }

      if (twilioResult.code === 21608) {
        return successResponse(req, {
          success: false,
          error: "This phone number can't receive SMS from your current provider account.",
          code: 21608,
        });
      }

      return successResponse(req, {
        success: false,
        error: "Failed to send verification code. Please try again.",
        code: twilioResult.code,
      });
    }

    // ========================================================================
    // SUCCESS - Log and respond
    // ========================================================================
    await supabaseClient.from("two_factor_audit_log").insert({
      user_id: user.id,
      action: "send_code",
      phone_number_masked: maskPhoneNumber(cleanPhone),
      ip_address: clientIP,
      user_agent: req.headers.get("user-agent"),
      success: true,
    });

    logAudit(createAuditLog(req, "twofa_send_success", user.id, true));

    return successResponse(req, {
      success: true,
      message: "Verification code sent",
      maskedPhone: maskPhoneNumber(cleanPhone),
    });

  } catch (error) {
    // Never expose internal error details to clients
    console.error("[2FA] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "twofa_send_error", undefined, false));
    return errorResponse(req, 500, "Internal server error");
  }
});
