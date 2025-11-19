const express = require('express');
const dotenv = require('dotenv');
const request = require('request');
const path = require('path');
const cors = require('cors');

dotenv.config();

const spotify_client_id = process.env.VITE_SPOTIFY_CLIENT_ID || 'a7ce803c30274146af537fcfd306572c';
const spotify_client_secret = process.env.VITE_SPOTIFY_CLIENT_SECRET || '3156f8e689b248699e93fdd211cf7f7b';

// Determine redirect URI based on environment
const isProduction = process.env.NODE_ENV === 'production';
const redirect_uri = isProduction 
  ? 'https://waveer.netlify.app/auth/callback'
  : 'http://localhost:5173/auth/callback';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Store access tokens in memory (in production, use a database)
const tokens = {};

// Generate random string for state parameter
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// OAuth authorize endpoint - generic OAuth authorization handler
app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, state, scope } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type || !state) {
    return res.status(400).json({ 
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_id, redirect_uri, response_type, state'
    });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ 
      error: 'unsupported_response_type',
      error_description: 'Only response_type=code is supported'
    });
  }

  // Store authorization request for later verification
  const authRequest = {
    client_id,
    redirect_uri,
    response_type,
    state,
    scope: scope || '',
    created_at: Date.now()
  };

  // In production, store this in a database and implement proper user authentication
  // For now, we'll generate an authorization code
  const authCode = generateRandomString(32);
  
  // Store the auth code with request details (in production, use database)
  if (!global.authCodes) {
    global.authCodes = {};
  }
  global.authCodes[authCode] = authRequest;

  // Redirect to redirect_uri with authorization code and state
  const redirectParams = new URLSearchParams({
    code: authCode,
    state: state
  });

  const redirectUrl = `${redirect_uri}${redirect_uri.includes('?') ? '&' : '?'}${redirectParams.toString()}`;
  res.redirect(redirectUrl);
});

// API endpoint for frontend to trigger OAuth authorization
app.get('/api/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, state, scope } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type || !state) {
    return res.status(400).json({ 
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_id, redirect_uri, response_type, state'
    });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ 
      error: 'unsupported_response_type',
      error_description: 'Only response_type=code is supported'
    });
  }

  // Store authorization request for later verification
  const authRequest = {
    client_id,
    redirect_uri,
    response_type,
    state,
    scope: scope || '',
    created_at: Date.now()
  };

  // In production, store this in a database
  const authCode = generateRandomString(32);
  
  if (!global.authCodes) {
    global.authCodes = {};
  }
  global.authCodes[authCode] = authRequest;

  // Return the redirect URL instead of redirecting
  const redirectParams = new URLSearchParams({
    code: authCode,
    state: state
  });

  const redirectUrl = `${redirect_uri}${redirect_uri.includes('?') ? '&' : '?'}${redirectParams.toString()}`;
  
  res.json({
    redirect_url: redirectUrl,
    code: authCode,
    state: state
  });
});

// Login endpoint - redirects to Spotify authorization
app.get('/auth/login', (req, res) => {
  const scope = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
  const state = generateRandomString(16);
  
  const auth_query_parameters = new URLSearchParams({
    response_type: 'code',
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  });

  res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
});

// OAuth token endpoint - exchanges authorization code for access token
app.post('/oauth/token', (req, res) => {
  const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;

  if (!code || !client_id || !redirect_uri || grant_type !== 'authorization_code') {
    return res.status(400).json({ 
      error: 'invalid_request',
      error_description: 'Missing required parameters or invalid grant_type'
    });
  }

  // Retrieve the stored authorization request
  if (!global.authCodes || !global.authCodes[code]) {
    return res.status(400).json({ 
      error: 'invalid_grant',
      error_description: 'Authorization code not found or expired'
    });
  }

  const authRequest = global.authCodes[code];

  // Verify that the client_id and redirect_uri match
  if (authRequest.client_id !== client_id || authRequest.redirect_uri !== redirect_uri) {
    return res.status(400).json({ 
      error: 'invalid_grant',
      error_description: 'client_id or redirect_uri mismatch'
    });
  }

  // Generate access token
  const accessToken = generateRandomString(40);
  const refreshToken = generateRandomString(40);

  // Clean up the used authorization code
  delete global.authCodes[code];

  // Return token response
  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authRequest.scope
  });
});

// Callback endpoint - exchanges code for access token
app.get('/auth/callback', (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code received' });
  }

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const refresh_token = body.refresh_token;
      
      // Store tokens (in production, associate with user session)
      tokens.access_token = access_token;
      tokens.refresh_token = refresh_token;
      tokens.expires_at = Date.now() + (body.expires_in * 1000);

      // Redirect to frontend with token in URL
      const frontendUrl = isProduction 
        ? `https://waveer.netlify.app/?access_token=${access_token}&refresh_token=${refresh_token}`
        : `http://localhost:5173/?access_token=${access_token}&refresh_token=${refresh_token}`;
      res.redirect(frontendUrl);
    } else {
      res.status(response.statusCode).json({ error: 'Failed to get access token' });
    }
  });
});

// Get current access token
app.get('/auth/token', (req, res) => {
  if (!tokens.access_token) {
    return res.status(401).json({ error: 'No active session' });
  }

  // Check if token is expired
  if (Date.now() > tokens.expires_at) {
    // Token expired, need to refresh
    if (tokens.refresh_token) {
      const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token
        },
        headers: {
          'Authorization': 'Basic ' + Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
      };

      request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          tokens.access_token = body.access_token;
          tokens.expires_at = Date.now() + (body.expires_in * 1000);
          res.json({ access_token: tokens.access_token });
        } else {
          res.status(401).json({ error: 'Failed to refresh token' });
        }
      });
    } else {
      res.status(401).json({ error: 'Token expired and no refresh token available' });
    }
  } else {
    res.json({ access_token: tokens.access_token });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  tokens.access_token = null;
  tokens.refresh_token = null;
  res.json({ message: 'Logged out successfully' });
});

// Serve static files from build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Spotify auth server listening at http://localhost:${port}`);
});
