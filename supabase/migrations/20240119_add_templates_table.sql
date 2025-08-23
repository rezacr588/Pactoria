-- Create templates table for the marketplace
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('nda', 'service', 'employment', 'sales', 'partnership', 'licensing', 'other')),
  content_json JSONB,
  content_md TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  price DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create template ratings table
CREATE TABLE IF NOT EXISTS public.template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Create user templates (saved/purchased templates)
CREATE TABLE IF NOT EXISTS public.user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, template_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON public.templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON public.template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user ON public.template_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_user ON public.user_templates(user_id);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
-- Everyone can view public templates
CREATE POLICY templates_select_public ON public.templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Users can create their own templates
CREATE POLICY templates_insert ON public.templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own templates
CREATE POLICY templates_update ON public.templates
  FOR UPDATE USING (created_by = auth.uid()) 
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own templates
CREATE POLICY templates_delete ON public.templates
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for template ratings
-- Everyone can view ratings
CREATE POLICY template_ratings_select ON public.template_ratings
  FOR SELECT USING (true);

-- Users can create/update their own ratings
CREATE POLICY template_ratings_insert ON public.template_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY template_ratings_update ON public.template_ratings
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY template_ratings_delete ON public.template_ratings
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for user templates
-- Users can view their own saved templates
CREATE POLICY user_templates_select ON public.user_templates
  FOR SELECT USING (user_id = auth.uid());

-- Users can save templates
CREATE POLICY user_templates_insert ON public.user_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can remove saved templates
CREATE POLICY user_templates_delete ON public.user_templates
  FOR DELETE USING (user_id = auth.uid());

-- Function to update template rating average
CREATE OR REPLACE FUNCTION public.update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.templates
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.template_ratings
    WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
  )
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating when ratings change
CREATE TRIGGER update_template_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.template_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_template_rating();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp trigger for templates
CREATE TRIGGER trg_templates_updated
BEFORE UPDATE ON public.templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
