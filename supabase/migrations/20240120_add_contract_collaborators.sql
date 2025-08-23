-- Add contract_collaborators table for sharing contracts with other users

-- Create contract_collaborators table
CREATE TABLE IF NOT EXISTS public.contract_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'approver')),
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_collaborators_contract ON public.contract_collaborators(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_collaborators_user ON public.contract_collaborators(user_id);

-- RLS policies for contract_collaborators
ALTER TABLE public.contract_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: Contract owners can view collaborators
CREATE POLICY "Contract owners can view collaborators"
  ON public.contract_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = contract_collaborators.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

-- Policy: Contract owners can add collaborators
CREATE POLICY "Contract owners can add collaborators"
  ON public.contract_collaborators
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = contract_collaborators.contract_id
      AND contracts.owner_id = auth.uid()
    )
    AND added_by = auth.uid()
  );

-- Policy: Contract owners can remove collaborators
CREATE POLICY "Contract owners can remove collaborators"
  ON public.contract_collaborators
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = contract_collaborators.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

-- Policy: Collaborators can view their own collaboration records
CREATE POLICY "Collaborators can view their collaboration"
  ON public.contract_collaborators
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Collaborators can remove themselves
CREATE POLICY "Collaborators can remove themselves"
  ON public.contract_collaborators
  FOR DELETE
  USING (user_id = auth.uid());
