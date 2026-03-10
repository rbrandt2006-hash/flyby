
-- 1. Create comprehensive audit_logs table (append-only)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid REFERENCES public.companies(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only authenticated users can view their tenant's logs, no updates/deletes
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (tenant_id = current_user_company_id());

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access audit logs"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON public.audit_logs(user_id, action);

-- 2. Create active_sessions table for session tracking
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token_hash text NOT NULL,
  device_info text,
  browser text,
  ip_address text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON public.active_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own sessions"
ON public.active_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
ON public.active_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access sessions"
ON public.active_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_active_sessions_user ON public.active_sessions(user_id, revoked);

-- 3. Create file_upload_policies table
CREATE TABLE public.file_upload_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.companies(id),
  allowed_types text[] NOT NULL DEFAULT ARRAY['pdf','png','jpg','jpeg'],
  max_file_size_mb integer NOT NULL DEFAULT 10,
  require_scan boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.file_upload_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant upload policy"
ON public.file_upload_policies
FOR SELECT
TO authenticated
USING (tenant_id = current_user_company_id());

CREATE POLICY "Admins can manage upload policies"
ON public.file_upload_policies
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
