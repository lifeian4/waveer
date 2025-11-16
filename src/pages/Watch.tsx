import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast.error('Failed to load movie');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(`/movie-details/${id}`);
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

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close Button - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20 rounded-full w-10 h-10"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Native Video Player with Built-in Controls */}
      <iframe
        src={videoSources[0]}
        className="w-full h-full"
        allowFullScreen
        title={movie.title}
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

export default Watch;
