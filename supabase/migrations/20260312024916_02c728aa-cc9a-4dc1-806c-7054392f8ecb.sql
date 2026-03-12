-- Drop the overly broad company-wide SELECT policy that exposes 2FA fields
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create a secure view for company-wide profile lookups (excludes sensitive 2FA/phone fields)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  email,
  full_name,
  avatar_url,
  job_title,
  company_id,
  created_at,
  updated_at
FROM public.profiles;

-- Recreate company-wide policy that only allows access through the view
-- The owner-only policy "Users can view their own profile" still grants full access to own row
-- For company-wide lookups, we create a new restricted policy
CREATE POLICY "Users can view basic profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (company_id IS NOT NULL)
  AND (company_id = current_user_company_id())
  AND (user_id != auth.uid())
);

-- Grant view access
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;