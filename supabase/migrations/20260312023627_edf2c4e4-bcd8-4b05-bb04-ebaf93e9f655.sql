
-- Fix get_user_role: restrict to current user or admins
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
    AND (_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  LIMIT 1
$$;

-- Fix has_permission: restrict to current user or admins
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.name = _permission
      AND (_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
$$;
