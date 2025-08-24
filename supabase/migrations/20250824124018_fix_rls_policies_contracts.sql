-- Fix RLS policies for contract creation and add missing relationships

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;

-- Create correct policies that work with the metadata column and UUID conversion
CREATE POLICY "Users can view own contracts" ON contracts
  FOR SELECT USING (auth.uid() = owner_id::uuid);

CREATE POLICY "Users can insert own contracts" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = owner_id::uuid);

CREATE POLICY "Users can update own contracts" ON contracts
  FOR UPDATE USING (auth.uid() = owner_id::uuid);

CREATE POLICY "Users can delete own contracts" ON contracts
  FOR DELETE USING (auth.uid() = owner_id::uuid);

-- Drop existing activity policies
DROP POLICY IF EXISTS "Users can view activity for own contracts" ON contract_activity;
DROP POLICY IF EXISTS "Users can insert activity for own contracts" ON contract_activity;

-- Create proper activity policies
CREATE POLICY "Users can view activity for own contracts" ON contract_activity
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id::uuid FROM contracts WHERE id = contract_activity.contract_id
    ) OR auth.uid() = user_id::uuid
  );

CREATE POLICY "Users can insert activity for own contracts" ON contract_activity
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_id::uuid FROM contracts WHERE id = contract_activity.contract_id
    ) OR auth.uid() = user_id::uuid
  );

-- Grant necessary permissions for authenticated users
GRANT INSERT, SELECT, UPDATE, DELETE ON contracts TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON contract_activity TO authenticated;
GRANT SELECT ON profiles TO authenticated;