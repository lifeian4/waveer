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
  Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import type { Track } from "@/lib/musicAPI";

interface MusicPlayerProps {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
}

const MusicPlayer = ({
  currentTrack,
  playlist,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onTrackEnd
}: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.preview_url) {
      audioRef.current.src = currentTrack.preview_url;
      audioRef.current.load();
    }
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
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
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-20 left-0 right-0 z-40 px-4"
    >
      <Card className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <CardContent className="p-4">
          {/* Audio element */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={onTrackEnd}
            preload="metadata"
          />

          {/* Progress bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Track info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={currentTrack.artwork_url || '/placeholder-album.jpg'}
                alt={currentTrack.album}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm truncate">{currentTrack.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleLike}
                className={isLiked ? "text-red-500" : "text-muted-foreground"}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleShuffle}
                className={isShuffle ? "text-primary" : "text-muted-foreground"}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onPrevious}
                disabled={playlist.length <= 1}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={onPlayPause}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onNext}
                disabled={playlist.length <= 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleRepeat}
                className={isRepeat ? "text-primary" : "text-muted-foreground"}
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
                className="text-muted-foreground"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MusicPlayer;
