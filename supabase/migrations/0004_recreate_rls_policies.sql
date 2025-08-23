-- Recreate RLS policies after function update
-- This migration recreates the policies that depend on has_contract_access function

-- =====================
-- Contracts RLS Policies
-- =====================

-- Policy for SELECT on contracts
CREATE POLICY contracts_select ON public.contracts
    FOR SELECT USING (
        public.has_contract_access(auth.uid(), id)
    );

-- =====================
-- Contract Versions RLS Policies
-- =====================

-- Policy for SELECT on contract_versions
CREATE POLICY versions_select ON public.contract_versions
    FOR SELECT USING (
        public.has_contract_access(auth.uid(), contract_id)
    );

-- Policy for INSERT on contract_versions
CREATE POLICY versions_insert ON public.contract_versions
    FOR INSERT WITH CHECK (
        public.has_contract_access(auth.uid(), contract_id)
    );

-- =====================
-- Contract Approvals RLS Policies
-- =====================

-- Policy for SELECT on contract_approvals
CREATE POLICY approvals_select ON public.contract_approvals
    FOR SELECT USING (
        public.has_contract_access(auth.uid(), contract_id)
    );

-- Policy for INSERT on contract_approvals
CREATE POLICY approvals_insert ON public.contract_approvals
    FOR INSERT WITH CHECK (
        public.has_contract_access(auth.uid(), contract_id)
    );

-- =====================
-- Collaboration Sessions RLS Policies
-- =====================

-- Policy for SELECT on collab_sessions
CREATE POLICY sessions_select ON public.collab_sessions
    FOR SELECT USING (
        public.has_contract_access(auth.uid(), contract_id)
    );

-- Policy for INSERT on collab_sessions
CREATE POLICY sessions_insert ON public.collab_sessions
    FOR INSERT WITH CHECK (
        public.has_contract_access(auth.uid(), contract_id)
    );

-- =====================
-- Additional policies that may have been missed
-- =====================

-- Policy for UPDATE on contracts (owners only)
DROP POLICY IF EXISTS contracts_update ON public.contracts;
CREATE POLICY contracts_update ON public.contracts
    FOR UPDATE USING (owner_id = auth.uid());

-- Policy for DELETE on contracts (owners only)
DROP POLICY IF EXISTS contracts_delete ON public.contracts;
CREATE POLICY contracts_delete ON public.contracts
    FOR DELETE USING (owner_id = auth.uid());

-- Policy for UPDATE on contract_approvals (approvers only for their own approvals)
DROP POLICY IF EXISTS approvals_update ON public.contract_approvals;
CREATE POLICY approvals_update ON public.contract_approvals
    FOR UPDATE USING (approver_id = auth.uid());

-- Policy for UPDATE on collab_sessions (participants only)
DROP POLICY IF EXISTS sessions_update ON public.collab_sessions;
CREATE POLICY sessions_update ON public.collab_sessions
    FOR UPDATE USING (
        public.has_contract_access(auth.uid(), contract_id)
    );
