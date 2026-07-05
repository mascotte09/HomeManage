ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'landlord';
