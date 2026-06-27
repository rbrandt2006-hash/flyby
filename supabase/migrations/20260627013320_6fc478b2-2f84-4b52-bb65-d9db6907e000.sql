CREATE TABLE public.loyalty_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('airline','hotel')),
  program_name TEXT NOT NULL,
  member_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_programs TO authenticated;
GRANT ALL ON public.loyalty_programs TO service_role;

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty programs"
  ON public.loyalty_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty programs"
  ON public.loyalty_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty programs"
  ON public.loyalty_programs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loyalty programs"
  ON public.loyalty_programs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_loyalty_programs_user ON public.loyalty_programs(user_id);

CREATE TRIGGER trg_loyalty_programs_updated_at
  BEFORE UPDATE ON public.loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();