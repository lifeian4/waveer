/**
 * Google Drive OAuth2 Authentication
 * Handles OAuth2 flow for Google Drive API access
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = window.location.origin + '/google-callback';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Get stored access token from localStorage
 */
export function getStoredAccessToken(): string | null {
  const tokenData = localStorage.getItem('google_drive_token');
  if (!tokenData) return null;

  try {
    const { access_token, expires_at } = JSON.parse(tokenData);
    
    // Check if token is expired
    if (Date.now() >= expires_at) {
      localStorage.removeItem('google_drive_token');
      return null;
    }

    return access_token;
  } catch (error) {
    console.error('Error parsing stored token:', error);
    return null;
  }
}

/**
 * Store access token in localStorage
 */
export function storeAccessToken(tokens: GoogleAuthTokens): void {
  const expires_at = Date.now() + (tokens.expires_in * 1000);
  
  localStorage.setItem('google_drive_token', JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expires_at,
  }));
}

/**
 * Initiate Google OAuth2 login flow
 */
export function initiateGoogleLogin(): void {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');

  // Redirect to Google login
  window.location.href = authUrl.toString();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<GoogleAuthTokens> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  
  const params = new URLSearchParams({
    code: code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  const tokens: GoogleAuthTokens = await response.json();
  storeAccessToken(tokens);
  
  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const tokenData = localStorage.getItem('google_drive_token');
  if (!tokenData) return null;

  try {
    const { refresh_token } = JSON.parse(tokenData);
    if (!refresh_token) return null;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const params = new URLSearchParams({
      refresh_token: refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens: GoogleAuthTokens = await response.json();
    storeAccessToken(tokens);
    
    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('google_drive_token');
    return null;
  }
}

/**
 * Check if user is authenticated with Google Drive
 */
export function isAuthenticated(): boolean {
  return getStoredAccessToken() !== null;
}

/**
 * Logout from Google Drive (clear tokens)
 */
export function logout(): void {
  localStorage.removeItem('google_drive_token');
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  let token = getStoredAccessToken();
  
  if (!token) {
    // Try to refresh
    token = await refreshAccessToken();
  }
  
  return token;
}
