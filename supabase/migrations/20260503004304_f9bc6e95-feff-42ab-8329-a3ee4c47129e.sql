
-- Fix 1: Remove permissive postgres_changes OR branch from realtime + messages policies
DROP POLICY IF EXISTS "Authenticated users can subscribe to own company messages" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to own company messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('company:' || current_user_company_id()::text || '%')
);

-- The same-named permissive policy may also exist on public.messages; drop if present
DROP POLICY IF EXISTS "Authenticated users can subscribe to own company messages" ON public.messages;

-- Fix 2: Restrict avatar SELECT to same-company users (folder name = user_id)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars in their company" ON storage.objects;

CREATE POLICY "Users can view avatars in their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id::text = (storage.foldername(name))[1]
        AND p.company_id IS NOT NULL
        AND p.company_id = current_user_company_id()
    )
  )
);
