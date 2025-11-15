import React, { useState, useEffect } from 'react';
import SpotifyWebPlayer from '@/components/SpotifyWebPlayer';
import SpotifyLogin from '@/components/SpotifyLogin';

const MusicPlayer: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (from callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('access_token');
    
    if (urlToken) {
      setToken(urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Try to get token from server
      getToken();
    }
  }, []);

  const getToken = async () => {
    try {
      const response = await fetch('/auth/token');
      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
      }
    } catch (error) {
      console.error('Error getting token:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return token ? <SpotifyWebPlayer token={token} /> : <SpotifyLogin />;
};

export default MusicPlayer;
