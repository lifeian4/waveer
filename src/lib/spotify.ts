// Spotify Web API integration
// Note: For production use, you'll need to implement proper OAuth flow
// This is a simplified version for demonstration

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    release_date: string;
  };
  duration_ms: number;
  popularity: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

class SpotifyAPI {
  private accessToken: string | null = null;
  private readonly clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private readonly clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  // Get access token using Client Credentials flow
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    // Token expires in 1 hour, clear it after 50 minutes
    setTimeout(() => {
      this.accessToken = null;
    }, 50 * 60 * 1000);

    return this.accessToken;
  }

  // Search for tracks
  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search tracks');
      }

      const data: SpotifySearchResponse = await response.json();
      return data.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      return this.getMockTracks(query);
    }
  }

  // Get track by ID
  async getTrack(id: string): Promise<SpotifyTrack | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get track');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting track:', error);
      return null;
    }
  }

  // Get trending/popular tracks (using featured playlists as proxy)
  async getTrendingTracks(limit: number = 20): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();
      
      // Get featured playlists
      const playlistsResponse = await fetch(
        'https://api.spotify.com/v1/browse/featured-playlists?limit=1',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!playlistsResponse.ok) {
        throw new Error('Failed to get featured playlists');
      }

      const playlistsData = await playlistsResponse.json();
      const firstPlaylist = playlistsData.playlists.items[0];

      if (!firstPlaylist) {
        return this.getMockTrendingTracks();
      }

      // Get tracks from the first featured playlist
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${firstPlaylist.id}/tracks?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!tracksResponse.ok) {
        throw new Error('Failed to get playlist tracks');
      }

      const tracksData = await tracksResponse.json();
      return tracksData.items
        .filter((item: any) => item.track && item.track.type === 'track')
        .map((item: any) => item.track);
    } catch (error) {
      console.error('Error getting trending tracks:', error);
      return this.getMockTrendingTracks();
    }
  }

  // Mock data fallback
  private getMockTrendingTracks(): SpotifyTrack[] {
    return [
      {
        id: "4iV5W9uYEdYUVa79Axb7Rh",
        name: "Flowers",
        artists: [{ 
          id: "5YGY8feqx7naU7z4HrwZM6", 
          name: "Miley Cyrus", 
          external_urls: { spotify: "https://open.spotify.com/artist/5YGY8feqx7naU7z4HrwZM6" } 
        }],
        album: {
          id: "7H7HI9uCRdKCnoNtCWTyVx",
          name: "Endless Summer Vacation",
          images: [{ 
            url: "https://i.scdn.co/image/ab67616d0000b273f4e552d3b0e7e5e8b5e5e5e5", 
            width: 640, 
            height: 640 
          }],
          release_date: "2023-03-10"
        },
        duration_ms: 200960,
        popularity: 95,
        preview_url: "https://p.scdn.co/mp3-preview/sample",
        external_urls: { spotify: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh" }
      },
      {
        id: "1BxfuPKGuaTgP7aM0Bbdwr",
        name: "Cruel Summer",
        artists: [{ 
          id: "06HL4z0CvFAxyc27GXpf02", 
          name: "Taylor Swift", 
          external_urls: { spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02" } 
        }],
        album: {
          id: "uDVkLiPi4POaI1dM",
          name: "Lover",
          images: [{ 
            url: "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647", 
            width: 640, 
            height: 640 
          }],
          release_date: "2019-08-23"
        },
        duration_ms: 178426,
        popularity: 92,
        preview_url: "https://p.scdn.co/mp3-preview/sample",
        external_urls: { spotify: "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr" }
      },
      {
        id: "0V3wPSX9ygBnCm8psDIegu",
        name: "Anti-Hero",
        artists: [{ 
          id: "06HL4z0CvFAxyc27GXpf02", 
          name: "Taylor Swift", 
          external_urls: { spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02" } 
        }],
        album: {
          id: "151w1FgRZfnKZA9FEcg9Z3",
          name: "Midnights",
          images: [{ 
            url: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5", 
            width: 640, 
            height: 640 
          }],
          release_date: "2022-10-21"
        },
        duration_ms: 200690,
        popularity: 94,
        preview_url: "https://p.scdn.co/mp3-preview/sample",
        external_urls: { spotify: "https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu" }
      },
      {
        id: "7qiZfU4dY1lWllzX7mPBI3",
        name: "Shape of You",
        artists: [{ 
          id: "6eUKZXaKkcviH0Ku9w2n3V", 
          name: "Ed Sheeran", 
          external_urls: { spotify: "https://open.spotify.com/artist/6eUKZXaKkcviH0Ku9w2n3V" } 
        }],
        album: {
          id: "3T4tUhGYeRNVUGevb0wThu",
          name: "÷ (Deluxe)",
          images: [{ 
            url: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96", 
            width: 640, 
            height: 640 
          }],
          release_date: "2017-03-03"
        },
        duration_ms: 233713,
        popularity: 91,
        preview_url: "https://p.scdn.co/mp3-preview/sample",
        external_urls: { spotify: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3" }
      },
      {
        id: "4LRPiXqCikLlN15c3yImP7",
        name: "As It Was",
        artists: [{ 
          id: "6KImCVD70vtIoJWnq6nGn3", 
          name: "Harry Styles", 
          external_urls: { spotify: "https://open.spotify.com/artist/6KImCVD70vtIoJWnq6nGn3" } 
        }],
        album: {
          id: "5r36AJ6VOJtp00oxSkBZ5h",
          name: "Harry's House",
          images: [{ 
            url: "https://i.scdn.co/image/ab67616d0000b273daaa0c4e9b8d9e1a5e8c7f8b", 
            width: 640, 
            height: 640 
          }],
          release_date: "2022-05-20"
        },
        duration_ms: 167303,
        popularity: 93,
        preview_url: "https://p.scdn.co/mp3-preview/sample",
        external_urls: { spotify: "https://open.spotify.com/track/4LRPiXqCikLlN15c3yImP7" }
      }
    ];
  }

  private getMockTracks(query: string): SpotifyTrack[] {
    const allTracks = this.getMockTrendingTracks();
    return allTracks.filter(track => 
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artists.some(artist => artist.name.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

// Export singleton instance
export const spotifyAPI = new SpotifyAPI();
export type { SpotifyTrack };
