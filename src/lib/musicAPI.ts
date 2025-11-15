// Spotify API integration
// Uses Spotify Web API for music search and playback

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  preview_url?: string;
  artwork_url?: string;
  release_date?: string;
  genre?: string;
  popularity?: number;
  spotify_uri?: string; // Spotify URI for playback
  spotify_id?: string; // Spotify track ID
}

export interface SearchResult {
  tracks: Track[];
  total: number;
}

class MusicAPI {
  // Spotify API endpoint
  private readonly spotifyBaseURL = 'https://api.spotify.com/v1';
  
  // Spotify credentials from environment
  private readonly spotifyClientId = 'a7ce803c30274146af537fcfd306572c';
  private readonly spotifyClientSecret = '3156f8e689b248699e93fdd211cf7f7b';
  
  // Spotify token - will be fetched dynamically
  private spotifyToken: string | null = null;
  private tokenExpiry: number = 0;

  // Get fresh Spotify token using Client Credentials flow
  private async getSpotifyToken(): Promise<string> {
    // Check if token is still valid
    if (this.spotifyToken && Date.now() < this.tokenExpiry) {
      return this.spotifyToken;
    }

    try {
      const auth = btoa(`${this.spotifyClientId}:${this.spotifyClientSecret}`);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify token');
      }

      const data = await response.json();
      this.spotifyToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.spotifyToken;
    } catch (error) {
      console.error('Error getting Spotify token:', error);
      throw error;
    }
  }

  // Fetch from Spotify API with token refresh capability
  private async fetchSpotifyApi(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      // Get fresh token if needed
      const token = await this.getSpotifyToken();

      const response = await fetch(`${this.spotifyBaseURL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (response.status === 401) {
        // Token might have expired, clear it and retry
        this.spotifyToken = null;
        const newToken = await this.getSpotifyToken();
        
        const retryResponse = await fetch(`${this.spotifyBaseURL}${endpoint}`, {
          method,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined
        });

        if (!retryResponse.ok) {
          throw new Error(`Spotify API error: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching from Spotify API:', error);
      throw error;
    }
  }

  // Search tracks using Spotify API with fallback
  async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    try {
      const data = await this.fetchSpotifyApi(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
      );

      if (!data.tracks || !data.tracks.items || data.tracks.items.length === 0) {
        return this.getFallbackTracks(query);
      }

      return data.tracks.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        artist: item.artists.map((a: any) => a.name).join(', '),
        album: item.album.name,
        duration: Math.floor(item.duration_ms / 1000),
        preview_url: item.preview_url,
        artwork_url: item.album.images[0]?.url,
        release_date: item.album.release_date,
        genre: item.type,
        popularity: item.popularity,
        spotify_uri: item.uri,
        spotify_id: item.id
      }));
    } catch (error) {
      console.error('Error searching tracks:', error);
      return this.getFallbackTracks(query);
    }
  }

  // Get trending/popular tracks
  async getTrendingTracks(limit: number = 20): Promise<Track[]> {
    try {
      // Search for popular terms to get trending music
      const trendingQueries = [
        'top hits 2024',
        'popular music',
        'chart toppers',
        'trending songs',
        'hit songs'
      ];
      
      const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
      return await this.searchTracks(randomQuery, limit);
    } catch (error) {
      console.error('Error getting trending tracks:', error);
      return this.getFallbackTracks();
    }
  }

  // Get tracks by genre
  async getTracksByGenre(genre: string, limit: number = 20): Promise<Track[]> {
    try {
      return await this.searchTracks(`${genre} music`, limit);
    } catch (error) {
      console.error('Error getting tracks by genre:', error);
      return this.getFallbackTracks();
    }
  }

  // Get track suggestions based on artist
  async getArtistTracks(artist: string, limit: number = 10): Promise<Track[]> {
    try {
      return await this.searchTracks(artist, limit);
    } catch (error) {
      console.error('Error getting artist tracks:', error);
      return this.getFallbackTracks();
    }
  }

  // Fallback data when APIs fail
  private getFallbackTracks(query?: string): Track[] {
    const fallbackTracks: Track[] = [
      {
        id: '1',
        name: 'Flowers',
        artist: 'Miley Cyrus',
        album: 'Endless Summer Vacation',
        duration: 200,
        preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/sample.m4a',
        artwork_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/sample/300x300bb.jpg',
        release_date: '2023-03-10',
        genre: 'Pop',
        popularity: 95,
        spotify_id: '0VjIjW4GlUZAMYd2vXMwbk'
      },
      {
        id: '2',
        name: 'Anti-Hero',
        artist: 'Taylor Swift',
        album: 'Midnights',
        duration: 201,
        preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/sample2.m4a',
        artwork_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/sample2/300x300bb.jpg',
        release_date: '2022-10-21',
        genre: 'Pop',
        popularity: 94,
        spotify_id: '0cqnfodIaU421WSoWJ3EZw'
      },
      {
        id: '3',
        name: 'As It Was',
        artist: 'Harry Styles',
        album: "Harry's House",
        duration: 167,
        preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/sample3.m4a',
        artwork_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/sample3/300x300bb.jpg',
        release_date: '2022-05-20',
        genre: 'Pop',
        popularity: 93,
        spotify_id: '0DiWzAVbikQWW7AGNN1qIl'
      },
      {
        id: '4',
        name: 'Shape of You',
        artist: 'Ed Sheeran',
        album: '÷ (Divide)',
        duration: 234,
        preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/sample4.m4a',
        artwork_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/sample4/300x300bb.jpg',
        release_date: '2017-03-03',
        genre: 'Pop',
        popularity: 91,
        spotify_id: '7qiZfU4dY1lsylvNFuFqLn'
      },
      {
        id: '5',
        name: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: 200,
        preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/sample5.m4a',
        artwork_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/sample5/300x300bb.jpg',
        release_date: '2019-11-29',
        genre: 'R&B/Soul',
        popularity: 92,
        spotify_id: '0VjIjW4GlUZAMYd2vXMwbk'
      }
    ];

    if (query) {
      return fallbackTracks.filter(track => 
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.album.toLowerCase().includes(query.toLowerCase())
      );
    }

    return fallbackTracks;
  }

  // Get autocomplete suggestions using Spotify API
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 1) return [];

    try {
      // Search Spotify for tracks and artists matching the query
      const data = await this.fetchSpotifyApi(
        `/search?q=${encodeURIComponent(query)}&type=track,artist&limit=10`
      );
      
      // Extract unique track and artist names from results
      const suggestions = new Set<string>();
      
      if (data.tracks && data.tracks.items.length > 0) {
        data.tracks.items.forEach((item: any) => {
          suggestions.add(item.name);
          if (item.artists && item.artists.length > 0) {
            suggestions.add(item.artists[0].name);
          }
        });
      }
      
      if (data.artists && data.artists.items.length > 0) {
        data.artists.items.forEach((item: any) => {
          suggestions.add(item.name);
        });
      }
      
      return Array.from(suggestions).slice(0, 5);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      
      // Fallback to simple suggestions
      try {
        const suggestions = [
          `${query}`,
          `${query} songs`,
          `${query} music`
        ];

        const popularSuggestions = [
          'Taylor Swift',
          'Ed Sheeran',
          'Billie Eilish',
          'The Weeknd',
          'Dua Lipa',
          'Harry Styles',
          'Ariana Grande',
          'Post Malone',
          'Olivia Rodrigo',
          'Bruno Mars'
        ].filter(item => item.toLowerCase().includes(query.toLowerCase()));

        return [...suggestions, ...popularSuggestions].slice(0, 5);
      } catch {
        return [];
      }
    }
  }
}

// Export singleton instance
export const musicAPI = new MusicAPI();
export default musicAPI;
