import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Play } from "lucide-react";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Season {
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
}

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string | null;
  vote_average: number;
}

const Episodes = () => {
  const { id, season } = useParams();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(parseInt(season || "1"));
  const [tvShow, setTvShow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

  useEffect(() => {
    if (id) {
      fetchTVShowDetails();
    }
  }, [id]);

  useEffect(() => {
    if (id && selectedSeason) {
      fetchEpisodes();
    }
  }, [id, selectedSeason]);

  const fetchTVShowDetails = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      setTvShow(data);
      setSeasons(data.seasons || []);
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      toast.error('Failed to load TV show');
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${id}/season/${selectedSeason}?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      toast.error('Failed to load episodes');
    }
  };

  const handleWatchEpisode = (episodeNumber: number) => {
    navigate(`/watch-episode/${id}/${selectedSeason}/${episodeNumber}`);
  };

  const handleClose = () => {
    navigate(`/serie-details/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading episodes...</p>
        </div>
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">TV Show not found</h1>
          <Button onClick={() => navigate('/')} variant="outline">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tvShow.name}</h1>
            <p className="text-muted-foreground">Episodes</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Season Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Season</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {seasons.map((s) => (
              <motion.button
                key={s.season_number}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSeason(s.season_number)}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  selectedSeason === s.season_number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                Season {s.season_number}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Episodes Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Season {selectedSeason} - {episodes.length} Episodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.map((episode, index) => (
              <motion.div
                key={episode.episode_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  {/* Episode Thumbnail */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {episode.still_path ? (
                      <img
                        src={`${IMAGE_BASE_URL}${episode.still_path}`}
                        alt={episode.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Play className="w-12 h-12 text-primary/50" />
                      </div>
                    )}
                    {/* Play Button Overlay */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWatchEpisode(episode.episode_number)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-primary rounded-full p-4">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </motion.button>
                    {/* Episode Number Badge */}
                    <div className="absolute top-2 right-2 bg-primary/90 px-3 py-1 rounded-full text-sm font-semibold">
                      Ep {episode.episode_number}
                    </div>
                  </div>

                  {/* Episode Info */}
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-1 mb-2">
                      {episode.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {episode.overview || "No description available"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(episode.air_date).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-semibold text-yellow-500">
                        ★ {episode.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Episodes;
