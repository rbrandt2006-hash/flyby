-- Add two-factor authentication settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_phone text,
ADD COLUMN IF NOT EXISTS two_factor_verified_at timestamptz;

-- Create 2FA audit log table for security tracking
CREATE TABLE IF NOT EXISTS public.two_factor_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    phone_number_masked text,
    ip_address text,
    user_agent text,
    success boolean NOT NULL,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.two_factor_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own 2FA audit logs"
ON public.two_factor_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only allow inserts from edge functions (service role)
CREATE POLICY "Service role can insert audit logs"
ON public.two_factor_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_audit_user_id ON public.two_factor_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_audit_created_at ON public.two_factor_audit_log(created_at DESC);

-- Create a table to track pending 2FA verifications during login
CREATE TABLE IF NOT EXISTS public.pending_2fa_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token text NOT NULL UNIQUE,
    phone_number text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.pending_2fa_verifications ENABLE ROW LEVEL SECURITY;

-- Only service role can manage pending verifications
CREATE POLICY "Service role can manage pending 2fa"
ON public.pending_2fa_verifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);