import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink,
  Music as MusicIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Track } from "@/lib/musicAPI";
import { toast } from "sonner";

interface ImprovedMusicPlayerProps {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
}

const PREVIEW_DURATION = 30; // 30 seconds preview

const ImprovedMusicPlayer = ({
  currentTrack,
  playlist,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onTrackEnd
}: ImprovedMusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showSpotifyPrompt, setShowSpotifyPrompt] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [isSpotifyAuth, setIsSpotifyAuth] = useState(false);

  // Check Spotify authentication
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    const authenticated = token && expiry && Date.now() < parseInt(expiry);
    setIsSpotifyAuth(!!authenticated);
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.preview_url) {
      audioRef.current.src = currentTrack.preview_url;
      audioRef.current.load();
      setCurrentTime(0);
      setPreviewEnded(false);
    }
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !previewEnded) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, previewEnded]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Check if preview time limit reached (only for non-authenticated users)
  useEffect(() => {
    if (!isSpotifyAuth && currentTime >= PREVIEW_DURATION && !previewEnded) {
      setPreviewEnded(true);
      setShowSpotifyPrompt(true);
      onPlayPause(); // Pause the track
      toast.info("Preview ended. Login with Spotify to continue listening!");
    }
  }, [currentTime, previewEnded, isSpotifyAuth]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      // Set full duration if authenticated, otherwise 30 seconds preview
      const trackDuration = isSpotifyAuth 
        ? audioRef.current.duration 
        : Math.min(audioRef.current.duration, PREVIEW_DURATION);
      setDuration(trackDuration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && !previewEnded) {
      const newTime = Math.min(value[0], PREVIEW_DURATION);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Removed from liked songs" : "Added to liked songs");
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handleAudioEnd = () => {
    if (currentTime >= PREVIEW_DURATION - 1) {
      setPreviewEnded(true);
      setShowSpotifyPrompt(true);
      onPlayPause();
    } else {
      onTrackEnd();
    }
  };

  const handleSpotifyLogin = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/spotify-callback');
    const scopes = encodeURIComponent('user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state');
    
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
    
    window.location.href = spotifyAuthUrl;
  };

  const handleNextTrack = () => {
    setPreviewEnded(false);
    onNext();
  };

  const handlePreviousTrack = () => {
    setPreviewEnded(false);
    onPrevious();
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-20 left-0 right-0 z-40 px-4"
      >
        <Card className="bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
          <CardContent className="p-4">
            {/* Audio element */}
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleAudioEnd}
              preload="metadata"
            />

            {/* Progress bar with preview indicator */}
            <div className="mb-4">
              <div className="relative">
                <Slider
                  value={[currentTime]}
                  max={PREVIEW_DURATION}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                  disabled={previewEnded}
                />
                {/* Preview limit indicator */}
                <div 
                  className="absolute top-0 h-full w-1 bg-primary/50"
                  style={{ left: `${(PREVIEW_DURATION / PREVIEW_DURATION) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatTime(currentTime)}</span>
                {isSpotifyAuth ? (
                  <span className="text-green-500 font-semibold">🎵 Spotify Premium</span>
                ) : (
                  <span className="text-primary">Preview: {formatTime(PREVIEW_DURATION)}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Track info with better styling */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <img
                    src={currentTrack.artwork_url || '/placeholder-album.jpg'}
                    alt={currentTrack.album}
                    className="w-14 h-14 rounded-lg object-cover shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm truncate">{currentTrack.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                  <p className="text-xs text-primary/70 truncate">{currentTrack.album}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleLike}
                  className={`${isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                </Button>
              </div>

              {/* Enhanced Controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleShuffle}
                  className={`${isShuffle ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePreviousTrack}
                  disabled={playlist.length <= 1}
                  className="hover:scale-110 transition-transform"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button
                  size="lg"
                  onClick={previewEnded ? () => setShowSpotifyPrompt(true) : onPlayPause}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {previewEnded ? (
                    <ExternalLink className="w-5 h-5" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNextTrack}
                  disabled={playlist.length <= 1}
                  className="hover:scale-110 transition-transform"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleRepeat}
                  className={`${isRepeat ? "text-primary" : "text-muted-foreground"} hover:text-primary transition-colors`}
                >
                  <Repeat className="w-4 h-4" />
                </Button>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div className="w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>

            {/* Preview warning */}
            {currentTime > PREVIEW_DURATION - 5 && !previewEnded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <p className="text-xs text-primary">
                  Preview ending soon... Login with Spotify to continue!
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Spotify Login Prompt Dialog */}
      <Dialog open={showSpotifyPrompt} onOpenChange={setShowSpotifyPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <MusicIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Continue Listening?</DialogTitle>
            <DialogDescription className="text-center">
              You've reached the end of the 30-second preview. Login with Spotify to enjoy the full song and unlimited music!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            <Button
              onClick={handleSpotifyLogin}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-6 text-lg"
            >
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Login with Spotify
            </Button>
            
            <Button
              onClick={() => {
                setShowSpotifyPrompt(false);
                handleNextTrack();
              }}
              variant="outline"
              className="w-full"
            >
              Skip to Next Song
            </Button>
            
            <Button
              onClick={() => setShowSpotifyPrompt(false)}
              variant="ghost"
              className="w-full"
            >
              Close
            </Button>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>By logging in, you agree to Spotify's Terms of Service</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImprovedMusicPlayer;
