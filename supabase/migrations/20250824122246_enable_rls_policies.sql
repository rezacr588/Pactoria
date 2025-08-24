-- Enable RLS and create policies for production access

-- Enable RLS on main tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for contracts
CREATE POLICY "Users can view own contracts" ON contracts
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own contracts" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own contracts" ON contracts
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own contracts" ON contracts
  FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for templates
CREATE POLICY "Everyone can view public templates" ON templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid()::text = created_by_user_id);

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid()::text = created_by_user_id);

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid()::text = created_by_user_id);

-- Create policies for contract_activity
CREATE POLICY "Users can view activity for own contracts" ON contract_activity
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM contracts WHERE id = contract_activity.contract_id
    )
  );

CREATE POLICY "Users can insert activity for own contracts" ON contract_activity
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM contracts WHERE id = contract_activity.contract_id
    )
  );

-- Create policies for analytics_events
CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for usage_tracking
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for email_notifications
CREATE POLICY "System can manage email notifications" ON email_notifications
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;