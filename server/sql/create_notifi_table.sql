-- ============================================================================
-- NOTIFI TABLE - For Video and Audio Call Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_id TEXT NOT NULL UNIQUE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifi_user_id ON notifi(user_id);
CREATE INDEX IF NOT EXISTS idx_notifi_caller_id ON notifi(caller_id);
CREATE INDEX IF NOT EXISTS idx_notifi_call_id ON notifi(call_id);
CREATE INDEX IF NOT EXISTS idx_notifi_call_type ON notifi(call_type);
CREATE INDEX IF NOT EXISTS idx_notifi_created_at ON notifi(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifi_read ON notifi(read);

-- Enable RLS
ALTER TABLE notifi ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS notifi_select_own ON notifi;
DROP POLICY IF EXISTS notifi_insert_system ON notifi;
DROP POLICY IF EXISTS notifi_update_own ON notifi;
DROP POLICY IF EXISTS notifi_delete_own ON notifi;

-- Users can only see notifications sent to them
CREATE POLICY notifi_select_own ON notifi FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert (via server)
CREATE POLICY notifi_insert_system ON notifi FOR INSERT
  WITH CHECK (true);

-- Users can update read status of their own notifications
CREATE POLICY notifi_update_own ON notifi FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY notifi_delete_own ON notifi FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- END OF NOTIFI TABLE CREATION
-- ============================================================================
