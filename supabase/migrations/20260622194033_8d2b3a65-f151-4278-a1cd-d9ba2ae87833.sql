ALTER TABLE public.travel_preferences
  ADD COLUMN IF NOT EXISTS avoid_layovers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_sensitivity text NOT NULL DEFAULT 'medium'
    CHECK (cost_sensitivity IN ('low','medium','high'));