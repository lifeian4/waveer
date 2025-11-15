import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Heart,
  Repeat,
  Shuffle,
  Maximize2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Track } from "@/lib/musicAPI";
import { toast } from "sonner";

// Type for Spotify SDK
type SpotifyWindow = Window & {
  onSpotifyWebPlaybackSDKReady?: () => void;
  Spotify?: {
    Player: any;
  };
};

interface SquareMusicPlayerProps {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
}

const SquareMusicPlayer = ({
  currentTrack,
  playlist,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onTrackEnd
}: SquareMusicPlayerProps) => {
  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showModal, setShowModal] = useState(true); // Always show modal
  const [spotifyPlayer, setSpotifyPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const playerRef = useRef<any>(null);

  // Handle repeat mode
  const handleRepeatClick = () => {
    setIsRepeat(!isRepeat);
  };

  // Handle shuffle
  const handleShuffleClick = () => {
    setIsShuffle(!isShuffle);
  };

  // Handle play/pause with Spotify SDK
  const handlePlayPauseWithSpotify = async () => {
    if (spotifyPlayer) {
      try {
        const token = await getAccessToken();
        const method = isPlaying ? 'pause' : 'play';
        
        await fetch(`https://api.spotify.com/v1/me/player/${method}?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        onPlayPause();
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    } else {
      onPlayPause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  // Initialize Spotify SDK
  useEffect(() => {
    // Get access token
    const getToken = async () => {
      try {
        const response = await fetch('/auth/token');
        if (response.ok) {
          const data = await response.json();
          const token = data.access_token;

          // Load Spotify SDK
          const script = document.createElement('script');
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          document.body.appendChild(script);

          (window as SpotifyWindow).onSpotifyWebPlaybackSDKReady = () => {
            const player = new (window as SpotifyWindow).Spotify!.Player({
              name: 'Waver Music Player',
              getOAuthToken: (cb: (token: string) => void) => {
                cb(token);
              },
              volume: volume
            });

            playerRef.current = player;
            setSpotifyPlayer(player);

            player.addListener('ready', ({ device_id }: { device_id: string }) => {
              console.log('Spotify Player ready with device ID:', device_id);
              setDeviceId(device_id);
            });

            player.addListener('player_state_changed', (state: any) => {
              if (state) {
                setCurrentTime(Math.floor(state.position / 1000));
                setDuration(Math.floor(state.duration / 1000));
              }
            });

            player.connect();
          };
        }
      } catch (error) {
        console.error('Error initializing Spotify:', error);
      }
    };

    getToken();

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  // Set duration from track data
  useEffect(() => {
    if (currentTrack) {
      // Use duration from track, default to 0 if not available
      const trackDuration = currentTrack.duration || 0;
      setDuration(trackDuration);
      setCurrentTime(0);
    }
  }, [currentTrack]);

  // Play track when it changes
  useEffect(() => {
    if (currentTrack && currentTrack.spotify_uri && spotifyPlayer && deviceId && isPlaying) {
      playTrack(currentTrack.spotify_uri);
    }
  }, [currentTrack, spotifyPlayer, deviceId, isPlaying]);

  // Play track using Spotify API
  const playTrack = async (spotify_uri: string) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [spotify_uri]
        })
      });

      if (!response.ok) {
        console.error('Failed to play track:', response.status);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Get access token
  const getAccessToken = async (): Promise<string> => {
    const response = await fetch('/auth/token');
    const data = await response.json();
    return data.access_token;
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>

      {/* Square Music Player Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm w-full p-0 bg-black border-none overflow-hidden rounded-lg" style={{ aspectRatio: '1/1', maxHeight: '90vh' }}>
          <div className="relative w-full h-full flex flex-col">
            {/* Spotify Player with Custom Controls */}
            {currentTrack.spotify_id ? (
              <div className="w-full h-full flex flex-col relative bg-black">
                {/* Album Art Background */}
                <div className="absolute inset-0">
                  <img
                    src={currentTrack.artwork_url || '/placeholder-album.jpg'}
                    alt={currentTrack.album}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/60" />
                </div>

                {/* Close Button */}
                <div className="absolute top-3 left-3 z-20">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    className="text-white hover:bg-white/20 rounded-full bg-black/50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Spotify Logo */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="bg-green-500 rounded-full p-2">
                    <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-12.061-1.42-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.079 10.561 18.739 12.84c.361.22.559.659.3 1.099zm.179-3.424c-3.9-2.32-10.319-2.561-14.978-1.42-.6.179-1.2-.181-1.38-.764-.18-.575.179-1.2.756-1.381 5.099-1.32 12.057-1.08 16.578 1.516.479.305.599.875.301 1.354-.301.479-.875.599-1.354.301z"/>
                    </svg>
                  </div>
                </div>

                {/* Center Content */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
                  {/* Track Info */}
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white mb-2 truncate">{currentTrack.name}</h2>
                    <p className="text-sm text-gray-300 truncate">{currentTrack.artist}</p>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-12">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleSeek}
                      max={duration || 100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Main Controls */}
                  <div className="flex items-center justify-center gap-6">
                    {/* Volume */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:text-green-500 p-2"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>

                    {/* Previous */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onPrevious}
                      className="text-white hover:text-green-500 p-2"
                    >
                      <SkipBack className="w-6 h-6" />
                    </Button>

                    {/* Play/Pause */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        onClick={handlePlayPauseWithSpotify}
                        className="bg-white text-black hover:bg-gray-100 rounded-full w-14 h-14 p-0 shadow-2xl"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </Button>
                    </motion.div>

                    {/* Next */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onNext}
                      className="text-white hover:text-green-500 p-2"
                    >
                      <SkipForward className="w-6 h-6" />
                    </Button>

                    {/* Shuffle */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleShuffleClick}
                      className={`${isShuffle ? "text-green-500" : "text-white"} hover:text-green-500 p-2`}
                    >
                      <Shuffle className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Repeat Button */}
                  <div className="flex justify-center mt-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRepeatClick}
                      className={`${isRepeat ? "text-green-500" : "text-white"} hover:text-green-500 p-2`}
                    >
                      <Repeat className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Album Art Background with Overlay */}
                <div className="relative flex-1 bg-black overflow-hidden">
                  <img
                    src={currentTrack.artwork_url || '/placeholder-album.jpg'}
                    alt={currentTrack.album}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
                  
                  {/* Top Controls */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowModal(false)}
                      className="text-white hover:bg-white/20 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsLiked(!isLiked);
                        toast.success(isLiked ? "Removed from liked songs" : "Added to liked songs");
                      }}
                      className="text-white hover:bg-white/20 rounded-full"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-red-500" : ""}`} />
                    </Button>
                  </div>

                  {/* Center Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        onClick={onPlayPause}
                        className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16 p-0 shadow-2xl"
                      >
                        {isPlaying ? (
                          <Pause className="w-7 h-7" />
                        ) : (
                          <Play className="w-7 h-7 ml-1" />
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {/* Bottom Control Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-8">
                    {/* Time Display */}
                    <div className="flex items-center justify-between text-white text-xs mb-3">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <Slider
                        value={[currentTime]}
                        onValueChange={handleSeek}
                        max={duration || 100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      {/* Left Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-white hover:text-gray-300 p-2 transition-colors"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRepeatClick}
                          className={`p-2 transition-colors ${isRepeat ? "text-green-400" : "text-white"} hover:text-gray-300`}
                        >
                          <Repeat className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Center Skip Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={onPrevious}
                          className="text-white hover:text-gray-300 p-2"
                        >
                          <SkipBack className="w-5 h-5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={onNext}
                          className="text-white hover:text-gray-300 p-2"
                        >
                          <SkipForward className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleShuffleClick}
                          className={`p-2 transition-colors ${isShuffle ? "text-green-400" : "text-white"} hover:text-gray-300`}
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:text-gray-300 p-2 transition-colors"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track Info Section */}
                <div className="bg-black px-4 py-4 border-t border-white/10">
                  <h2 className="text-lg font-bold text-white truncate">{currentTrack.name}</h2>
                  <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SquareMusicPlayer;
