import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function OAuthAuthorize() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope');

  // Validate required parameters
  useEffect(() => {
    if (!clientId || !redirectUri || !responseType || !state) {
      setError('Invalid authorization request: missing required parameters');
    }
    if (responseType !== 'code') {
      setError('Invalid response_type. Only "code" is supported');
    }
  }, [clientId, redirectUri, responseType, state]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleAllow = async () => {
    if (!clientId || !redirectUri || !state) {
      setError('Missing required parameters');
      return;
    }

    setLoading(true);
    try {
      // Call the OAuth authorize endpoint
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        state: state,
        scope: scope || '',
      });

      const response = await fetch(`/api/oauth/authorize?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Authorization failed');
      }

      const data = await response.json();
      if (data.redirect_url) {
        // Redirect to the client application with the authorization code
        window.location.href = data.redirect_url;
      } else {
        throw new Error('No redirect URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed');
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri || !state) {
      setError('Missing required parameters');
      return;
    }

    // Redirect with error
    const errorParams = new URLSearchParams({
      error: 'access_denied',
      error_description: 'User denied authorization',
      state: state,
    });

    window.location.href = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}${errorParams.toString()}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const scopeList = scope ? scope.split('+').map(s => s.trim()) : [];
  const appName = clientId?.split('_')[0] || 'Application';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authorization Request</h1>
            <p className="text-slate-400">
              <span className="font-semibold text-white">{appName}</span> wants to access your Waveer account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* User Info */}
          <div className="mb-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-slate-300 text-sm mb-2">Signing in as:</p>
            <div className="flex items-center gap-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {scopeList.length > 0 && (
            <div className="mb-8">
              <p className="text-slate-300 text-sm font-semibold mb-3">This app will have access to:</p>
              <ul className="space-y-2">
                {scopeList.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="capitalize">{s.replace(/[_-]/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Info */}
          <div className="mb-8 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-200 text-xs">
              🔒 Your password is never shared with third-party applications. Only the permissions you approve will be granted.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={loading}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Deny
            </Button>
            <Button
              onClick={handleAllow}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Authorizing...' : 'Allow'}
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-6">
            By clicking "Allow", you authorize this application to access your Waveer account according to the permissions listed above.
          </p>
        </div>
      </Card>
    </div>
  );
}
