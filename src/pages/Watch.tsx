import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Settings, MessageSquare, Subtitles, Play, Pause, X } from "lucide-react";
import { toast } from "sonner";

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7380); // Default 2h 3min (like in image)
  const [sourceIndex, setSourceIndex] = useState(0);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const iframeRef = useRef(null);

  // Multiple video sources as fallbacks
  const videoSources = [
    `https://vidsrc.xyz/embed/movie/${id}`,
    `https://vidsrc.to/embed/movie/${id}`,
    `https://vidsrc.me/embed/movie/${id}`,
    `https://www.2embed.cc/embed/${id}`,
  ];

  const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      setMovie(data);
      if (data.runtime) {
        setDuration(data.runtime * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast.error('Failed to load movie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate(`/movie-details/${id}`);
  };

  const switchSource = () => {
    if (sourceIndex < videoSources.length - 1) {
      setSourceIndex(sourceIndex + 1);
      toast.info(`Switching to source ${sourceIndex + 2}...`);
    } else {
      toast.error('All video sources failed. This movie may not be available.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading movie...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <Button onClick={() => navigate('/')} variant="outline">Go Home</Button>
        </div>
      </div>
    );
  }

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* VidSrc Iframe - Hidden Controls */}
      <iframe
        ref={iframeRef}
        src={videoSources[sourceIndex]}
        className="w-full h-full"
        allowFullScreen
        title={movie.title}
        allow="autoplay; encrypted-media; fullscreen"
        onError={switchSource}
        style={{ 
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Block VidSrc Controls - Cover bottom area */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto z-40" />

      {/* Netflix-Style Custom Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none z-50"
          >
            {/* Close Button - Top Right */}
            <div className="absolute top-4 right-4 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-full w-10 h-10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Bottom Control Bar - Netflix Style */}
            <div className="absolute bottom-0 left-0 right-0 px-12 pb-8 pointer-events-auto">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full h-1 bg-gray-600 rounded-full cursor-pointer hover:h-2 transition-all">
                  <div 
                    className="h-full bg-red-600 rounded-full relative"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 hover:opacity-100" />
                  </div>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between text-white">
                {/* Left Side Controls */}
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </Button>

                  {/* 10s Backward */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>

                  {/* 10s Forward */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>

                  {/* Volume */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>

                  {/* Time Display */}
                  <span className="text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Center - Movie Title */}
                <div className="text-center">
                  <span className="text-lg font-bold">{movie.title}</span>
                  <span className="text-xs text-gray-400 ml-2">Source {sourceIndex + 1}/{videoSources.length}</span>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-4">
                  {/* Subtitles */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>

                  {/* CC */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <Subtitles className="w-5 h-5" />
                  </Button>

                  {/* Settings */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={switchSource}
                    className="text-white hover:bg-white/20 w-10 h-10"
                    title="Switch video source"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Watch;
