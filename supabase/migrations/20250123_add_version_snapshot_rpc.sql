-- Add RPC function for creating version snapshots
-- Date: 2025-01-23

-- =====================================================
-- VERSION SNAPSHOT RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_version_snapshot(
  p_contract_id UUID,
  p_content_json JSONB DEFAULT NULL,
  p_content_md TEXT DEFAULT NULL,
  p_ydoc_state_base64 TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  contract_id UUID,
  version_number INTEGER,
  content_json JSONB,
  content_md TEXT,
  ydoc_state BYTEA,
  created_by UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_version INTEGER;
  v_created_by UUID;
  v_new_version RECORD;
BEGIN
  -- Get the current user ID
  v_created_by := auth.uid();
  
  -- Verify user has access to the contract
  IF NOT public.has_contract_access(v_created_by, p_contract_id) THEN
    RAISE EXCEPTION 'Access denied to contract %', p_contract_id;
  END IF;

  -- Lock the contract row to prevent concurrent version creation
  PERFORM 1 FROM public.contracts 
  WHERE public.contracts.id = p_contract_id 
  FOR UPDATE;
  
  -- Get the next version number
  SELECT COALESCE(MAX(cv.version_number), 0) + 1
  INTO v_next_version
  FROM public.contract_versions cv
  WHERE cv.contract_id = p_contract_id;

  -- Insert the new version
  INSERT INTO public.contract_versions (
    contract_id,
    version_number,
    content_json,
    content_md,
    ydoc_state,
    created_by
  ) VALUES (
    p_contract_id,
    v_next_version,
    p_content_json,
    p_content_md,
    CASE 
      WHEN p_ydoc_state_base64 IS NOT NULL 
      THEN decode(p_ydoc_state_base64, 'base64')
      ELSE NULL
    END,
    v_created_by
  )
  RETURNING * INTO v_new_version;

  -- Update the contract's latest version number
  UPDATE public.contracts 
  SET latest_version_number = v_next_version,
      updated_at = NOW()
  WHERE public.contracts.id = p_contract_id;

  -- Return the new version
  RETURN QUERY
  SELECT 
    v_new_version.id,
    v_new_version.contract_id,
    v_new_version.version_number,
    v_new_version.content_json,
    v_new_version.content_md,
    v_new_version.ydoc_state,
    v_new_version.created_by,
    v_new_version.created_at;
END;
$$;

-- =====================================================
-- COMMENTS AND PERMISSIONS
-- =====================================================

COMMENT ON FUNCTION public.create_version_snapshot IS 'Create a new version snapshot for a contract with atomic version number assignment';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_version_snapshot TO authenticated, anon;