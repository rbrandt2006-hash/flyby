-- Add notification preference columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_trip_updates boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_flight_disruptions boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_expense_approvals boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_weekly_summary boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_match_expenses boolean NOT NULL DEFAULT true;