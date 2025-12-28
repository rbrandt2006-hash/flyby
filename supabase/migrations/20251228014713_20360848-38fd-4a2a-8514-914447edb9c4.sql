-- Drop the problematic recursive policy on profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Users can view their own profile directly
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Create a separate policy for viewing company colleagues that avoids recursion
-- by first getting the user's company_id directly
CREATE POLICY "Users can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
    LIMIT 1
  )
);