-- Add missing foreign key relationships

-- Add foreign key for templates.created_by_user_id -> profiles.id
ALTER TABLE public.templates 
ADD CONSTRAINT templates_created_by_user_id_fkey 
FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign key for contract_activity.user_id -> profiles.id
ALTER TABLE public.contract_activity 
ADD CONSTRAINT contract_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add missing metadata column to contracts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'metadata') THEN
        ALTER TABLE public.contracts ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_templates_created_by_user_id ON public.templates(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_contract_activity_user_id ON public.contract_activity(user_id);