import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckRequest {
  email: string;
}

// Mask phone number for display
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return phone ? "****" + phone.slice(-4) : "";
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This endpoint doesn't require auth - it's called before login completes
    const { email }: CheckRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email and check 2FA status
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("user_id, two_factor_enabled, two_factor_phone")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !profile) {
      // Don't reveal if user exists - just say 2FA is not required
      return new Response(
        JSON.stringify({ 
          requires2FA: false,
          maskedPhone: null
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        requires2FA: profile.two_factor_enabled || false,
        maskedPhone: profile.two_factor_phone ? maskPhoneNumber(profile.two_factor_phone) : null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("2FA check error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
