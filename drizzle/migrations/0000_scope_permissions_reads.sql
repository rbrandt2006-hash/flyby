DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;
CREATE POLICY "Users can view permissions for their own role" ON public.role_permissions
FOR SELECT TO authenticated
USING (
  role = COALESCE((SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1), 'user'::public.app_role)
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Users can view permissions granted to their role" ON public.permissions
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.permission_id = permissions.id
      AND rp.role = COALESCE((SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1), 'user'::public.app_role)
  )
);