-- CutTheCrap Database Schema for Supabase
-- This migration creates all tables and Row Level Security policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
-- Note: Supabase auth.users handles email, password, etc.
-- This table stores additional profile information
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'verified_author', 'user')) DEFAULT 'user',
  party VARCHAR(50) CHECK (party IN ('democratic', 'republican', 'independent')),
  title VARCHAR(255),
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sponsor VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  congress INTEGER NOT NULL,
  chamber VARCHAR(50) NOT NULL,
  introduced_date DATE,
  last_action_date DATE,
  summary TEXT,
  big_picture JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bill Sections
CREATE TABLE public.bill_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  section_number VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  preview TEXT,
  simplified_summary TEXT NOT NULL,
  deep_dive JSONB,
  ideology_score INTEGER CHECK (ideology_score BETWEEN -5 AND 5),
  political_lean INTEGER CHECK (political_lean BETWEEN -5 AND 5),
  economic_tags TEXT[],
  risk_notes TEXT[],
  raw_text TEXT,
  content_hash VARCHAR(64) NOT NULL,
  section_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bill_id, section_number)
);

-- Votes
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  chamber VARCHAR(50) NOT NULL,
  vote_date DATE NOT NULL,
  result VARCHAR(50) NOT NULL,
  yeas INTEGER NOT NULL,
  nays INTEGER NOT NULL,
  present INTEGER DEFAULT 0,
  not_voting INTEGER DEFAULT 0,
  breakdown JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partisan Perspectives
CREATE TABLE public.partisan_perspectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  party VARCHAR(50) NOT NULL,
  perspective TEXT NOT NULL,
  key_points TEXT[],
  concerns TEXT[],
  supports TEXT[],
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bill_id, party)
);

-- Content Cache
CREATE TABLE public.content_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash VARCHAR(64) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Audit Log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_bills_number ON public.bills(number);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bills_congress ON public.bills(congress);
CREATE INDEX idx_bill_sections_bill_id ON public.bill_sections(bill_id);
CREATE INDEX idx_bill_sections_content_hash ON public.bill_sections(content_hash);
CREATE INDEX idx_votes_bill_id ON public.votes(bill_id);
CREATE INDEX idx_partisan_perspectives_bill_id ON public.partisan_perspectives(bill_id);
CREATE INDEX idx_partisan_perspectives_author_id ON public.partisan_perspectives(author_id);
CREATE INDEX idx_content_cache_hash ON public.content_cache(content_hash);
CREATE INDEX idx_content_cache_expires ON public.content_cache(expires_at);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.content_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bill_sections_updated_at
  BEFORE UPDATE ON public.bill_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partisan_perspectives_updated_at
  BEFORE UPDATE ON public.partisan_perspectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partisan_perspectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bills Policies
CREATE POLICY "Bills are viewable by everyone"
  ON public.bills FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert bills"
  ON public.bills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update bills"
  ON public.bills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bill Sections Policies
CREATE POLICY "Bill sections are viewable by everyone"
  ON public.bill_sections FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify bill sections"
  ON public.bill_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Votes Policies
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify votes"
  ON public.votes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Partisan Perspectives Policies
CREATE POLICY "Perspectives are viewable by everyone"
  ON public.partisan_perspectives FOR SELECT
  USING (verified = true);

CREATE POLICY "Verified authors can insert their perspectives"
  ON public.partisan_perspectives FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role = 'verified_author'
        AND verified = true
    )
  );

CREATE POLICY "Authors can update their own perspectives"
  ON public.partisan_perspectives FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all perspectives"
  ON public.partisan_perspectives FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Content Cache Policies (internal use)
CREATE POLICY "Cache is accessible by authenticated users"
  ON public.content_cache FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify cache"
  ON public.content_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit Log Policies
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is verified author
CREATE OR REPLACE FUNCTION public.is_verified_author(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id
      AND role = 'verified_author'
      AND verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
