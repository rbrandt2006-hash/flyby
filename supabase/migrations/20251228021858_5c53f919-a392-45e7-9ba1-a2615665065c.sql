-- Create a security definer helper to avoid RLS recursion when looking up the current user's company
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Fix profiles SELECT policies (remove recursive subquery on profiles)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
USING (
  company_id IS NOT NULL
  AND company_id = public.current_user_company_id()
);

-- Fix trips company SELECT policy to use helper (prevents dependency on profiles RLS)
DROP POLICY IF EXISTS "Users can view trips in their company" ON public.trips;

CREATE POLICY "Users can view trips in their company"
ON public.trips
FOR SELECT
USING (
  company_id IS NOT NULL
  AND company_id = public.current_user_company_id()
);
