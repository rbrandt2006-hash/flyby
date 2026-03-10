
-- 1. Add status column to companies (tenants) table
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- 2. Create permissions table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT TO authenticated USING (true);

-- 3. Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Create mfa_credentials table for WebAuthn/TOTP
CREATE TABLE public.mfa_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'totp',
  credential_id text,
  public_key text,
  sign_count integer DEFAULT 0,
  device_name text,
  encrypted_secret text,
  backup_codes text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mfa_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own MFA credentials"
ON public.mfa_credentials FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Users can manage own MFA credentials"
ON public.mfa_credentials FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Create security_alerts table
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.companies(id),
  user_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view tenant security alerts"
ON public.security_alerts FOR SELECT TO authenticated
USING (tenant_id = current_user_company_id() AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role full access security alerts"
ON public.security_alerts FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_security_alerts_tenant ON public.security_alerts(tenant_id, status, created_at DESC);

-- 6. Seed default permissions
INSERT INTO public.permissions (name, resource, action, description) VALUES
  ('trip.create', 'trip', 'create', 'Create new trips'),
  ('trip.view', 'trip', 'view', 'View trip details'),
  ('trip.update', 'trip', 'update', 'Edit trip details'),
  ('trip.delete', 'trip', 'delete', 'Cancel/delete trips'),
  ('expense.create', 'expense', 'create', 'Submit expenses'),
  ('expense.view', 'expense', 'view', 'View expense details'),
  ('expense.approve', 'expense', 'approve', 'Approve/reject expenses'),
  ('expense.export', 'expense', 'export', 'Export expense reports'),
  ('user.view', 'user', 'view', 'View user profiles'),
  ('user.manage', 'user', 'manage', 'Manage user accounts and roles'),
  ('tenant.settings', 'tenant', 'settings', 'Manage organization settings'),
  ('audit.view', 'audit', 'view', 'View audit logs'),
  ('file.upload', 'file', 'upload', 'Upload files and attachments'),
  ('file.delete', 'file', 'delete', 'Delete uploaded files'),
  ('report.generate', 'report', 'generate', 'Generate reports and exports')
ON CONFLICT (name) DO NOTHING;

-- 7. Seed default role-permission mappings
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'moderator', id FROM public.permissions
WHERE name IN ('trip.create','trip.view','trip.update','expense.create','expense.view','expense.approve','user.view','file.upload','report.generate');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'user', id FROM public.permissions
WHERE name IN ('trip.create','trip.view','trip.update','expense.create','expense.view','file.upload');

-- 8. Create helper function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.name = _permission
  )
$$;
