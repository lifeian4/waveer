/**
 * Spotify Web Playback SDK Integration
 * Handles full song playback after user authentication
 */

export interface SpotifyPlayerState {
  isConnected: boolean;
  isPremium: boolean;
  deviceId: string | null;
}

export class SpotifyPlayer {
  private player: any = null;
  private accessToken: string | null = null;
  private deviceId: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('spotify_access_token');
  }

  /**
   * Check if user is authenticated with Spotify
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    
    if (!token || !expiry) return false;
    
    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      this.clearAuth();
      return false;
    }
    
    return true;
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    this.accessToken = null;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('spotify_access_token');
  }

  /**
   * Initialize Spotify Web Playback SDK
   */
  async initialize(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      console.log('Not authenticated with Spotify');
      return false;
    }

    return new Promise((resolve) => {
      // Load Spotify Web Playback SDK
      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
          this.setupPlayer();
          resolve(true);
        };
      } else {
        this.setupPlayer();
        resolve(true);
      }
    });
  }

  /**
   * Setup Spotify Player
   */
  private setupPlayer() {
    const token = this.getAccessToken();
    if (!token) return;

    this.player = new window.Spotify.Player({
      name: 'Waver Music Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(token);
      },
      volume: 0.7
    });

    // Error handling
    this.player.addListener('initialization_error', ({ message }: any) => {
      console.error('Initialization Error:', message);
    });

    this.player.addListener('authentication_error', ({ message }: any) => {
      console.error('Authentication Error:', message);
      this.clearAuth();
    });

    this.player.addListener('account_error', ({ message }: any) => {
      console.error('Account Error:', message);
    });

    this.player.addListener('playback_error', ({ message }: any) => {
      console.error('Playback Error:', message);
    });

    // Ready
    this.player.addListener('ready', ({ device_id }: any) => {
      console.log('Spotify Player Ready with Device ID:', device_id);
      this.deviceId = device_id;
    });

    // Connect to the player
    this.player.connect();
  }

  /**
   * Play a track by Spotify URI
   */
  async playTrack(spotifyUri: string): Promise<boolean> {
    if (!this.deviceId || !this.accessToken) {
      console.error('Player not ready');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          uris: [spotifyUri]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }

  /**
   * Play track by ID
   */
  async playTrackById(trackId: string): Promise<boolean> {
    return this.playTrack(`spotify:track:${trackId}`);
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.player) {
      await this.player.pause();
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.player) {
      await this.player.resume();
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlay(): Promise<void> {
    if (this.player) {
      await this.player.togglePlay();
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    if (this.player) {
      await this.player.setVolume(volume);
    }
  }

  /**
   * Get current playback state
   */
  async getState(): Promise<any> {
    if (this.player) {
      return await this.player.getCurrentState();
    }
    return null;
  }

  /**
   * Disconnect player
   */
  disconnect(): void {
    if (this.player) {
      this.player.disconnect();
    }
  }
}

// Global instance
export const spotifyPlayer = new SpotifyPlayer();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}
