-- Run this entire script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/efqljjmausicfkhjhhtl/sql/new

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Check if tables exist (run this first to see what's missing)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- If tables are missing, check the supabase/migrations folder
-- You'll need to run each migration file in order