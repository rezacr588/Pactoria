# Database Setup Instructions

Since direct database connection isn't working from this environment, please follow these steps:

## 1. Go to your Supabase SQL Editor
Visit: https://supabase.com/dashboard/project/efqljjmausicfkhjhhtl/sql/new

## 2. Run these migrations in order:

### Step 1: Initial Schema
Copy and paste the contents of: `supabase/migrations/0001_init.sql`

### Step 2: RPC Functions
Copy and paste the contents of: `supabase/migrations/0002_rpc_take_snapshot.sql`

### Step 3: Performance Indexes
Copy and paste the contents of: `supabase/migrations/0003_performance_indexes.sql`

### Step 4: RLS Policies
Copy and paste the contents of: `supabase/migrations/0004_recreate_rls_policies.sql`

### Step 5: Additional Tables (run these in order)
- `supabase/migrations/20240118_add_profiles_table.sql`
- `supabase/migrations/20240119_add_templates_table.sql`
- `supabase/migrations/20240120_add_contract_collaborators.sql`
- `supabase/migrations/20240121_email_notifications.sql`
- `supabase/migrations/20240122_analytics_monitoring.sql`
- `supabase/migrations/20240821000001_add_billing_tables.sql`
- `supabase/migrations/20241222_critical_fixes.sql`
- `supabase/migrations/20250122_fix_contract_owner_id.sql`
- `supabase/migrations/20250123_add_missing_tables.sql`
- `supabase/migrations/20250123_add_rate_limit_function.sql`
- `supabase/migrations/20250123_add_sample_templates.sql`
- `supabase/migrations/20250123_add_version_snapshot_rpc.sql`

## 3. After running the migrations
Come back and I'll complete the Vercel deployment.