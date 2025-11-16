# YouTube API Integration Setup

## Overview
The CreatePost component now uses YouTube API for music/video search instead of Spotify. Users can search for songs, artists, and music videos directly from YouTube.

## ✅ Configuration Status
- **YouTube API Key**: ✅ Configured in `.env.local`
- **Search API**: ✅ Enabled
- **API Key**: `AIzaSyDT_mrxvVCXENGNN5iwM22g_7_WaXNylgo`

## Setup Instructions

### 1. Add Environment Variable
Add the following to your `.env.local` file:

```
VITE_YOUTUBE_API_KEY=AIzaSyDT_mrxvVCXENGNN5iwM22g_7_WaXNylgo
```

### 2. Database Migration
The existing SQL migration still applies (music columns are the same):

```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_id TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_cover_url TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_music_id ON posts(music_id);
```

## Features

### YouTube Search
- Search for songs, artists, music videos
- Results show video title and channel name
- Thumbnail preview for each video
- 10 results per search
- 500ms debounce to prevent excessive API calls

### Selected Video Display
- Shows video thumbnail
- Displays video title and channel name
- Provides direct YouTube link
- Play/Mute controls (for future audio implementation)

### Post Creation
When creating a post, the following data is saved:
- `music_url`: YouTube video URL (https://www.youtube.com/watch?v=...)
- `music_title`: Video title
- `music_artist`: Channel name
- `music_id`: YouTube video ID
- `music_cover_url`: Video thumbnail URL

## Usage

1. Navigate to Create Post
2. Select Image or Video
3. Upload your media
4. In the "Search YouTube Music" field, type a song, artist, or video name
5. Wait for results to appear (500ms debounce)
6. Click on a video to select it
7. The selected video will display with its thumbnail
8. Create the post as normal

## Data Stored

### YouTube Video Data
```typescript
{
  music_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  music_title: "Rick Astley - Never Gonna Give You Up",
  music_artist: "Rick Astley",
  music_id: "dQw4w9WgXcQ",
  music_cover_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg"
}
```

## API Endpoints Used

- `GET https://www.googleapis.com/youtube/v3/search` - Search for videos

## Notes
- YouTube search returns all video types (music, clips, covers, etc.)
- Thumbnail quality varies (default, medium, high)
- All music data is optional - posts can be created without music
- Search is debounced to 500ms to reduce API calls
- Works for both image and video posts
- YouTube links can be embedded or opened directly

## Advantages Over Spotify
- ✅ No preview URL issues
- ✅ Larger music library (includes covers, remixes, live versions)
- ✅ Direct YouTube links for users
- ✅ Better thumbnail availability
- ✅ No authentication required for search
