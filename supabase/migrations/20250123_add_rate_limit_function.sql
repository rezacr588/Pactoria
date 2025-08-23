-- Add rate limit function for edge functions
-- Date: 2025-01-23

-- =====================================================
-- RATE LIMITING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_client_id TEXT,
  p_endpoint TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
  window_end TIMESTAMPTZ;
BEGIN
  -- Calculate current window
  window_start = date_trunc('minute', NOW()) - (EXTRACT(minute FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  window_end = window_start + (p_window_minutes * INTERVAL '1 minute');
  
  -- Clean up old rate limit entries (older than 24 hours)
  DELETE FROM public.rate_limits 
  WHERE reset_time < NOW() - INTERVAL '24 hours';
  
  -- Get current count for this client and endpoint
  SELECT count INTO current_count
  FROM public.rate_limits
  WHERE key = p_client_id || ':' || p_endpoint
    AND reset_time = window_end;
  
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO public.rate_limits (key, count, reset_time)
    VALUES (p_client_id || ':' || p_endpoint, 1, window_end)
    ON CONFLICT (key) DO UPDATE 
    SET 
      count = CASE 
        WHEN rate_limits.reset_time < window_end THEN 1
        ELSE rate_limits.count + 1
      END,
      reset_time = CASE 
        WHEN rate_limits.reset_time < window_end THEN window_end
        ELSE rate_limits.reset_time
      END,
      updated_at = NOW();
    
    RETURN TRUE;
  END IF;
  
  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment count
  UPDATE public.rate_limits
  SET 
    count = count + 1,
    updated_at = NOW()
  WHERE key = p_client_id || ':' || p_endpoint
    AND reset_time = window_end;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.check_rate_limit IS 'Check and enforce rate limits for API endpoints';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow service role to call this function (needed for edge functions)
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;