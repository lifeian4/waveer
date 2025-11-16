import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const WatchEpisode = () => {
  const { id, season, episode } = useParams();
  const navigate = useNavigate();
  const [episodeData, setEpisodeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Multiple video sources as fallbacks
  const videoSources = [
    `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`,
    `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
    `https://vidsrc.me/embed/tv/${id}/${season}/${episode}`,
  ];

  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

  const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json;charset=utf-8'
  };

  useEffect(() => {
    if (id && season && episode) {
      fetchEpisodeDetails();
    }
  }, [id, season, episode]);

  const fetchEpisodeDetails = async () => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${id}/season/${season}/episode/${episode}?language=en-US`,
        { headers }
      );
      const data = await response.json();
      setEpisodeData(data);
    } catch (error) {
      console.error('Error fetching episode details:', error);
      toast.error('Failed to load episode');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(`/episodes/${id}/${season}`);
  };

  const handlePreviousEpisode = () => {
    const currentEpisode = parseInt(episode || '1');
    if (currentEpisode > 1) {
      navigate(`/watch-episode/${id}/${season}/${currentEpisode - 1}`);
    }
  };

  const handleNextEpisode = () => {
    const currentEpisode = parseInt(episode || '1');
    navigate(`/watch-episode/${id}/${season}/${currentEpisode + 1}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading episode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close Button - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20 rounded-full w-10 h-10"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Episode Info - Top Center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-white text-center">
        <p className="text-sm font-semibold">
          Season {season} • Episode {episode}
        </p>
        {episodeData?.name && (
          <p className="text-xs text-white/70">{episodeData.name}</p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousEpisode}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextEpisode}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Native Video Player with Built-in Controls */}
      <iframe
        src={videoSources[0]}
        className="w-full h-full"
        allowFullScreen
        title={`Season ${season} Episode ${episode}`}
        allow="autoplay; encrypted-media; fullscreen"
        style={{ 
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default WatchEpisode;
