-- Enable anonymous sign-ins by updating auth configuration
-- This will be configured in the Supabase dashboard under Authentication > Settings
-- For now, let's ensure our profiles table can handle the auth flow properly

-- Update profiles table to better handle anonymous users
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Add an index on principal_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_principal_id ON public.profiles(principal_id);

-- Update the handle_new_user function to work with anonymous auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if one doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.profiles (
      user_id,
      name,
      email,
      principal_id,
      wallet_balance
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous User'),
      NEW.email,
      NEW.raw_user_meta_data->>'principal_id',
      100
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;