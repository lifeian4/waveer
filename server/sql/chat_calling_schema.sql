-- ============================================================================
-- CHAT & CALLING SCHEMA FOR SUPABASE
-- Production-ready tables with RLS, indexes, and constraints
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- NOTE: Using existing profiles table for user references

-- ============================================================================
-- 1. ROOMS TABLE (Group chats) - Created first for FK references
-- ============================================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT DEFAULT 'group' CHECK (room_type IN ('group', 'channel')),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);

-- ============================================================================
-- 2. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages5 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  message_text TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'text' CHECK (media_type IN ('text', 'audio', 'video', 'image', 'file')),
  mime_type TEXT,
  duration_ms INTEGER,
  file_size_bytes BIGINT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT either_receiver_or_room CHECK (
    (receiver_id IS NOT NULL AND room_id IS NULL) OR
    (receiver_id IS NULL AND room_id IS NOT NULL)
  ),
  CONSTRAINT message_not_empty CHECK (
    message_text IS NOT NULL OR media_url IS NOT NULL
  )
);

CREATE INDEX idx_messages5_sender_id ON messages5(sender_id);
CREATE INDEX idx_messages5_receiver_id ON messages5(receiver_id) WHERE receiver_id IS NOT NULL;
CREATE INDEX idx_messages5_room_id ON messages5(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_messages5_created_at ON messages5(created_at DESC);
CREATE INDEX idx_messages5_status ON messages5(status);

-- ============================================================================
-- 3. AUDIO FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audios5 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID UNIQUE REFERENCES messages5(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'audio/mpeg',
  duration_ms INTEGER,
  file_size_bytes BIGINT NOT NULL,
  signed_url TEXT,
  signed_url_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT file_size_limit CHECK (file_size_bytes <= 52428800)
);

CREATE INDEX idx_audios5_uploader_id ON audios5(uploader_id);
CREATE INDEX idx_audios5_created_at ON audios5(created_at DESC);
CREATE INDEX idx_audios5_message_id ON audios5(message_id);

-- ============================================================================
-- 4. VIDEOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos5 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID UNIQUE REFERENCES messages5(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'video/mp4',
  duration_ms INTEGER,
  file_size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  signed_url TEXT,
  signed_url_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT file_size_limit CHECK (file_size_bytes <= 524288000)
);

CREATE INDEX idx_videos5_uploader_id ON videos5(uploader_id);
CREATE INDEX idx_videos5_created_at ON videos5(created_at DESC);
CREATE INDEX idx_videos5_message_id ON videos5(message_id);

-- ============================================================================
-- 5. AUDIO CALL RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audiocall5 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT UNIQUE NOT NULL,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended')),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  sfu_session_id TEXT,
  ice_candidates_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT caller_not_callee CHECK (caller_id != callee_id)
);

CREATE INDEX idx_audiocall5_caller_id ON audiocall5(caller_id);
CREATE INDEX idx_audiocall5_callee_id ON audiocall5(callee_id);
CREATE INDEX idx_audiocall5_status ON audiocall5(status);
CREATE INDEX idx_audiocall5_initiated_at ON audiocall5(initiated_at DESC);
CREATE INDEX idx_audiocall5_call_id ON audiocall5(call_id);

-- ============================================================================
-- 6. VIDEO CALL RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS videocall5 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT UNIQUE NOT NULL,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended')),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  sfu_session_id TEXT,
  ice_candidates_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT caller_not_callee CHECK (caller_id != callee_id)
);

CREATE INDEX idx_videocall5_caller_id ON videocall5(caller_id);
CREATE INDEX idx_videocall5_callee_id ON videocall5(callee_id);
CREATE INDEX idx_videocall5_status ON videocall5(status);
CREATE INDEX idx_videocall5_initiated_at ON videocall5(initiated_at DESC);
CREATE INDEX idx_videocall5_call_id ON videocall5(call_id);

-- ============================================================================
-- 7. CALL EVENTS TABLE (Signaling fallback & logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT NOT NULL,
  call_type TEXT CHECK (call_type IN ('audio', 'video')),
  event_type TEXT NOT NULL CHECK (event_type IN ('offer', 'answer', 'ice_candidate', 'call_ended', 'call_rejected', 'error')),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_call_events_call_id ON call_events(call_id);
CREATE INDEX idx_call_events_from_user_id ON call_events(from_user_id);
CREATE INDEX idx_call_events_created_at ON call_events(created_at DESC);
CREATE INDEX idx_call_events_expires_at ON call_events(expires_at);

-- ============================================================================
-- 8. ROOM MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);

-- ============================================================================
-- 9. USER PRESENCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_active_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_updated_at ON user_presence(updated_at DESC);

-- ============================================================================
-- STORAGE BUCKETS (Create via Supabase UI or API)
-- ============================================================================
-- Bucket: audios5 (Private, signed URLs)
-- Bucket: videos5 (Private, signed URLs)
-- Bucket: avatars (Public)

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE messages5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audios5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiocall5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE videocall5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR MESSAGES
-- ============================================================================

CREATE POLICY messages5_select_own ON messages5 FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id OR
    room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
  );

CREATE POLICY messages5_insert_own ON messages5 FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    (
      receiver_id IS NOT NULL OR
      room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY messages5_update_status ON messages5 FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() IN (SELECT user_id FROM room_members WHERE room_id = messages5.room_id))
  WITH CHECK (
    (auth.uid() = receiver_id AND status IN ('delivered', 'read')) OR
    (auth.uid() IN (SELECT user_id FROM room_members WHERE room_id = messages5.room_id) AND status IN ('delivered', 'read'))
  );

-- ============================================================================
-- RLS POLICIES FOR AUDIO/VIDEO FILES
-- ============================================================================

CREATE POLICY audios5_select_own ON audios5 FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages5 WHERE
        auth.uid() = sender_id OR
        auth.uid() = receiver_id OR
        room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY audios5_insert_own ON audios5 FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY videos5_select_own ON videos5 FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages5 WHERE
        auth.uid() = sender_id OR
        auth.uid() = receiver_id OR
        room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY videos5_insert_own ON videos5 FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

-- ============================================================================
-- RLS POLICIES FOR CALLS
-- ============================================================================

CREATE POLICY audiocall5_select_own ON audiocall5 FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY audiocall5_insert_own ON audiocall5 FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY audiocall5_update_own ON audiocall5 FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY videocall5_select_own ON videocall5 FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY videocall5_insert_own ON videocall5 FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY videocall5_update_own ON videocall5 FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- ============================================================================
-- RLS POLICIES FOR ROOMS
-- ============================================================================

CREATE POLICY rooms_select_own ON rooms FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
  );

CREATE POLICY rooms_insert_own ON rooms FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY rooms_update_own ON rooms FOR UPDATE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
