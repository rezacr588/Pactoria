#!/bin/bash

DATABASE_URL="postgresql://postgres:Ww!97905199@db.efqljjmausicfkhjhhtl.supabase.co:5432/postgres"

echo "Setting up Supabase database with migrations..."

# Run migrations in order
echo "Running migration: 0001_init.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/0001_init.sql

echo "Running migration: 0002_rpc_take_snapshot.sql"  
psql "$DATABASE_URL" -f ../../supabase/migrations/0002_rpc_take_snapshot.sql

echo "Running migration: 0003_performance_indexes.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/0003_performance_indexes.sql

echo "Running migration: 0004_recreate_rls_policies.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/0004_recreate_rls_policies.sql

echo "Running migration: 20240118_add_profiles_table.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20240118_add_profiles_table.sql

echo "Running migration: 20240119_add_templates_table.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20240119_add_templates_table.sql

echo "Running migration: 20240120_add_contract_collaborators.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20240120_add_contract_collaborators.sql

echo "Running migration: 20240121_email_notifications.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20240121_email_notifications.sql

echo "Running migration: 20240122_analytics_monitoring.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20240122_analytics_monitoring.sql

echo "Running migration: 20240821000001_add_billing_tables.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20240821000001_add_billing_tables.sql

echo "Running migration: 20241222_critical_fixes.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20241222_critical_fixes.sql

echo "Running migration: 20250122_fix_contract_owner_id.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20250122_fix_contract_owner_id.sql

echo "Running migration: 20250123_add_missing_tables.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20250123_add_missing_tables.sql

echo "Running migration: 20250123_add_rate_limit_function.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20250123_add_rate_limit_function.sql

echo "Running migration: 20250123_add_sample_templates.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20250123_add_sample_templates.sql

echo "Running migration: 20250123_add_version_snapshot_rpc.sql"
psql "$DATABASE_URL" -f ../../supabase/migrations/20250123_add_version_snapshot_rpc.sql

echo "Database setup complete!"