import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';

interface SpotifyWebPlayerProps {
  token: string;
}

interface Track {
  name: string;
  album: {
    images: Array<{ url: string }>;
  };
  artists: Array<{ name: string }>;
  duration_ms: number;
}

const SpotifyWebPlayer: React.FC<SpotifyWebPlayerProps> = ({ token }) => {
  const [player, setPlayer] = useState<any>(null);
  const [is_paused, setPaused] = useState(true);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState<Track>({
    name: 'Loading...',
    album: {
      images: [{ url: 'https://via.placeholder.com/300' }]
    },
    artists: [{ name: 'Unknown Artist' }],
    duration_ms: 0
  });
  const [current_position, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [shuffle, setShuffle] = useState(false);
  const [repeat_mode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: 'Waver Music Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
        volume: volume
      });

      playerRef.current = player;
      setPlayer(player);

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setActive(true);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setActive(false);
      });

      // Player state changed
      player.addListener('player_state_changed', (state: any) => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);
        setCurrentPosition(state.position);
        setDuration(state.duration);
        setShuffle(state.shuffle);
        setRepeatMode(state.repeat_mode);

        player.getCurrentState().then((state: any) => {
          setActive(!!state);
        });
      });

      player.connect();
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [token]);

  const handlePlayPause = () => {
    if (playerRef.current) {
      playerRef.current.togglePlay();
    }
  };

  const handleNext = () => {
    if (playerRef.current) {
      playerRef.current.nextTrack();
    }
  };

  const handlePrevious = () => {
    if (playerRef.current) {
      playerRef.current.previousTrack();
    }
  };

  const handleShuffle = () => {
    if (playerRef.current) {
      playerRef.current.toggleShuffle();
    }
  };

  const handleRepeat = () => {
    if (playerRef.current) {
      // Cycle through repeat modes: off -> all -> one -> off
      const nextMode = (repeat_mode + 1) % 3;
      playerRef.current.setRepeatMode(nextMode);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (playerRef.current) {
      playerRef.current.setVolume(value[0]);
    }
  };

  const handleSeek = (value: number[]) => {
    setCurrentPosition(value[0]);
    if (playerRef.current) {
      playerRef.current.seek(value[0]);
    }
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!is_active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Waver Music Player</h1>
          <p className="text-gray-400 mb-8">Initializing Spotify Web Playback SDK...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Waver</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-400 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      {/* Main Player */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          {/* Album Art */}
          <div className="mb-8 rounded-lg overflow-hidden shadow-2xl">
            <img
              src={current_track.album.images[0]?.url || 'https://via.placeholder.com/300'}
              alt={current_track.name}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* Track Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 truncate">{current_track.name}</h2>
            <p className="text-gray-400 truncate">{current_track.artists[0]?.name}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[current_position]}
              onValueChange={handleSeek}
              max={duration}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{formatTime(current_position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrevious}
              className="text-white hover:text-green-500"
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={handlePlayPause}
                className="bg-green-500 hover:bg-green-600 text-black rounded-full w-16 h-16 p-0"
              >
                {is_paused ? (
                  <Play className="w-8 h-8 ml-1" />
                ) : (
                  <Pause className="w-8 h-8" />
                )}
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleNext}
              className="text-white hover:text-green-500"
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between mb-8 px-4">
            {/* Shuffle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShuffle}
              className={`${shuffle ? 'text-green-500' : 'text-gray-400'} hover:text-white`}
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            {/* Repeat */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepeat}
              className={`${repeat_mode > 0 ? 'text-green-500' : 'text-gray-400'} hover:text-white relative`}
            >
              <Repeat className="w-5 h-5" />
              {repeat_mode === 2 && (
                <span className="absolute text-xs font-bold text-green-500 bottom-0 right-0">1</span>
              )}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400" />
              )}
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-24"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpotifyWebPlayer;
