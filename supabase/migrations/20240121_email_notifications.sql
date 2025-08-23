-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  notification_preferences JSONB DEFAULT '{
    "contractUpdates": true,
    "newCollaborations": true,
    "statusChanges": true,
    "comments": true,
    "reminders": true,
    "weeklyDigest": false
  }'::jsonb,
  email_frequency TEXT DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'daily', 'weekly', 'never')),
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error JSONB,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push')),
  subject TEXT,
  content JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_recipient_id ON email_queue(recipient_id);
CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_created_at ON notification_log(created_at DESC);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE
  ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE
  ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Email queue policies (only system/admin can manage)
CREATE POLICY "Users can view their own queued emails"
  ON email_queue FOR SELECT
  USING (auth.uid() = recipient_id);

-- Notification log policies
CREATE POLICY "Users can view their own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Function to queue notification emails
CREATE OR REPLACE FUNCTION queue_notification_email(
  p_recipient_id UUID,
  p_template_name TEXT,
  p_template_data JSONB,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  v_email_id UUID;
  v_preferences JSONB;
BEGIN
  -- Check user preferences
  SELECT notification_preferences INTO v_preferences
  FROM user_preferences
  WHERE user_id = p_recipient_id;

  -- If no preferences exist, create default ones
  IF v_preferences IS NULL THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_recipient_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT notification_preferences INTO v_preferences
    FROM user_preferences
    WHERE user_id = p_recipient_id;
  END IF;

  -- Insert into email queue
  INSERT INTO email_queue (
    recipient_id,
    template_name,
    template_data,
    scheduled_for
  ) VALUES (
    p_recipient_id,
    p_template_name,
    p_template_data,
    p_scheduled_for
  ) RETURNING id INTO v_email_id;

  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log notifications
CREATE OR REPLACE FUNCTION log_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_channel TEXT,
  p_subject TEXT,
  p_content JSONB,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO notification_log (
    user_id,
    notification_type,
    channel,
    subject,
    content,
    metadata
  ) VALUES (
    p_user_id,
    p_notification_type,
    p_channel,
    p_subject,
    p_content,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send weekly digest emails (can be called by a cron job)
CREATE OR REPLACE FUNCTION send_weekly_digests()
RETURNS VOID AS $$
DECLARE
  v_user RECORD;
  v_week_start DATE;
  v_week_end DATE;
  v_stats JSONB;
  v_recent_contracts JSONB;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE - INTERVAL '7 days')::DATE;
  v_week_end := date_trunc('week', CURRENT_DATE)::DATE - INTERVAL '1 day';

  -- Loop through users with weekly digest enabled
  FOR v_user IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    JOIN user_preferences p ON u.id = p.user_id
    WHERE p.notification_preferences->>'weeklyDigest' = 'true'
  LOOP
    -- Calculate stats for the user
    SELECT jsonb_build_object(
      'contractsCreated', COUNT(*) FILTER (WHERE created_at >= v_week_start),
      'contractsUpdated', COUNT(*) FILTER (WHERE updated_at >= v_week_start AND updated_at != created_at),
      'contractsSigned', COUNT(*) FILTER (WHERE status = 'signed' AND updated_at >= v_week_start),
      'newCollaborations', (
        SELECT COUNT(*)
        FROM contract_collaborators
        WHERE user_id = v_user.id
        AND created_at >= v_week_start
      )
    ) INTO v_stats
    FROM contracts
    WHERE owner_id = v_user.id
    OR id IN (
      SELECT contract_id
      FROM contract_collaborators
      WHERE user_id = v_user.id
    );

    -- Get recent contracts
    SELECT jsonb_agg(
      jsonb_build_object(
        'title', title,
        'status', status,
        'url', CONCAT(current_setting('app.url'), '/contracts/', id)
      )
      ORDER BY updated_at DESC
    ) INTO v_recent_contracts
    FROM (
      SELECT id, title, status, updated_at
      FROM contracts
      WHERE (owner_id = v_user.id
        OR id IN (
          SELECT contract_id
          FROM contract_collaborators
          WHERE user_id = v_user.id
        ))
      AND updated_at >= v_week_start
      ORDER BY updated_at DESC
      LIMIT 5
    ) recent;

    -- Queue the weekly digest email
    PERFORM queue_notification_email(
      v_user.id,
      'weeklyDigest',
      jsonb_build_object(
        'weekStartDate', to_char(v_week_start, 'Mon DD, YYYY'),
        'weekEndDate', to_char(v_week_end, 'Mon DD, YYYY'),
        'stats', v_stats,
        'recentContracts', COALESCE(v_recent_contracts, '[]'::jsonb)
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
