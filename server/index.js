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

// OAuth authorize endpoint - serves HTML page for authorization
app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, state, scope } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type || !state) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a1a; }
            .error { background: #2a2a2a; padding: 40px; border-radius: 8px; color: #fff; text-align: center; max-width: 500px; }
            h1 { color: #ff6b6b; margin-top: 0; }
            p { color: #ccc; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Error</h1>
            <p>Missing required parameters: client_id, redirect_uri, response_type, state</p>
          </div>
        </body>
      </html>
    `);
  }

  if (response_type !== 'code') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a1a; }
            .error { background: #2a2a2a; padding: 40px; border-radius: 8px; color: #fff; text-align: center; max-width: 500px; }
            h1 { color: #ff6b6b; margin-top: 0; }
            p { color: #ccc; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Unsupported Response Type</h1>
            <p>Only response_type=code is supported</p>
          </div>
        </body>
      </html>
    `);
  }

  // Store authorization request
  const authRequest = {
    client_id,
    redirect_uri,
    response_type,
    state,
    scope: scope || '',
    created_at: Date.now()
  };

  // Generate authorization code
  const authCode = generateRandomString(32);
  
  if (!global.authCodes) {
    global.authCodes = {};
  }
  global.authCodes[authCode] = authRequest;

  // Serve HTML page for authorization
  const scopeList = scope ? scope.split('+').map(s => s.trim()) : [];
  const appName = client_id.split('_')[0] || 'Application';
  const encodedState = encodeURIComponent(state);
  const encodedCode = encodeURIComponent(authCode);
  const encodedRedirectUri = encodeURIComponent(redirect_uri);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Authorize ${appName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          width: 100%;
          max-width: 500px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          padding: 40px 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          color: white;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .account-section {
          background: #334155;
          border: 1px solid #475569;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .account-label {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: block;
        }
        
        .account-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .account-details h3 {
          color: white;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .account-details p {
          color: #94a3b8;
          font-size: 13px;
        }
        
        .permissions-section {
          margin-bottom: 30px;
        }
        
        .permissions-label {
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
          display: block;
        }
        
        .permission-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cbd5e1;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .permission-item:last-child {
          margin-bottom: 0;
        }
        
        .checkmark {
          color: #10b981;
          font-weight: bold;
        }
        
        .security-notice {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 30px;
        }
        
        .security-notice p {
          color: #93c5fd;
          font-size: 12px;
          line-height: 1.5;
        }
        
        .button-group {
          display: flex;
          gap: 12px;
        }
        
        button {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-deny {
          background: #334155;
          color: #cbd5e1;
          border: 1px solid #475569;
        }
        
        .btn-deny:hover {
          background: #475569;
          color: #e2e8f0;
        }
        
        .btn-allow {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }
        
        .btn-allow:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }
        
        .footer {
          text-align: center;
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
          padding: 0 30px 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Authorization Request</h1>
          <p><strong>${appName}</strong> wants to access your Waveer account</p>
        </div>
        
        <div class="content">
          <div class="account-section">
            <span class="account-label">Signing in as</span>
            <div class="account-info">
              <div class="avatar">W</div>
              <div class="account-details">
                <h3>Waveer User</h3>
                <p>user@waveer.app</p>
              </div>
            </div>
          </div>
          
          ${scopeList.length > 0 ? `
            <div class="permissions-section">
              <span class="permissions-label">This app will have access to:</span>
              ${scopeList.map(s => `
                <div class="permission-item">
                  <span class="checkmark">✓</span>
                  <span>${s.charAt(0).toUpperCase() + s.slice(1).replace(/[_-]/g, ' ')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="security-notice">
            <p>🔒 Your password is never shared with third-party applications. Only the permissions you approve will be granted.</p>
          </div>
          
          <div class="button-group">
            <button class="btn-deny" onclick="denyAuthorization()">Deny</button>
            <button class="btn-allow" onclick="allowAuthorization()">Allow</button>
          </div>
        </div>
        
        <div class="footer">
          <p>By clicking "Allow", you authorize this application to access your Waveer account according to the permissions listed above.</p>
        </div>
      </div>
      
      <script>
        function allowAuthorization() {
          const redirectUri = '${encodedRedirectUri}';
          const code = '${encodedCode}';
          const state = '${encodedState}';
          
          const decodedUri = decodeURIComponent(redirectUri);
          const separator = decodedUri.includes('?') ? '&' : '?';
          const finalUrl = decodedUri + separator + 'code=' + code + '&state=' + state;
          
          window.location.href = finalUrl;
        }
        
        function denyAuthorization() {
          const redirectUri = '${encodedRedirectUri}';
          const state = '${encodedState}';
          
          const decodedUri = decodeURIComponent(redirectUri);
          const separator = decodedUri.includes('?') ? '&' : '?';
          const finalUrl = decodedUri + separator + 'error=access_denied&error_description=User denied authorization&state=' + state;
          
          window.location.href = finalUrl;
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
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
