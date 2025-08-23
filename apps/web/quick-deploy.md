# 🚀 Quick Production Deployment Guide

## Step 1: Deploy to Vercel (2 minutes)
```bash
cd /Users/rezazeraat/CascadeProjects/windsurf-project/apps/web
npx vercel --prod --yes
```

## Step 2: Set Up Supabase Database (5 minutes)

Go to: https://supabase.com/dashboard/project/efqljjmausicfkhjhhtl/sql/new

Copy and paste each migration file in order:

1. `0001_init.sql` - Core tables
2. `0002_rpc_take_snapshot.sql` - Snapshot function
3. `0003_performance_indexes.sql` - Performance indexes
4. `0004_recreate_rls_policies.sql` - Security policies
5. `20240118_add_profiles_table.sql` - User profiles
6. `20240119_add_templates_table.sql` - Contract templates
7. `20240120_add_contract_collaborators.sql` - Collaboration
8. `20240121_email_notifications.sql` - Email system
9. `20240122_analytics_monitoring.sql` - Analytics
10. `20240821000001_add_billing_tables.sql` - Stripe billing
11. `20241222_critical_fixes.sql` - Critical fixes
12. `20250122_fix_contract_owner_id.sql` - Owner fixes
13. `20250123_add_missing_tables.sql` - Missing tables
14. `20250123_add_rate_limit_function.sql` - Rate limiting
15. `20250123_add_sample_templates.sql` - Sample data
16. `20250123_add_version_snapshot_rpc.sql` - Version snapshots

## Step 3: Configure Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = https://efqljjmausicfkhjhhtl.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   - `NEXT_PUBLIC_APP_URL` = https://your-vercel-url.vercel.app
   - `GROQ_API_KEY` = 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

## Step 4: Configure Supabase Auth

Go to: https://supabase.com/dashboard/project/efqljjmausicfkhjhhtl/auth/url-configuration

- Site URL: https://your-vercel-url.vercel.app
- Redirect URLs: https://your-vercel-url.vercel.app/**

## Step 5: Redeploy with Environment Variables
```bash
npx vercel --prod
```

## ✅ Ready to Test!

Your app should now be live with:
- ✅ User authentication
- ✅ Contract creation/editing
- ✅ Collaborative editing
- ✅ AI features
- ✅ Export functionality
- ✅ Real-time collaboration