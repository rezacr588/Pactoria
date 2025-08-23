-- Fix contract creation by auto-setting owner_id
-- This migration adds a trigger to automatically set the owner_id field
-- to the authenticated user's ID when inserting a new contract

-- =====================
-- Create trigger function to set owner_id
-- =====================
CREATE OR REPLACE FUNCTION public.set_contract_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If owner_id is not provided or doesn't match auth.uid(), set it to auth.uid()
  IF NEW.owner_id IS NULL OR NEW.owner_id != auth.uid() THEN
    NEW.owner_id = auth.uid();
  END IF;
  
  -- Ensure auth.uid() is not null (user must be authenticated)
  IF NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a contract';
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================
-- Create trigger on contracts table
-- =====================
DROP TRIGGER IF EXISTS trg_set_contract_owner ON public.contracts;
CREATE TRIGGER trg_set_contract_owner
BEFORE INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.set_contract_owner();

-- =====================
-- Update RLS policy to be more permissive for inserts
-- Since the trigger ensures owner_id = auth.uid(), we can simplify the policy
-- =====================

-- Drop the old insert policy
DROP POLICY IF EXISTS contracts_insert ON public.contracts;

-- Create new insert policy that just checks if user is authenticated
CREATE POLICY contracts_insert ON public.contracts
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================
-- Add comments for documentation
-- =====================
COMMENT ON FUNCTION public.set_contract_owner IS 'Automatically sets owner_id to the authenticated user when creating a contract';
COMMENT ON TRIGGER trg_set_contract_owner ON public.contracts IS 'Ensures owner_id is always set to the authenticated user on insert';
