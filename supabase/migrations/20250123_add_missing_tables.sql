-- Add missing tables and fix schema issues
-- Date: 2025-01-23

-- =====================================================
-- 1. CREATE CONTRACT_PARTIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contract_parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  party_name TEXT NOT NULL,
  party_email TEXT,
  party_type TEXT NOT NULL DEFAULT 'individual' CHECK (party_type IN ('individual', 'organization', 'witness')),
  party_role TEXT NOT NULL DEFAULT 'party' CHECK (party_role IN ('party', 'witness', 'notary')),
  is_primary BOOLEAN DEFAULT false,
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contract_parties
CREATE INDEX IF NOT EXISTS idx_contract_parties_contract_id ON public.contract_parties(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_parties_email ON public.contract_parties(party_email);

-- =====================================================
-- 2. CREATE CONTRACT_METADATA TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contract_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  value_type TEXT DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, key)
);

-- Indexes for contract_metadata
CREATE INDEX IF NOT EXISTS idx_contract_metadata_contract_id ON public.contract_metadata(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_metadata_key ON public.contract_metadata(key);

-- =====================================================
-- 3. CREATE CONTRACT_ACTIVITY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contract_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contract_activity
CREATE INDEX IF NOT EXISTS idx_contract_activity_contract_id ON public.contract_activity(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activity_user_id ON public.contract_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_activity_created_at ON public.contract_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_activity_action ON public.contract_activity(action);

-- =====================================================
-- 4. FIX RATE_LIMITS TABLE (recreate with correct schema)
-- =====================================================
DROP TABLE IF EXISTS public.rate_limits CASCADE;

CREATE TABLE public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  reset_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key)
);

-- Indexes for rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON public.rate_limits(reset_time);

-- =====================================================
-- 5. UPDATE TRIGGERS FOR UPDATED_AT COLUMNS
-- =====================================================
CREATE TRIGGER trg_contract_parties_updated 
  BEFORE UPDATE ON public.contract_parties 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contract_metadata_updated 
  BEFORE UPDATE ON public.contract_metadata 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 6. RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE public.contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Contract parties policies
CREATE POLICY "contract_parties_select" ON public.contract_parties
  FOR SELECT USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_parties_insert" ON public.contract_parties
  FOR INSERT WITH CHECK (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_parties_update" ON public.contract_parties
  FOR UPDATE USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_parties_delete" ON public.contract_parties
  FOR DELETE USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

-- Contract metadata policies
CREATE POLICY "contract_metadata_select" ON public.contract_metadata
  FOR SELECT USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_metadata_insert" ON public.contract_metadata
  FOR INSERT WITH CHECK (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_metadata_update" ON public.contract_metadata
  FOR UPDATE USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_metadata_delete" ON public.contract_metadata
  FOR DELETE USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

-- Contract activity policies
CREATE POLICY "contract_activity_select" ON public.contract_activity
  FOR SELECT USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

CREATE POLICY "contract_activity_insert" ON public.contract_activity
  FOR INSERT WITH CHECK (
    public.has_contract_access(auth.uid(), contract_id)
  );

-- Rate limits policies (service role only)
CREATE POLICY "rate_limits_service_role" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. ADD MISSING RLS POLICIES FOR EXISTING TABLES
-- =====================================================

-- Add missing INSERT policy for contract_versions
DROP POLICY IF EXISTS "versions_insert" ON public.contract_versions;
CREATE POLICY "versions_insert" ON public.contract_versions
  FOR INSERT WITH CHECK (
    public.has_contract_access(auth.uid(), contract_id)
  );

-- Add missing UPDATE policy for contract_versions
DROP POLICY IF EXISTS "versions_update" ON public.contract_versions;
CREATE POLICY "versions_update" ON public.contract_versions
  FOR UPDATE USING (
    public.has_contract_access(auth.uid(), contract_id)
  );

-- =====================================================
-- 8. HELPER FUNCTION TO LOG ACTIVITY
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_contract_activity(
  p_contract_id UUID,
  p_action TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.contract_activity (
    contract_id,
    user_id,
    action,
    description,
    metadata
  ) VALUES (
    p_contract_id,
    auth.uid(),
    p_action,
    p_description,
    p_metadata
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- 9. TRIGGERS TO AUTO-LOG ACTIVITY
-- =====================================================

-- Function to log contract changes
CREATE OR REPLACE FUNCTION public.log_contract_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_contract_activity(
      NEW.id,
      'created',
      'Contract created: ' || NEW.title
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      PERFORM public.log_contract_activity(
        NEW.id,
        'status_changed',
        'Status changed from ' || OLD.status || ' to ' || NEW.status
      );
    END IF;
    -- Log title changes
    IF OLD.title != NEW.title THEN
      PERFORM public.log_contract_activity(
        NEW.id,
        'title_changed',
        'Title changed from "' || OLD.title || '" to "' || NEW.title || '"'
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to log version changes
CREATE OR REPLACE FUNCTION public.log_version_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_contract_activity(
      NEW.contract_id,
      'version_created',
      'Version ' || NEW.version_number || ' created'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_log_contract_changes ON public.contracts;
CREATE TRIGGER trg_log_contract_changes
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contract_changes();

DROP TRIGGER IF EXISTS trg_log_version_changes ON public.contract_versions;
CREATE TRIGGER trg_log_version_changes
  AFTER INSERT ON public.contract_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_version_changes();

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.contract_parties IS 'Stores parties involved in contracts (signers, witnesses, etc.)';
COMMENT ON TABLE public.contract_metadata IS 'Flexible key-value storage for contract metadata';
COMMENT ON TABLE public.contract_activity IS 'Activity log for contract changes and actions';
COMMENT ON FUNCTION public.log_contract_activity IS 'Helper function to log activity on contracts';