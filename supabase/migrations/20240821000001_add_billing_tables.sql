-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  tier_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organizations table for team management
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT UNIQUE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, user_id)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  stripe_invoice_url TEXT,
  stripe_pdf_url TEXT,
  amount_paid INTEGER,
  amount_due INTEGER,
  currency TEXT DEFAULT 'gbp',
  status TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT NOT NULL,
  type TEXT NOT NULL, -- 'subscription', 'template', 'api_usage'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alter existing templates table to add missing columns for marketplace features
ALTER TABLE IF EXISTS public.templates 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'UK',
ADD COLUMN IF NOT EXISTS content JSONB,
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tier_required TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Create template purchases table
CREATE TABLE IF NOT EXISTS public.template_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id),
  price_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Create API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 1000, -- requests per hour
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create usage limits table
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  contracts_used INTEGER DEFAULT 0,
  contracts_limit INTEGER,
  ai_requests_used INTEGER DEFAULT 0,
  ai_requests_limit INTEGER,
  api_calls_used INTEGER DEFAULT 0,
  api_calls_limit INTEGER,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, period_start),
  UNIQUE(organization_id, period_start)
);

-- Add subscription reference to users profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_published ON public.templates(published);
CREATE INDEX IF NOT EXISTS idx_template_purchases_user ON public.template_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON public.api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON public.api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user ON public.usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_org ON public.usage_limits(organization_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their organizations" ON public.organizations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- RLS Policies for organization members
CREATE POLICY "Members can view organization members" ON public.organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for templates
CREATE POLICY "Anyone can view published templates" ON public.templates
  FOR SELECT USING (published = true);

CREATE POLICY "Authors can manage own templates" ON public.templates
  FOR ALL USING (created_by = auth.uid() OR author_id = auth.uid());

-- RLS Policies for template purchases
CREATE POLICY "Users can view own purchases" ON public.template_purchases
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for API keys
CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for usage limits
CREATE POLICY "Users can view own usage" ON public.usage_limits
  FOR SELECT USING (user_id = auth.uid());

-- Create functions for usage tracking
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_current INTEGER;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current period
  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + interval '1 month';
  
  -- Get or create usage record
  INSERT INTO public.usage_limits (
    user_id, period_start, period_end
  ) VALUES (
    p_user_id, v_period_start, v_period_end
  ) ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Update usage based on type
  IF p_usage_type = 'contracts' THEN
    UPDATE public.usage_limits
    SET contracts_used = contracts_used + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    AND period_start = v_period_start
    RETURNING contracts_used, contracts_limit INTO v_current, v_limit;
    
  ELSIF p_usage_type = 'ai_requests' THEN
    UPDATE public.usage_limits
    SET ai_requests_used = ai_requests_used + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    AND period_start = v_period_start
    RETURNING ai_requests_used, ai_requests_limit INTO v_current, v_limit;
    
  ELSIF p_usage_type = 'api_calls' THEN
    UPDATE public.usage_limits
    SET api_calls_used = api_calls_used + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    AND period_start = v_period_start
    RETURNING api_calls_used, api_calls_limit INTO v_current, v_limit;
  END IF;
  
  -- Check if limit exceeded
  IF v_limit IS NOT NULL AND v_current > v_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
