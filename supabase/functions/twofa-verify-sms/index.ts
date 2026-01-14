import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifySMSRequest {
  phone?: string;
  code: string;
  enableAfterVerify?: boolean;
}

// Mask phone number for display
function maskPhoneNumber(phone: string): string {
  if (phone.length < 8) return "****" + phone.slice(-4);
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user JWT by passing token directly
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error("User validation failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { phone, code, enableAfterVerify = true }: VerifySMSRequest = await req.json();

    // Validate inputs
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Verification code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid code format. Must be 6 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Phone is optional for login flow; if missing, use stored 2FA phone
    let resolvedPhone = phone;
    if (!resolvedPhone) {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("two_factor_phone")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile?.two_factor_phone) {
        return new Response(
          JSON.stringify({ error: "No verified 2FA phone on file" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      resolvedPhone = profile.two_factor_phone;
    }
    if (!resolvedPhone) {
      return new Response(
        JSON.stringify({ error: "No verified 2FA phone on file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = resolvedPhone.replace(/[\s\-\(\)]/g, "");
    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const verifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "2FA service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify code with Twilio
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    console.log(`Verifying 2FA code for ${maskPhoneNumber(cleanPhone)}, user ${user.id}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: cleanPhone,
        Code: code,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok || twilioResult.status !== "approved") {
      console.error("Twilio verification failed:", twilioResult);

      // Log failed attempt
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "verify_code",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
        success: false,
        error_message: twilioResult.status === "pending" ? "Invalid code" : (twilioResult.message || "Verification failed"),
      });

      // Handle specific errors
      if (twilioResult.status === "pending") {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (twilioResult.code === 60202) {
        return new Response(
          JSON.stringify({ error: "Verification code expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (twilioResult.code === 60203) {
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please wait before trying again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: twilioResult.message || "Verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code verified successfully - update user profile if enabling 2FA
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
        console.error("Failed to update profile:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to enable 2FA" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log successful enable
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "enable_2fa",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
        success: true,
      });
    } else {
      // Just log verification for login flow
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "verify_code",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
        success: true,
      });
    }

    console.log(`Successfully verified 2FA for ${maskPhoneNumber(cleanPhone)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: enableAfterVerify ? "Two-factor authentication enabled" : "Verification successful",
        maskedPhone: maskPhoneNumber(cleanPhone)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("2FA verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
