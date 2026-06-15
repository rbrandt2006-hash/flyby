
-- Restrict cross-employee visibility on expenses and trips to managers/admins

DROP POLICY IF EXISTS "Users can view expenses in their company" ON public.expenses;
CREATE POLICY "Managers and admins can view company expenses"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  );

DROP POLICY IF EXISTS "Users can view trips in their company" ON public.trips;
CREATE POLICY "Managers and admins can view company trips"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id = public.current_user_company_id()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  );

-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated.
-- These functions are only intended to run from RLS policies (postgres role)
-- or from auth triggers, never directly via the client API.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_company_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_or_create_company(text) FROM PUBLIC, anon, authenticated;
