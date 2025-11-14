-- Add analysis requests table for user-requested historical bills
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.analysis_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
  bill_number VARCHAR(50) NOT NULL,
  congress INTEGER NOT NULL,
  requested_by UUID REFERENCES public.user_profiles(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analysis_requests_status ON public.analysis_requests(status);
CREATE INDEX idx_analysis_requests_bill_id ON public.analysis_requests(bill_id);
CREATE INDEX idx_analysis_requests_requested_by ON public.analysis_requests(requested_by);
CREATE INDEX idx_analysis_requests_created_at ON public.analysis_requests(created_at);

-- RLS Policies
ALTER TABLE public.analysis_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view analysis requests
CREATE POLICY "Analysis requests are viewable by everyone"
  ON public.analysis_requests FOR SELECT
  USING (true);

-- Authenticated users can request analysis
CREATE POLICY "Authenticated users can request analysis"
  ON public.analysis_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update analysis requests
CREATE POLICY "Admins can update analysis requests"
  ON public.analysis_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_analysis_requests_updated_at
  BEFORE UPDATE ON public.analysis_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add current congress tracking
CREATE TABLE IF NOT EXISTS public.system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current congress (118th, 2023-2025)
INSERT INTO public.system_config (key, value, description)
VALUES (
  'current_congress',
  '{"number": 118, "start_year": 2023, "end_year": 2025}',
  'Current congressional session for automatic bill imports'
)
ON CONFLICT (key) DO NOTHING;

-- RLS for system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System config viewable by everyone"
  ON public.system_config FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify system config"
  ON public.system_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
