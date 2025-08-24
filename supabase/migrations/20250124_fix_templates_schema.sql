-- Fix templates table schema alignment
-- Date: 2025-01-24

-- Add missing columns if they don't exist
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS tier_required TEXT DEFAULT 'free';

ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;

-- Update existing templates to have proper variables from content_json
UPDATE public.templates 
SET variables = COALESCE(content_json->'variables', '[]'::jsonb)
WHERE content_json IS NOT NULL;

-- Create system user if it doesn't exist (for sample templates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'system@contractforge.com') THEN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'system@contractforge.com',
            crypt('SystemUser2024!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "System", "role": "system"}'::jsonb
        );
    END IF;
END $$;

-- Fix the increment_template_usage function
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.templates 
    SET usage_count = usage_count + 1 
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;