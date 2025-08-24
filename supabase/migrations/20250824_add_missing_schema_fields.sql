-- Add missing fields to production database
-- Date: 2025-08-24

-- =====================================================
-- 1. ADD MISSING PROFILE FIELDS
-- =====================================================

-- Add subscription_tier column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

-- Add stripe_customer_id column to profiles (with unique constraint)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add unique constraint for stripe_customer_id (only if column doesn't already have it)
DO $$
BEGIN
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_stripe_customer_id_key'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_stripe_customer_id_key 
        UNIQUE (stripe_customer_id);
    END IF;
END $$;

-- =====================================================
-- 2. ADD MISSING TEMPLATE FIELDS  
-- =====================================================

-- Add content_json column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Add thumbnail_url column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add is_featured column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add published column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Add rating column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 0.0;

-- Add reviews_count column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Add price column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION DEFAULT 0.0;

-- Add currency column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add tier_required column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS tier_required TEXT DEFAULT 'free';

-- Add variables column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;

-- Add created_by column
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- =====================================================
-- 3. ADD MISSING INDEXES
-- =====================================================

-- Add index for is_featured
CREATE INDEX IF NOT EXISTS idx_templates_featured ON public.templates(is_featured);

-- Add index for created_by
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);

-- Add index for published
CREATE INDEX IF NOT EXISTS idx_templates_published ON public.templates(published);

-- Add index for rating
CREATE INDEX IF NOT EXISTS idx_templates_rating ON public.templates(rating DESC);

-- Add index for price
CREATE INDEX IF NOT EXISTS idx_templates_price ON public.templates(price);

-- =====================================================
-- 4. UPDATE EXISTING DATA
-- =====================================================

-- Set default values for existing templates
UPDATE public.templates 
SET 
    is_featured = false,
    published = true,  -- Assume existing templates are published
    rating = 0.0,
    reviews_count = 0,
    price = 0.0,
    currency = 'USD',
    tier_required = 'free',
    variables = '[]'::jsonb
WHERE 
    is_featured IS NULL 
    OR published IS NULL 
    OR rating IS NULL 
    OR reviews_count IS NULL 
    OR price IS NULL 
    OR currency IS NULL 
    OR tier_required IS NULL 
    OR variables IS NULL;

-- =====================================================
-- 5. ADD CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Add check constraints for valid values
ALTER TABLE public.templates 
ADD CONSTRAINT IF NOT EXISTS check_rating_range 
CHECK (rating >= 0.0 AND rating <= 5.0);

ALTER TABLE public.templates 
ADD CONSTRAINT IF NOT EXISTS check_price_non_negative 
CHECK (price >= 0.0);

ALTER TABLE public.templates 
ADD CONSTRAINT IF NOT EXISTS check_reviews_count_non_negative 
CHECK (reviews_count >= 0);

ALTER TABLE public.templates 
ADD CONSTRAINT IF NOT EXISTS check_tier_valid 
CHECK (tier_required IN ('free', 'starter', 'professional', 'enterprise'));

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.profiles.subscription_tier IS 'User subscription tier (free, starter, professional, enterprise)';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing';

COMMENT ON COLUMN public.templates.content_json IS 'JSON representation of template content for structured data';
COMMENT ON COLUMN public.templates.thumbnail_url IS 'URL to template thumbnail image';
COMMENT ON COLUMN public.templates.is_featured IS 'Whether template is featured on homepage';
COMMENT ON COLUMN public.templates.published IS 'Whether template is published and visible to users';
COMMENT ON COLUMN public.templates.rating IS 'Average user rating (0.0-5.0)';
COMMENT ON COLUMN public.templates.reviews_count IS 'Number of user reviews';
COMMENT ON COLUMN public.templates.price IS 'Template price in specified currency';
COMMENT ON COLUMN public.templates.currency IS 'Currency for template price (USD, EUR, GBP, etc.)';
COMMENT ON COLUMN public.templates.tier_required IS 'Minimum subscription tier required to use template';
COMMENT ON COLUMN public.templates.variables IS 'JSON array of template variables/placeholders';
COMMENT ON COLUMN public.templates.created_by IS 'Creator identifier (can be user ID or system)';

-- =====================================================
-- 7. UPDATE RLS POLICIES IF NEEDED
-- =====================================================

-- Ensure RLS policies account for new fields
-- (The existing policies should continue to work, but we may want to add specific policies for featured templates)

-- Policy for featured templates (public read)
DROP POLICY IF EXISTS "featured_templates_public" ON public.templates;
CREATE POLICY "featured_templates_public" ON public.templates
    FOR SELECT USING (is_featured = true AND published = true);

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update template rating when reviews are added
CREATE OR REPLACE FUNCTION public.update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called when template reviews are added
    -- For now, just a placeholder for future review system
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.templates 
    SET 
        usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. VERIFY CHANGES
-- =====================================================

-- Log what we've added
DO $$
DECLARE
    profile_columns TEXT;
    template_columns TEXT;
BEGIN
    -- Check profile columns
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO profile_columns
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND table_schema = 'public';
    
    -- Check template columns  
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO template_columns
    FROM information_schema.columns 
    WHERE table_name = 'templates' AND table_schema = 'public';
    
    RAISE NOTICE 'Profile columns: %', profile_columns;
    RAISE NOTICE 'Template columns: %', template_columns;
END $$;