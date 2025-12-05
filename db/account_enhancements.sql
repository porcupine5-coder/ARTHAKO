-- Account Enhancements Schema
-- Add new fields to users table and create activity tracking

-- Add new columns to users table for profile customization
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_media_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

-- Create user_activity table for tracking stats
CREATE TABLE IF NOT EXISTS user_activity (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'company_viewed' | 'prediction_used' | 'company_tracked'
  company_symbol text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_type_check CHECK (activity_type IN ('company_viewed', 'prediction_used', 'company_tracked'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);

-- Enable RLS on user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activity
CREATE POLICY IF NOT EXISTS user_activity_select_own ON user_activity 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY IF NOT EXISTS user_activity_insert_own ON user_activity 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user_preferences table for privacy settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allow_analytics boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own preferences
CREATE POLICY IF NOT EXISTS user_preferences_select_own ON user_preferences 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS user_preferences_insert_own ON user_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS user_preferences_update_own ON user_preferences 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to auto-set display_name on user creation
CREATE OR REPLACE FUNCTION set_default_display_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    NEW.display_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set display_name
DROP TRIGGER IF EXISTS trigger_set_default_display_name ON users;
CREATE TRIGGER trigger_set_default_display_name
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_default_display_name();

-- Create function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE(
  total_views bigint,
  companies_tracked bigint,
  predictions_used bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE activity_type = 'company_viewed'), 0) as total_views,
    COALESCE(COUNT(DISTINCT company_symbol) FILTER (WHERE activity_type = 'company_tracked'), 0) as companies_tracked,
    COALESCE(COUNT(*) FILTER (WHERE activity_type = 'prediction_used'), 0) as predictions_used
  FROM user_activity
  WHERE user_id = p_user_id;
  
  -- Ensure we always return exactly one row even if no data exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_stats(uuid) TO authenticated;

COMMENT ON TABLE user_activity IS 'Tracks user interactions for stats display';
COMMENT ON TABLE user_preferences IS 'Stores user privacy and preference settings';
COMMENT ON COLUMN users.display_name IS 'Custom display name, defaults to email prefix';
COMMENT ON COLUMN users.profile_media_url IS 'URL to profile picture/gif/video in Supabase Storage';
COMMENT ON COLUMN users.two_factor_enabled IS 'Whether 2FA is enabled for this user';
