-- Add music-related columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_id TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_cover_url TEXT;

-- Create index for music_id for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_music_id ON posts(music_id);
