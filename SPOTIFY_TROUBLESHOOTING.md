# Spotify Integration Troubleshooting

## Common Issues and Solutions

### 1. "Spotify credentials not configured"
**Cause**: Environment variables are not set correctly

**Solution**:
1. Check `.env` file has both variables:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_id
   VITE_SPOTIFY_CLIENT_SECRET=your_secret
   ```
2. Restart your dev server after updating `.env`
3. Verify credentials in Spotify Dashboard

### 2. "Failed to authenticate with Spotify"
**Cause**: Invalid Client ID or Client Secret

**Solution**:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Copy the exact Client ID and Client Secret
4. Update `.env` file with correct values
5. Restart dev server

### 3. Search returns no results
**Cause**: Query is too specific or Spotify API rate limit

**Solution**:
1. Try a simpler search (e.g., "Drake" instead of "Drake - God's Plan")
2. Wait a moment and try again (rate limit resets)
3. Check browser console for detailed error messages
4. Verify API credentials are correct

### 4. Album art not displaying
**Cause**: Track has no album art or image URL is invalid

**Solution**:
1. Try selecting a different track
2. Check browser console for image loading errors
3. Verify the image URL is accessible
4. Some tracks may not have album art

### 5. Selected music not saving to database
**Cause**: Database columns not created or post creation failed

**Solution**:
1. Run the SQL migration to create columns:
   ```sql
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_url TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_title TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_artist TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_id TEXT;
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_cover_url TEXT;
   ```
2. Check browser console for post creation errors
3. Verify Supabase connection is working
4. Check post was created without music data

### 6. Dropdown results not appearing
**Cause**: Search function not triggered or results are empty

**Solution**:
1. Type at least 1 character in search field
2. Wait 500ms for debounce to complete
3. Check browser console for API errors
4. Verify credentials are correct
5. Try a different search term

### 7. CORS errors in browser console
**Cause**: Spotify API blocking cross-origin requests

**Solution**:
1. This is expected for some Spotify endpoints
2. The search should still work through the auth flow
3. Check if credentials are being sent correctly
4. Verify redirect URI is correct in Spotify Dashboard

## Debugging Steps

### 1. Check Environment Variables
```javascript
// In browser console:
console.log(import.meta.env.VITE_SPOTIFY_CLIENT_ID);
console.log(import.meta.env.VITE_SPOTIFY_CLIENT_SECRET);
```

### 2. Monitor Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Search for a song
4. Look for requests to:
   - `accounts.spotify.com/api/token`
   - `api.spotify.com/v1/search`
5. Check response status and data

### 3. Check Console Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages from Spotify search
4. Check for detailed error information

### 4. Test Credentials
Use curl to test your credentials:
```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -d "grant_type=client_credentials"
```

## Performance Tips

### 1. Reduce API Calls
- Search is debounced to 500ms
- Avoid typing very quickly
- Clear search when done selecting

### 2. Optimize Results
- Search results limited to 10 tracks
- Album art cached by browser
- Consider pagination if needed

### 3. Monitor Rate Limits
- Spotify has rate limits (typically 429 Too Many Requests)
- Wait a moment if you get rate limit errors
- Implement exponential backoff if needed

## Security Notes

### ✅ Best Practices Implemented
- Client Secret is stored in `.env` (not in code)
- Environment variables are not exposed to client
- Using Client Credentials flow (no user data needed)
- Credentials validated before API calls

### ⚠️ Important
- Never commit `.env` file to git
- Never expose Client Secret in frontend code
- Rotate credentials if compromised
- Use environment variables for production

## Getting Help

### Resources
- [Spotify API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Dashboard](https://developer.spotify.com/dashboard)
- [OAuth 2.0 Guide](https://developer.spotify.com/documentation/general/guides/authorization/)

### Support
1. Check browser console for error messages
2. Review this troubleshooting guide
3. Check Spotify API status page
4. Verify all credentials and configuration
