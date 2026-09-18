-- Make a user an admin
-- Run this in Supabase SQL Editor after a user signs up

-- Replace 'your-email@example.com' with the user's email
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, full_name, is_admin FROM public.profiles WHERE is_admin = TRUE;
