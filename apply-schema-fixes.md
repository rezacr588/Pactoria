# Apply Schema Fixes to Production Supabase

## Overview
This guide will help you apply the schema alignment migration to your production Supabase database to ensure all Prisma models have corresponding tables.

## Migration File
The comprehensive migration has been created at:
`supabase/migrations/20250824_prisma_schema_alignment.sql`

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/efqljjmausicfkhjhhtl
   - Go to SQL Editor

2. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/20250824_prisma_schema_alignment.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

## Method 2: Using Supabase CLI

If you have the database password:

```bash
# Navigate to project root
cd /Users/rezazeraat/CascadeProjects/windsurf-project

# Push the migration
supabase db push --include-all

# Or apply specific migration
supabase migration up --include-all
```

## Method 3: Using psql directly

If you have the database connection string:

```bash
psql "postgresql://postgres.efqljjmausicfkhjhhtl:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20250824_prisma_schema_alignment.sql
```

## What This Migration Does

### 1. **Creates Missing Tables**
- ✅ `email_notifications` - Email queue system
- ✅ `usage_tracking` - User resource usage tracking
- ✅ `analytics_events` - User behavior analytics
- ✅ `performance_metrics` - Application performance monitoring

### 2. **Ensures All Billing Tables Exist**
- ✅ `subscriptions` with correct schema
- ✅ `organizations` with all fields
- ✅ `organization_members`
- ✅ `invoices` with Stripe integration

### 3. **Fixes Template Table**
- ✅ Adds missing columns: `content_json`, `thumbnail_url`, `is_featured`, `published`, `rating`, `price`, `currency`, `created_by`

### 4. **Ensures Contract Tables**
- ✅ `contract_parties` - Party information
- ✅ `contract_metadata` - Flexible key-value storage
- ✅ `contract_activity` - Activity logging
- ✅ `rate_limits` - API rate limiting

### 5. **Adds Foreign Keys & Indexes**
- ✅ All proper relationships
- ✅ Performance indexes
- ✅ Unique constraints

### 6. **Sets Up Security**
- ✅ Row Level Security (RLS) enabled
- ✅ Basic security policies
- ✅ Helper functions for common operations

## Verification Queries

After running the migration, verify everything was created correctly:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify specific missing tables now exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'email_notifications', 
  'usage_tracking', 
  'analytics_events', 
  'performance_metrics'
);

-- Check templates table has all columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'templates' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
```

## Post-Migration Steps

### 1. **Update Application Code**
Your Prisma client should now work correctly with all models:

```bash
cd apps/web
npx prisma generate
npm run build
```

### 2. **Test Key Functionality**
- ✅ Email notifications
- ✅ Usage tracking
- ✅ Analytics collection
- ✅ Billing system
- ✅ Contract management

### 3. **Deploy Updated Application**
Once verified, deploy your application to pick up the schema changes.

## Troubleshooting

### Common Issues:

1. **Permission Errors**
   - Ensure you're using an admin/service role account
   - Check your Supabase project permissions

2. **Migration Fails Partially**
   - The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
   - Check specific error messages for problematic tables

3. **Foreign Key Violations**
   - Some foreign keys reference `auth.users` which may not exist in test environments
   - The migration handles this with conditional logic

4. **RLS Policy Conflicts**
   - If you have existing policies, there might be conflicts
   - Review and adjust policies as needed

## Next Steps

After successful migration:

1. **Monitor Application Logs** - Check for any runtime errors
2. **Test Email System** - Verify email notifications work
3. **Check Analytics** - Ensure events are being logged
4. **Verify Billing** - Test subscription and invoice features
5. **Performance Check** - Monitor query performance with new indexes

## Support

If you encounter issues:
- Check Supabase Dashboard logs
- Review the migration SQL for specific errors
- Test individual sections of the migration if needed

The migration is designed to be idempotent (safe to run multiple times) and uses conditional creation statements.