# Spotify Integration Setup

## Overview
The CreatePost component now includes Spotify music search functionality. Users can search for songs and select them to attach to their posts.

## ✅ Configuration Status
- **Spotify Credentials**: ✅ Configured in `.env`
- **Web API**: ✅ Enabled
- **Web Playback SDK**: ✅ Enabled
- **Redirect URI**: `https://waveer.netlify.app/spotify-callback`
- **Authentication Flow**: Client Credentials (for search functionality)

## Setup Instructions

### 1. Environment Variables
Ensure the following are in your `.env` file:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
```

### 2. Spotify App Configuration
In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
1. ✅ Web API enabled
2. ✅ Web Playback SDK enabled
3. ✅ Redirect URI set to: `https://waveer.netlify.app/spotify-callback`

### 3. Database Migration
Run the SQL migration to add music columns to the posts table:

```sql
-- Add music-related columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_id TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_cover_url TEXT;

-- Create index for music_id for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_music_id ON posts(music_id);
```

## Features

### Spotify Search
- Users can search for songs by name, artist, or album
- Results display with album art, song name, and artist
- Click to select a track
- 500ms debounce to prevent excessive API calls

### Selected Music Display
- Shows selected track with album cover
- Displays song name and artist
- Provides link to open track on Spotify
- Clear button to deselect and search again

### Post Creation
When creating a post, the following music data is saved:
- `music_url`: Spotify track URL
- `music_title`: Song name
- `music_artist`: Artist name(s)
- `music_id`: Spotify track ID
- `music_cover_url`: Album cover image URL

## Usage

1. Navigate to Create Post
2. Select Image or Video
3. Upload your media
4. In the "Search Spotify Music" field, type a song name or artist
5. Wait for results to appear (500ms debounce)
6. Click on a track to select it
7. The selected track will display with its cover art
8. Create the post as normal

## Technical Details

### Authentication Flow
- Uses **Client Credentials OAuth 2.0** flow
- No user login required for search functionality
- Access token is obtained server-side via environment variables
- Token is used to search the Spotify API

### API Endpoints Used
- `POST https://accounts.spotify.com/api/token` - Get access token
- `GET https://api.spotify.com/v1/search` - Search for tracks

### Error Handling
- Validates credentials before making API calls
- Provides user-friendly error messages
- Logs detailed errors to console for debugging

## Notes
- Spotify search uses Client Credentials flow (no user login required)
- Results are limited to 10 tracks per search
- Album art is automatically fetched from Spotify
- All music data is optional - posts can be created without music
- Search is debounced to 500ms to reduce API calls
- Works for both image and video posts
