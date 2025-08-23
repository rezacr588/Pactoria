-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "latest_version_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "ydoc_state" BYTEA,
    "content_md" TEXT,
    "content_json" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "approver_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ,

    CONSTRAINT "contract_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_collaborators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "added_by" UUID NOT NULL,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "company" TEXT,
    "job_title" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "content_md" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "template_id" TEXT,
    "template_data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tags" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "tier_id" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ,
    "trial_start" TIMESTAMPTZ,
    "trial_end" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "subscription_id" UUID,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invited_by" UUID,
    "invited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMPTZ,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "stripe_invoice_id" TEXT,
    "stripe_invoice_url" TEXT,
    "stripe_pdf_url" TEXT,
    "amount_paid" INTEGER,
    "amount_due" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "status" TEXT NOT NULL,
    "period_start" TIMESTAMPTZ,
    "period_end" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_tracking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_parties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "party_name" TEXT NOT NULL,
    "party_email" TEXT,
    "party_type" TEXT NOT NULL DEFAULT 'individual',
    "party_role" TEXT NOT NULL DEFAULT 'party',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "contact_info" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "value_type" TEXT NOT NULL DEFAULT 'string',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rate_limits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_time" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_contracts_owner" ON "public"."contracts"("owner_id");

-- CreateIndex
CREATE INDEX "idx_versions_contract" ON "public"."contract_versions"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_versions_contract_id_version_number_key" ON "public"."contract_versions"("contract_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_approvals_contract" ON "public"."contract_approvals"("contract_id");

-- CreateIndex
CREATE INDEX "idx_approvals_approver" ON "public"."contract_approvals"("approver_id");

-- CreateIndex
CREATE INDEX "idx_contract_collaborators_contract" ON "public"."contract_collaborators"("contract_id");

-- CreateIndex
CREATE INDEX "idx_contract_collaborators_user" ON "public"."contract_collaborators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_collaborators_contract_id_user_id_key" ON "public"."contract_collaborators"("contract_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_profiles_email" ON "public"."profiles"("email");

-- CreateIndex
CREATE INDEX "idx_templates_category" ON "public"."templates"("category");

-- CreateIndex
CREATE INDEX "idx_templates_public" ON "public"."templates"("is_public");

-- CreateIndex
CREATE INDEX "idx_templates_creator" ON "public"."templates"("created_by_user_id");

-- CreateIndex
CREATE INDEX "idx_email_notifications_status" ON "public"."email_notifications"("status");

-- CreateIndex
CREATE INDEX "idx_email_notifications_created" ON "public"."email_notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_analytics_events_type" ON "public"."analytics_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_analytics_events_created" ON "public"."analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_name" ON "public"."performance_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "idx_performance_metrics_created" ON "public"."performance_metrics"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "public"."subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "public"."subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user" ON "public"."subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_tier" ON "public"."subscriptions"("tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "public"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key" ON "public"."organizations"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_subscription_id_key" ON "public"."organizations"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_organizations_owner" ON "public"."organizations"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "public"."organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "public"."invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoices_user" ON "public"."invoices"("user_id");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "public"."invoices"("status");

-- CreateIndex
CREATE INDEX "idx_usage_tracking_user_date" ON "public"."usage_tracking"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "usage_tracking_user_id_resource_type_resource_id_date_key" ON "public"."usage_tracking"("user_id", "resource_type", "resource_id", "date");

-- CreateIndex
CREATE INDEX "idx_contract_parties_contract_id" ON "public"."contract_parties"("contract_id");

-- CreateIndex
CREATE INDEX "idx_contract_parties_email" ON "public"."contract_parties"("party_email");

-- CreateIndex
CREATE INDEX "idx_contract_metadata_contract_id" ON "public"."contract_metadata"("contract_id");

-- CreateIndex
CREATE INDEX "idx_contract_metadata_key" ON "public"."contract_metadata"("key");

-- CreateIndex
CREATE UNIQUE INDEX "contract_metadata_contract_id_key_key" ON "public"."contract_metadata"("contract_id", "key");

-- CreateIndex
CREATE INDEX "idx_contract_activity_contract_id" ON "public"."contract_activity"("contract_id");

-- CreateIndex
CREATE INDEX "idx_contract_activity_user_id" ON "public"."contract_activity"("user_id");

-- CreateIndex
CREATE INDEX "idx_contract_activity_created_at" ON "public"."contract_activity"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_contract_activity_action" ON "public"."contract_activity"("action");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "public"."rate_limits"("key");

-- CreateIndex
CREATE INDEX "idx_rate_limits_key" ON "public"."rate_limits"("key");

-- CreateIndex
CREATE INDEX "idx_rate_limits_reset_time" ON "public"."rate_limits"("reset_time");

-- AddForeignKey
ALTER TABLE "public"."contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_approvals" ADD CONSTRAINT "contract_approvals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_approvals" ADD CONSTRAINT "contract_approvals_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."contract_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_collaborators" ADD CONSTRAINT "contract_collaborators_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_parties" ADD CONSTRAINT "contract_parties_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_metadata" ADD CONSTRAINT "contract_metadata_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_activity" ADD CONSTRAINT "contract_activity_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

