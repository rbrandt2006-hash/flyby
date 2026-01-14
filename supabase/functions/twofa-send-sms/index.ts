import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSMSRequest {
  phone?: string;
}

// Mask phone number for display (e.g., +1713****1234)
function maskPhoneNumber(phone: string): string {
  if (phone.length < 8) return "****" + phone.slice(-4);
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

// Validate E.164 phone format
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
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

    // Initialize Supabase client with service role for admin operations
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

    // Parse request body (phone optional for login flow)
    let phone: string | undefined;
    try {
      const body: SendSMSRequest = await req.json();
      phone = body?.phone;
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
        return new Response(
          JSON.stringify({ error: "No verified 2FA phone on file" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      phone = profile.two_factor_phone;
    }

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "No verified 2FA phone on file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean and validate phone format
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!isValidE164(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format. Use E.164 format (e.g., +17135551234)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Send verification via Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    console.log(`Sending 2FA SMS to ${maskPhoneNumber(cleanPhone)} for user ${user.id}`);

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

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);

      // Log failed attempt
      await supabaseClient.from("two_factor_audit_log").insert({
        user_id: user.id,
        action: "send_code",
        phone_number_masked: maskPhoneNumber(cleanPhone),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
        success: false,
        error_message: twilioResult.message || "Failed to send SMS",
      });

      // NOTE: Lovable preview treats non-2xx responses as runtime errors.
      // For expected verification failures, return 200 with a structured error payload
      // so the frontend can render the message without a blank screen.
      if (twilioResult.code === 60203) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Too many attempts. Please wait before trying again.",
            code: 60203,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (twilioResult.code === 21608) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "This phone number can’t receive SMS from your current provider account (trial accounts can only send to verified numbers). Verify the number with your SMS provider or upgrade your account.",
            code: 21608,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: twilioResult.message || "Failed to send verification code",
          code: twilioResult.code,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful send
    await supabaseClient.from("two_factor_audit_log").insert({
      user_id: user.id,
      action: "send_code",
      phone_number_masked: maskPhoneNumber(cleanPhone),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      user_agent: req.headers.get("user-agent"),
      success: true,
    });

    console.log(`Successfully sent 2FA SMS to ${maskPhoneNumber(cleanPhone)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        maskedPhone: maskPhoneNumber(cleanPhone)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("2FA send error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
