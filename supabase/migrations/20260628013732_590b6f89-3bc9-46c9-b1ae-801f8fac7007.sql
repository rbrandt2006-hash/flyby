
CREATE TABLE public.travel_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  max_nightly_hotel_rate numeric,
  max_flight_price numeric,
  max_flight_class text CHECK (max_flight_class IN ('economy','premium_economy','business','first')),
  approval_required_above numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_policies TO authenticated;
GRANT ALL ON public.travel_policies TO service_role;

ALTER TABLE public.travel_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users in company can view policy"
  ON public.travel_policies FOR SELECT
  TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "Admins can insert policy for their company"
  ON public.travel_policies FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.current_user_company_id() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update policy for their company"
  ON public.travel_policies FOR UPDATE
  TO authenticated
  USING (company_id = public.current_user_company_id() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.current_user_company_id() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete policy for their company"
  ON public.travel_policies FOR DELETE
  TO authenticated
  USING (company_id = public.current_user_company_id() AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_travel_policies_updated_at
  BEFORE UPDATE ON public.travel_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
