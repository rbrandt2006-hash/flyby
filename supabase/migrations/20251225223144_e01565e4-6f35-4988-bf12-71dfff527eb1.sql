-- Create companies table (organizations identified by email domain)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create travel preferences table
CREATE TABLE public.travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_airlines TEXT[] DEFAULT '{}',
  preferred_seat TEXT DEFAULT 'window',
  preferred_class TEXT DEFAULT 'economy',
  preferred_hotel_brands TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT,
  budget_threshold_per_day NUMERIC DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_preferences ENABLE ROW LEVEL SECURITY;

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_address TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'booked', 'completed', 'cancelled')),
  purpose TEXT,
  flight_details JSONB DEFAULT '{}',
  hotel_details JSONB DEFAULT '{}',
  ground_transport JSONB DEFAULT '{}',
  total_estimated_cost NUMERIC DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('flight', 'hotel', 'ground_transport', 'meals', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  receipt_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create team messages table for company chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'notification', 'booking_update')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create travel alerts table for disruption monitoring
CREATE TABLE public.travel_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('weather', 'delay', 'cancellation', 'gate_change', 'price_drop')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_alerts ENABLE ROW LEVEL SECURITY;

-- Create calendar suggestions table for predictive travel
CREATE TABLE public.calendar_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  detected_location TEXT,
  suggested_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_suggestions ENABLE ROW LEVEL SECURITY;

-- Create documents table for travel documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('boarding_pass', 'hotel_confirmation', 'car_rental', 'itinerary', 'receipt', 'other')),
  file_url TEXT,
  file_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for travel_preferences
CREATE POLICY "Users can manage their own preferences" ON public.travel_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for trips
CREATE POLICY "Users can view trips in their company" ON public.trips
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own trips" ON public.trips
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their company" ON public.expenses
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own expenses" ON public.expenses
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their company" ON public.messages
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their company" ON public.messages
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- RLS Policies for travel_alerts
CREATE POLICY "Users can view their own alerts" ON public.travel_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own alerts" ON public.travel_alerts
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for calendar_suggestions
CREATE POLICY "Users can manage their own suggestions" ON public.calendar_suggestions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for documents
CREATE POLICY "Users can manage their own documents" ON public.documents
  FOR ALL USING (user_id = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_travel_preferences_updated_at BEFORE UPDATE ON public.travel_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create company from email domain
CREATE OR REPLACE FUNCTION public.get_or_create_company(email_input TEXT)
RETURNS UUID AS $$
DECLARE
  domain_part TEXT;
  company_uuid UUID;
BEGIN
  domain_part := split_part(email_input, '@', 2);
  
  SELECT id INTO company_uuid FROM public.companies WHERE domain = domain_part;
  
  IF company_uuid IS NULL THEN
    INSERT INTO public.companies (name, domain)
    VALUES (initcap(split_part(domain_part, '.', 1)), domain_part)
    RETURNING id INTO company_uuid;
  END IF;
  
  RETURN company_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_uuid UUID;
BEGIN
  company_uuid := public.get_or_create_company(NEW.email);
  
  INSERT INTO public.profiles (user_id, email, company_id, full_name)
  VALUES (NEW.id, NEW.email, company_uuid, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.travel_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();