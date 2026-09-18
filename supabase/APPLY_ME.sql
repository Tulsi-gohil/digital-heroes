-- Digital Heroes Database Schema
-- Supabase SQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL
);

-- Subscriptions	table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled_at_period_end')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Charity table
CREATE TABLE public.charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User charity selection
CREATE TABLE public.user_charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
  contribution_percentage INTEGER NOT NULL CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, charity_id)
);

-- Golf scores table
CREATE TABLE public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, score_date)
);

-- Draws table
CREATE TABLE public.draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  draw_type TEXT NOT NULL CHECK (draw_type IN ('random', 'algorithmic')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'simulated', 'published', 'completed')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  published_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  total_subscribers INTEGER DEFAULT 0,
  prize_pool_amount DECIMAL(10, 2) DEFAULT 0,
  jackpot_rollover_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Draw entries table
CREATE TABLE public.draw_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  numbers TEXT[] NOT NULL, -- Array of 5 numbers for the draw
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(draw_id, user_id)
);

-- Draw results table
CREATE TABLE public.draw_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  winning_numbers TEXT[] NOT NULL,
  five_match_count INTEGER DEFAULT 0,
  four_match_count INTEGER DEFAULT 0,
  three_match_count INTEGER DEFAULT 0,
  five_match_prize DECIMAL(10, 2) DEFAULT 0,
  four_match_prize DECIMAL(10, 2) DEFAULT 0,
  three_match_prize DECIMAL(10, 2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Winners table
CREATE TABLE public.winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('5-number', '4-number', '3-number')),
  prize_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'verified', 'paid', 'rejected')),
  proof_image_url TEXT,
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_scores_user_id ON public.scores(user_id);
CREATE INDEX idx_scores_score_date ON public.scores(score_date DESC);
CREATE INDEX idx_draws_status ON public.draws(status);
CREATE INDEX idx_draws_scheduled_date ON public.draws(scheduled_date);
CREATE INDEX idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX idx_winners_user_id ON public.winners(user_id);
CREATE INDEX idx_winners_payment_status ON public.winners(payment_status);
CREATE INDEX idx_user_charities_user_id ON public.user_charities(user_id);
CREATE INDEX idx_charities_featured ON public.charities(featured);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_charities_updated_at BEFORE UPDATE ON public.charities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_charities_updated_at BEFORE UPDATE ON public.user_charities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_scores_updated_at BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_draws_updated_at BEFORE UPDATE ON public.draws
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_winners_updated_at BEFORE UPDATE ON public.winners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
CREATE POLICY "Admins can update subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Charities (public read, admin write)
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view charities" ON public.charities
  FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage charities" ON public.charities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- User charities
ALTER TABLE public.user_charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own charity selection" ON public.user_charities
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own charity selection" ON public.user_charities
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own charity selection" ON public.user_charities
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all user charities" ON public.user_charities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Scores
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scores" ON public.scores
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own scores" ON public.scores
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own scores" ON public.scores
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own scores" ON public.scores
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all scores" ON public.scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
CREATE POLICY "Admins can update all scores" ON public.scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Draws
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published draws" ON public.draws
  FOR SELECT USING (status IN ('published', 'completed'));
CREATE POLICY "Admins can manage draws" ON public.draws
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Draw entries
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON public.draw_entries
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own entries" ON public.draw_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all entries" ON public.draw_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Draw results
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published results" ON public.draw_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.draws
      WHERE id = draw_id AND status IN ('published', 'completed')
    )
  );
CREATE POLICY "Admins can manage results" ON public.draw_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Winners
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own winnings" ON public.winners
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own winnings" ON public.winners
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage winners" ON public.winners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
