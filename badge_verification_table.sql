-- Create badge_verification_requests table
-- Run this in your Supabase SQL editor

-- 1. Create badge_verification_requests table
CREATE TABLE IF NOT EXISTS badge_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instagram_username VARCHAR(255) NOT NULL,
    follower_count INTEGER NOT NULL DEFAULT 0,
    requested_badge_tier VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create wave_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS wave_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_category VARCHAR(50) NOT NULL DEFAULT 'follower_count',
    badge_tier VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    follower_count INTEGER NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, badge_category)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_badge_verification_requests_user_id ON badge_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_verification_requests_status ON badge_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_wave_badges_user_id ON wave_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_wave_badges_category ON wave_badges(badge_category);

-- 4. Enable RLS
ALTER TABLE badge_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wave_badges ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for badge_verification_requests
CREATE POLICY "Users can view own badge verification requests" ON badge_verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own badge verification requests" ON badge_verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending badge verification requests" ON badge_verification_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 6. Create RLS policies for wave_badges
CREATE POLICY "Anyone can view wave badges" ON wave_badges
    FOR SELECT USING (true);

-- 7. Check if tables were created successfully
SELECT 
    table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name AND table_schema = 'public') as exists
FROM (
    VALUES 
    ('badge_verification_requests'),
    ('wave_badges')
) AS t(table_name);

-- 8. Show current table structures
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('badge_verification_requests', 'wave_badges')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
