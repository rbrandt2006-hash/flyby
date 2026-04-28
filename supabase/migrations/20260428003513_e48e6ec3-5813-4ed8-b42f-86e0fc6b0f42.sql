
-- 1. Email validation
CREATE OR REPLACE FUNCTION public.get_or_create_company(email_input text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  domain_part TEXT;
  company_uuid UUID;
BEGIN
  IF email_input IS NULL OR email_input NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  domain_part := split_part(email_input, '@', 2);
  IF domain_part = '' OR length(domain_part) < 3 THEN
    RAISE EXCEPTION 'Invalid email domain';
  END IF;
  SELECT id INTO company_uuid FROM public.companies WHERE domain = domain_part;
  IF company_uuid IS NULL THEN
    INSERT INTO public.companies (name, domain)
    VALUES (initcap(split_part(domain_part, '.', 1)), domain_part)
    RETURNING id INTO company_uuid;
  END IF;
  RETURN company_uuid;
END;
$function$;

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS domain_not_empty;
ALTER TABLE public.companies ADD CONSTRAINT domain_not_empty CHECK (domain <> '');

-- 2. Audit logs
DROP POLICY IF EXISTS "Users can view own tenant audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view tenant audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (tenant_id = current_user_company_id() AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert own-tenant audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR tenant_id = current_user_company_id()));

-- 3. Profiles
DROP POLICY IF EXISTS "Users can view basic profiles in their company" ON public.profiles;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT id, user_id, company_id, full_name, avatar_url, job_title, created_at, updated_at
FROM public.profiles
WHERE company_id IS NOT NULL AND company_id = current_user_company_id();

GRANT SELECT ON public.profiles_public TO authenticated;

-- 4. Avatars bucket -> private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Realtime authorization
DROP POLICY IF EXISTS "Authenticated users can subscribe to own company messages" ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to own company messages"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    (realtime.topic())::text LIKE ('company:' || current_user_company_id()::text || '%')
    OR (extension = 'postgres_changes' AND (realtime.topic())::text LIKE 'realtime:%')
  );
