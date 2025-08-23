-- Critical Production Fixes Migration
-- Date: 2024-12-22
-- Purpose: Fix critical bugs identified in backend review

-- =====================================================
-- 1. ADD MISSING METADATA COLUMN TO CONTRACTS
-- =====================================================
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_contracts_metadata 
ON public.contracts USING gin(metadata);

-- Add missing status index for performance
CREATE INDEX IF NOT EXISTS idx_contracts_status 
ON public.contracts(status);

-- =====================================================
-- 2. CREATE RATE LIMITING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, endpoint, window_start)
);

-- Indexes for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_client ON public.rate_limits(client_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limit policies (service role only for writing, anyone can read their own)
CREATE POLICY "Service role manages rate limits" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own rate limits" ON public.rate_limits
  FOR SELECT USING (client_id = auth.uid()::text OR client_id = current_setting('request.headers', true)::json->>'x-real-ip');

-- =====================================================
-- 3. ATOMIC CONTRACT VERSION CREATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_contract_snapshot(
  p_contract_id UUID,
  p_content_json JSONB,
  p_content_md TEXT,
  p_ydoc_state BYTEA,
  p_user_id UUID
) RETURNS contract_versions 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version contract_versions;
  v_new_version_number INT;
  v_has_access BOOLEAN;
BEGIN
  -- Check if user has access to the contract
  SELECT public.has_contract_access(p_user_id, p_contract_id) INTO v_has_access;
  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Access denied to contract %', p_contract_id;
  END IF;

  -- Lock the contract row to prevent concurrent updates
  PERFORM 1 FROM contracts WHERE id = p_contract_id FOR UPDATE;
  
  -- Get next version number atomically
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_new_version_number
  FROM contract_versions 
  WHERE contract_id = p_contract_id;
  
  -- Create new version
  INSERT INTO contract_versions (
    contract_id,
    version_number,
    content_json,
    content_md,
    ydoc_state,
    created_by,
    created_at
  ) VALUES (
    p_contract_id,
    v_new_version_number,
    p_content_json,
    p_content_md,
    p_ydoc_state,
    p_user_id,
    NOW()
  ) RETURNING * INTO v_version;
  
  -- Update contract's latest version and timestamp
  UPDATE contracts 
  SET 
    latest_version_number = v_new_version_number,
    updated_at = NOW()
  WHERE id = p_contract_id;
  
  RETURN v_version;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating contract snapshot: %', SQLERRM;
    RAISE;
END;
$$;

-- =====================================================
-- 4. RATE LIMITING CHECK FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_client_id TEXT,
  p_endpoint TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  v_window_end := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Upsert rate limit record
  INSERT INTO public.rate_limits (
    client_id, 
    endpoint, 
    request_count, 
    window_start, 
    window_end
  ) VALUES (
    p_client_id, 
    p_endpoint, 
    1, 
    v_window_start, 
    v_window_end
  )
  ON CONFLICT (client_id, endpoint, window_start) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_current_count;
  
  -- Clean old records (async, don't block)
  DELETE FROM public.rate_limits 
  WHERE window_end < NOW() - INTERVAL '1 hour';
  
  RETURN v_current_count <= p_limit;
END;
$$;

-- =====================================================
-- 5. IMPROVED CONTRACT ACCESS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_contract_access(u uuid, c uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contracts x 
    WHERE x.id = c AND x.owner_id = u
    
    UNION ALL
    
    SELECT 1 FROM public.contract_approvals a 
    WHERE a.contract_id = c AND a.approver_id = u
    
    UNION ALL
    
    SELECT 1 FROM public.contract_collaborators cc
    WHERE cc.contract_id = c AND cc.user_id = u
  );
$$;

-- =====================================================
-- 6. GET CONTRACT WITH RELATIONS (FIX N+1)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_contract_details(
  p_contract_id UUID,
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_has_access BOOLEAN;
BEGIN
  -- Check access
  SELECT public.has_contract_access(p_user_id, p_contract_id) INTO v_has_access;
  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Access denied to contract %', p_contract_id;
  END IF;
  
  -- Get all data in one query
  SELECT json_build_object(
    'contract', row_to_json(c.*),
    'versions', COALESCE(json_agg(DISTINCT v.*) FILTER (WHERE v.id IS NOT NULL), '[]'::json),
    'approvals', COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]'::json),
    'collaborators', COALESCE(json_agg(DISTINCT col.*) FILTER (WHERE col.id IS NOT NULL), '[]'::json)
  ) INTO v_result
  FROM contracts c
  LEFT JOIN contract_versions v ON v.contract_id = c.id
  LEFT JOIN contract_approvals a ON a.contract_id = c.id
  LEFT JOIN contract_collaborators col ON col.contract_id = c.id
  WHERE c.id = p_contract_id
  GROUP BY c.id;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- 7. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contract_versions_created_at 
ON public.contract_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contract_approvals_status 
ON public.contract_approvals(status);

CREATE INDEX IF NOT EXISTS idx_contract_approvals_decided_at 
ON public.contract_approvals(decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_tags 
ON public.templates USING gin(tags);

-- =====================================================
-- 8. VALIDATION FUNCTION FOR CONTRACT STATUS
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_contract_status_transition(
  p_contract_id UUID,
  p_current_status TEXT,
  p_new_status TEXT,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_is_approver BOOLEAN;
BEGIN
  -- Check if user is owner
  SELECT EXISTS(
    SELECT 1 FROM contracts 
    WHERE id = p_contract_id AND owner_id = p_user_id
  ) INTO v_is_owner;
  
  -- Check if user is approver
  SELECT EXISTS(
    SELECT 1 FROM contract_approvals 
    WHERE contract_id = p_contract_id AND approver_id = p_user_id
  ) INTO v_is_approver;
  
  -- Define valid transitions
  CASE p_current_status
    WHEN 'draft' THEN
      -- From draft, can go to in_review (owner only)
      IF p_new_status = 'in_review' AND v_is_owner THEN
        RETURN TRUE;
      END IF;
    
    WHEN 'in_review' THEN
      -- From in_review, can go to approved/rejected (approver) or draft (owner)
      IF p_new_status IN ('approved', 'rejected') AND v_is_approver THEN
        RETURN TRUE;
      ELSIF p_new_status = 'draft' AND v_is_owner THEN
        RETURN TRUE;
      END IF;
    
    WHEN 'approved' THEN
      -- From approved, can go to signed (owner only)
      IF p_new_status = 'signed' AND v_is_owner THEN
        RETURN TRUE;
      END IF;
    
    WHEN 'rejected' THEN
      -- From rejected, can go back to draft (owner only)
      IF p_new_status = 'draft' AND v_is_owner THEN
        RETURN TRUE;
      END IF;
  END CASE;
  
  -- Invalid transition
  RETURN FALSE;
END;
$$;

-- =====================================================
-- 9. ADD TRIGGER FOR RATE LIMIT CLEANUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$;

-- =====================================================
-- 10. ADD APPROVAL VALIDATION TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_approval_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent changing from decided status
  IF OLD.status IN ('approved', 'rejected') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Cannot change approval status once decided';
  END IF;
  
  -- Set decided_at timestamp
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    NEW.decided_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_approval_update_trigger ON public.contract_approvals;
CREATE TRIGGER validate_approval_update_trigger
BEFORE UPDATE ON public.contract_approvals
FOR EACH ROW EXECUTE FUNCTION public.validate_approval_update();

-- =====================================================
-- 11. UPDATE TIMESTAMP TRIGGER FOR RATE LIMITS
-- =====================================================
DROP TRIGGER IF EXISTS trg_rate_limits_updated ON public.rate_limits;
CREATE TRIGGER trg_rate_limits_updated
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 12. GRANT NECESSARY PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.create_contract_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_contract_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_contract_status_transition TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Run these to confirm fixes)
-- =====================================================
-- Check if metadata column exists
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'contracts' AND column_name = 'metadata';

-- Check if rate_limits table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'rate_limits';

-- Check if functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('create_contract_snapshot', 'check_rate_limit', 'get_contract_details');
