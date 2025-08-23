-- Performance optimizations and data validation constraints
-- This migration adds missing indexes and improves RLS helper function performance

-- =====================
-- Add missing indexes for performance
-- =====================

-- Index for timeline queries on contract versions
CREATE INDEX IF NOT EXISTS idx_versions_created_at 
ON public.contract_versions(created_at DESC);

-- Composite index for contract version lookups
CREATE INDEX IF NOT EXISTS idx_versions_contract_created 
ON public.contract_versions(contract_id, created_at DESC);

-- Index for filtering pending approvals
CREATE INDEX IF NOT EXISTS idx_approvals_status 
ON public.contract_approvals(status);

-- Index for approval workflow queries
CREATE INDEX IF NOT EXISTS idx_approvals_decided_at 
ON public.contract_approvals(decided_at);

-- Composite index for approval queries
CREATE INDEX IF NOT EXISTS idx_approvals_contract_status 
ON public.contract_approvals(contract_id, status);

-- Index for collaboration session queries
CREATE INDEX IF NOT EXISTS idx_collab_ended_at 
ON public.collab_sessions(ended_at);

-- =====================
-- Optimize RLS helper function
-- =====================

-- Drop the old function CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.has_contract_access(uuid, uuid) CASCADE;

-- Create optimized version that combines both EXISTS queries
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
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_contract_access(uuid, uuid) TO authenticated, anon;

-- =====================
-- Add data validation constraints
-- =====================

-- Add CHECK constraint for contract status enum
ALTER TABLE public.contracts 
DROP CONSTRAINT IF EXISTS contracts_status_check;

ALTER TABLE public.contracts 
ADD CONSTRAINT contracts_status_check 
CHECK (status IN ('draft', 'in_review', 'approved', 'rejected', 'signed'));

-- Add CHECK constraint for approval status enum
ALTER TABLE public.contract_approvals 
DROP CONSTRAINT IF EXISTS approvals_status_check;

ALTER TABLE public.contract_approvals 
ADD CONSTRAINT approvals_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add CHECK constraint for positive version numbers
ALTER TABLE public.contract_versions 
DROP CONSTRAINT IF EXISTS versions_number_positive;

ALTER TABLE public.contract_versions 
ADD CONSTRAINT versions_number_positive 
CHECK (version_number > 0);

-- Add CHECK constraint for positive latest version number
ALTER TABLE public.contracts 
DROP CONSTRAINT IF EXISTS contracts_latest_version_positive;

ALTER TABLE public.contracts 
ADD CONSTRAINT contracts_latest_version_positive 
CHECK (latest_version_number >= 0);

-- Add trigger to ensure decided_at is set when approval status changes from pending
CREATE OR REPLACE FUNCTION public.set_approval_decided_at()
RETURNS trigger 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set decided_at when status changes from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') AND NEW.decided_at IS NULL THEN
    NEW.decided_at = NOW();
  END IF;
  
  -- Ensure decided_at is set for non-pending statuses
  IF NEW.status != 'pending' AND NEW.decided_at IS NULL THEN
    NEW.decided_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for approval decided_at
DROP TRIGGER IF EXISTS trg_approvals_decided ON public.contract_approvals;
CREATE TRIGGER trg_approvals_decided
BEFORE UPDATE ON public.contract_approvals
FOR EACH ROW 
EXECUTE FUNCTION public.set_approval_decided_at();

-- =====================
-- Add metadata columns for better tracking
-- =====================

-- Add metadata column to contracts if not exists
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add index on metadata for test data filtering (used in tests)
CREATE INDEX IF NOT EXISTS idx_contracts_metadata_test 
ON public.contracts((metadata->>'test')) 
WHERE metadata->>'test' IS NOT NULL;

-- =====================
-- Performance statistics view (optional, useful for monitoring)
-- =====================

CREATE OR REPLACE VIEW public.contract_stats AS
SELECT 
  c.id as contract_id,
  c.title,
  c.status,
  c.latest_version_number,
  COUNT(DISTINCT cv.id) as total_versions,
  COUNT(DISTINCT ca.id) as total_approvals,
  COUNT(DISTINCT CASE WHEN ca.status = 'pending' THEN ca.id END) as pending_approvals,
  MAX(cv.created_at) as last_version_date,
  c.created_at,
  c.updated_at
FROM public.contracts c
LEFT JOIN public.contract_versions cv ON cv.contract_id = c.id
LEFT JOIN public.contract_approvals ca ON ca.contract_id = c.id
GROUP BY c.id, c.title, c.status, c.latest_version_number, c.created_at, c.updated_at;

-- Grant select on the view
GRANT SELECT ON public.contract_stats TO authenticated, anon;

-- =====================
-- Add comments for documentation
-- =====================

COMMENT ON FUNCTION public.has_contract_access IS 'Optimized RLS helper to check if a user has access to a contract (owner or approver)';
COMMENT ON INDEX idx_versions_created_at IS 'Index for efficient timeline queries';
COMMENT ON INDEX idx_approvals_contract_status IS 'Composite index for approval workflow queries';
COMMENT ON VIEW public.contract_stats IS 'Aggregated statistics view for contracts dashboard';
