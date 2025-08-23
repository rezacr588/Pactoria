-- Enable RLS on all tables
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Contracts policies
CREATE POLICY "Users can view their own contracts" ON public.contracts
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own contracts" ON public.contracts
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own contracts" ON public.contracts
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own contracts" ON public.contracts
    FOR DELETE USING (auth.uid() = owner_id);

-- Contract versions policies
CREATE POLICY "Users can view contract versions they own" ON public.contract_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_versions.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert contract versions they own" ON public.contract_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_versions.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update contract versions they own" ON public.contract_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_versions.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

-- Contract approvals policies
CREATE POLICY "Users can view approvals for their contracts" ON public.contract_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_approvals.contract_id
            AND contracts.owner_id = auth.uid()
        ) OR auth.uid() = approver_id
    );

CREATE POLICY "Users can insert approvals" ON public.contract_approvals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_approvals.contract_id
            AND contracts.owner_id = auth.uid()
        ) OR auth.uid() = approver_id
    );

CREATE POLICY "Users can update their own approvals" ON public.contract_approvals
    FOR UPDATE USING (auth.uid() = approver_id);

-- Contract collaborators policies
CREATE POLICY "Users can view collaborators for their contracts" ON public.contract_collaborators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_collaborators.contract_id
            AND contracts.owner_id = auth.uid()
        ) OR auth.uid() = user_id
    );

CREATE POLICY "Users can manage collaborators for their contracts" ON public.contract_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_collaborators.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

-- Templates policies
CREATE POLICY "Users can view public templates" ON public.templates
    FOR SELECT USING (is_public = true OR created_by_user_id = auth.uid());

CREATE POLICY "Users can insert their own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (auth.uid() = created_by_user_id);

-- Contract parties policies
CREATE POLICY "Users can view parties for their contracts" ON public.contract_parties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_parties.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage parties for their contracts" ON public.contract_parties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_parties.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

-- Contract metadata policies
CREATE POLICY "Users can view metadata for their contracts" ON public.contract_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_metadata.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage metadata for their contracts" ON public.contract_metadata
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_metadata.contract_id
            AND contracts.owner_id = auth.uid()
        )
    );

-- Contract activity policies
CREATE POLICY "Users can view activity for their contracts" ON public.contract_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_activity.contract_id
            AND contracts.owner_id = auth.uid()
        ) OR auth.uid() = user_id
    );

CREATE POLICY "Users can insert activity for their contracts" ON public.contract_activity
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE contracts.id = contract_activity.contract_id
            AND contracts.owner_id = auth.uid()
        ) OR auth.uid() = user_id
    );

-- Analytics events policies (users can only see their own events)
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view their own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Organizations policies
CREATE POLICY "Users can view organizations they own or are members of" ON public.organizations
    FOR SELECT USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update organizations they own" ON public.organizations
    FOR UPDATE USING (auth.uid() = owner_id);

-- Organization members policies
CREATE POLICY "Users can view members of organizations they belong to" ON public.organization_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE organizations.id = organization_members.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- Performance metrics and email notifications (system tables - no RLS needed for now)
-- These will be accessible by service role only

-- Rate limits (system table)
-- No RLS needed as this is managed by the application