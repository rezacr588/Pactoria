-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT CHECK (unit IN ('ms', 'bytes', 'count', 'percentage')),
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  user_agent TEXT,
  url TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  connection_type TEXT,
  device_memory INTEGER,
  hardware_concurrency INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table for distributed rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract analytics table
CREATE TABLE IF NOT EXISTS contract_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'viewed', 'edited', 'status_changed', 
    'signed', 'exported', 'shared', 'commented'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage metrics
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  api_key_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_url ON performance_metrics(url);

CREATE INDEX idx_rate_limits_reset_time ON rate_limits(reset_time);

CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

CREATE INDEX idx_contract_analytics_contract_id ON contract_analytics(contract_id);
CREATE INDEX idx_contract_analytics_event_type ON contract_analytics(event_type);
CREATE INDEX idx_contract_analytics_created_at ON contract_analytics(created_at DESC);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);

CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_status_code ON api_usage(status_code);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);

CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- RLS Policies
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Performance metrics policies (only admins can view)
CREATE POLICY "Admins can view all performance metrics"
  ON performance_metrics FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert performance metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (true);

-- Analytics events policies
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Contract analytics policies
CREATE POLICY "Users can view analytics for their contracts"
  ON contract_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_analytics.contract_id
      AND (contracts.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM contract_collaborators
          WHERE contract_collaborators.contract_id = contracts.id
          AND contract_collaborators.user_id = auth.uid()
        )
      )
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- User activity policies
CREATE POLICY "Users can view their own activity"
  ON user_activity FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert user activity"
  ON user_activity FOR INSERT
  WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION get_contract_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_contracts BIGINT,
  contracts_by_status JSONB,
  avg_completion_time INTERVAL,
  total_collaborations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id) as total_contracts,
    jsonb_object_agg(
      COALESCE(c.status, 'unknown'),
      status_counts.count
    ) as contracts_by_status,
    AVG(
      CASE 
        WHEN c.status = 'signed' 
        THEN c.updated_at - c.created_at 
        ELSE NULL 
      END
    ) as avg_completion_time,
    COUNT(DISTINCT cc.id) as total_collaborations
  FROM contracts c
  LEFT JOIN contract_collaborators cc ON c.id = cc.contract_id
  LEFT JOIN LATERAL (
    SELECT status, COUNT(*) as count
    FROM contracts
    WHERE created_at BETWEEN p_start_date AND p_end_date
    GROUP BY status
  ) status_counts ON true
  WHERE c.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY status_counts.count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
  p_period TEXT DEFAULT '7d'
)
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  new_users BIGINT,
  engagement_rate NUMERIC,
  avg_session_duration INTERVAL
) AS $$
DECLARE
  v_interval INTERVAL;
BEGIN
  -- Parse period
  v_interval := CASE p_period
    WHEN '24h' THEN INTERVAL '1 day'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '90d' THEN INTERVAL '90 days'
    ELSE INTERVAL '7 days'
  END;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE 
      WHEN u.last_sign_in_at >= NOW() - v_interval 
      THEN u.id 
    END) as active_users,
    COUNT(DISTINCT CASE 
      WHEN u.created_at >= NOW() - v_interval 
      THEN u.id 
    END) as new_users,
    ROUND(
      COUNT(DISTINCT CASE 
        WHEN u.last_sign_in_at >= NOW() - v_interval 
        THEN u.id 
      END)::NUMERIC / NULLIF(COUNT(DISTINCT u.id), 0) * 100,
      2
    ) as engagement_rate,
    AVG(s.duration_seconds * INTERVAL '1 second') as avg_session_duration
  FROM auth.users u
  LEFT JOIN user_sessions s ON u.id = s.user_id
    AND s.started_at >= NOW() - v_interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track API performance
CREATE OR REPLACE FUNCTION track_api_performance(
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO api_usage (
    endpoint,
    method,
    status_code,
    response_time_ms,
    user_id
  ) VALUES (
    p_endpoint,
    p_method,
    p_status_code,
    p_response_time_ms,
    p_user_id
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type,
    error_message,
    error_stack,
    severity,
    metadata,
    user_id
  ) VALUES (
    p_error_type,
    p_error_message,
    p_error_stack,
    p_severity,
    p_metadata,
    auth.uid()
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a materialized view for dashboard metrics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics AS
SELECT
  -- Contract metrics
  (SELECT COUNT(*) FROM contracts) as total_contracts,
  (SELECT COUNT(*) FROM contracts WHERE status = 'signed') as signed_contracts,
  (SELECT COUNT(*) FROM contracts WHERE created_at >= NOW() - INTERVAL '7 days') as new_contracts_week,
  
  -- User metrics
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '7 days') as active_users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  
  -- Template metrics
  (SELECT COUNT(*) FROM templates) as total_templates,
  (SELECT SUM(usage_count) FROM templates) as total_template_usage,
  (SELECT AVG(rating) FROM templates WHERE rating IS NOT NULL) as avg_template_rating,
  
  -- Collaboration metrics
  (SELECT COUNT(*) FROM contract_collaborators) as total_collaborations,
  (SELECT COUNT(DISTINCT contract_id) FROM contract_collaborators) as contracts_with_collaborators,
  
  -- Performance metrics (last 24h)
  (SELECT AVG(value) FROM performance_metrics 
   WHERE name = 'api-call-duration' 
   AND timestamp >= NOW() - INTERVAL '24 hours') as avg_api_response_time,
  
  -- Error metrics (last 24h)
  (SELECT COUNT(*) FROM error_logs 
   WHERE created_at >= NOW() - INTERVAL '24 hours' 
   AND resolved = false) as unresolved_errors,
  
  NOW() as last_updated;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_metrics_last_updated ON dashboard_metrics(last_updated);

-- Function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
