# Spotify Web Playback SDK Setup

This guide will help you set up the Spotify Web Playback SDK for full music player controls.

## Prerequisites

- **Spotify Premium Account** (required for Web Playback SDK)
- Node.js installed
- Spotify Developer Account

## Step 1: Create Spotify Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Accept terms and create the app
5. You'll get:
   - **Client ID**: `a7ce803c30274146af537fcfd306572c`
   - **Client Secret**: `3156f8e689b248699e93fdd211cf7f7b`

## Step 2: Add Redirect URI

1. In the app settings, click "Edit Settings"
2. Add Redirect URI: `http://localhost:5173/auth/callback`
3. Save changes

## Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `express` - Backend server
- `request` - HTTP requests to Spotify
- `cors` - Cross-origin support
- `dotenv` - Environment variables
- `http-proxy-middleware` - Proxy for development

## Step 4: Configure Environment

The credentials are already in the code, but you can also set them in `.env`:

```
VITE_SPOTIFY_CLIENT_ID=a7ce803c30274146af537fcfd306572c
VITE_SPOTIFY_CLIENT_SECRET=3156f8e689b248699e93fdd211cf7f7b
```

## Step 5: Run the Application

### Development Mode (with both frontend and backend):

```bash
npm run dev:full
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### Or run separately:

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

## Step 6: Use the Player

1. Open http://localhost:5173 in your browser
2. Click "Login with Spotify"
3. Authorize the application
4. You'll be redirected to the music player
5. Enjoy full playback control!

## Features

✅ **Full Playback Control**
- Play/Pause
- Next/Previous track
- Seek to position

✅ **Advanced Controls**
- Shuffle mode
- Repeat modes (off, all, one)
- Volume control

✅ **Beautiful UI**
- Album artwork display
- Track information
- Real-time playback progress
- Responsive design

## File Structure

```
waver/
├── server/
│   └── index.js              # Backend auth server
├── src/
│   ├── components/
│   │   ├── SpotifyWebPlayer.tsx    # Main player component
│   │   └── SpotifyLogin.tsx        # Login component
│   ├── pages/
│   │   └── MusicPlayer.tsx         # Music player page
│   └── setupProxy.js               # Development proxy
└── package.json
```

## Troubleshooting

### "No active session" error
- Make sure you're logged in
- Clear browser cookies and try again
- Check that both frontend and backend are running

### Player not showing
- Ensure you have Spotify Premium
- Check browser console for errors
- Make sure redirect URI is configured correctly

### Token expired
- The app automatically refreshes tokens
- If issues persist, log out and log back in

## Production Deployment

For production, you'll need to:

1. Update redirect URIs to your production domain
2. Set environment variables on your server
3. Build the frontend: `npm run build`
4. Deploy the backend server
5. Update CORS origins in `server/index.js`

## API Reference

### Backend Endpoints

- `GET /auth/login` - Start Spotify login
- `GET /auth/callback` - Handle Spotify callback
- `GET /auth/token` - Get current access token
- `POST /auth/logout` - Logout user

### Spotify Web Playback SDK

The player uses the official Spotify Web Playback SDK. See [Spotify Documentation](https://developer.spotify.com/documentation/web-playback-sdk) for more details.

## Support

For issues with:
- **Spotify API**: Check [Spotify Developer Docs](https://developer.spotify.com/documentation)
- **This app**: Check the console for error messages

Enjoy your music! 🎵
