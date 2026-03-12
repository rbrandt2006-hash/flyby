-- Split the overly broad ALL policy into explicit per-operation policies
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;

-- Explicit SELECT policy
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Explicit INSERT policy
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Explicit UPDATE policy
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Explicit DELETE policy
CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE TO authenticated USING (user_id = auth.uid());