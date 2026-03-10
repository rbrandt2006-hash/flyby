
-- 1. Tighten travel_preferences: change from public to authenticated
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.travel_preferences;
CREATE POLICY "Users can manage their own preferences"
ON public.travel_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Tighten calendar_suggestions: change from public to authenticated
DROP POLICY IF EXISTS "Users can manage their own suggestions" ON public.calendar_suggestions;
CREATE POLICY "Users can manage their own suggestions"
ON public.calendar_suggestions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Tighten documents: change from public to authenticated
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents"
ON public.documents
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Tighten travel_alerts: consolidate and change to authenticated
DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.travel_alerts;
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.travel_alerts;
CREATE POLICY "Users can manage their own alerts"
ON public.travel_alerts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Tighten trips: change from public to authenticated
DROP POLICY IF EXISTS "Users can manage their own trips" ON public.trips;
CREATE POLICY "Users can manage their own trips"
ON public.trips
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view trips in their company" ON public.trips;
CREATE POLICY "Users can view trips in their company"
ON public.trips
FOR SELECT
TO authenticated
USING ((company_id IS NOT NULL) AND (company_id = current_user_company_id()));

-- 6. Tighten expenses: change from public to authenticated
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view expenses in their company" ON public.expenses;
CREATE POLICY "Users can view expenses in their company"
ON public.expenses
FOR SELECT
TO authenticated
USING ((company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())) OR (user_id = auth.uid()));

-- 7. Tighten messages: change from public to authenticated
DROP POLICY IF EXISTS "Users can send messages to their company" ON public.messages;
CREATE POLICY "Users can send messages to their company"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK ((company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())) AND (user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their company" ON public.messages;
CREATE POLICY "Users can view messages in their company"
ON public.messages
FOR SELECT
TO authenticated
USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- 8. Tighten profiles: change from public to authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING ((company_id IS NOT NULL) AND (company_id = current_user_company_id()));

-- 9. Tighten companies: change from public to authenticated
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()));
