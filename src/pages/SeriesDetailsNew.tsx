import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Play, 
  Plus, 
  Share, 
  Download, 
  Star, 
  Clock, 
  Calendar,
  ArrowLeft,
  Heart,
  CreditCard,
  Eye,
  Tv
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { getTVShowDetails, getBackdropUrl, getPosterUrl, type MediaDetails } from "@/lib/tmdb";
import { toast } from "sonner";

const SeriesDetailsNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [series, setSeries] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchSeries = async () => {
      if (!id) return;
      
      try {
        const seriesData = await getTVShowDetails(parseInt(id));
        setSeries(seriesData);
      } catch (error) {
        console.error('Error fetching series:', error);
        toast.error("Failed to load series details");
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [id]);

  useEffect(() => {
    const checkSubscription = () => {
      if (currentUser) {
        const storedSubscription = localStorage.getItem('user_subscription');
        if (storedSubscription) {
          const subscriptionData = JSON.parse(storedSubscription);
          setUserSubscription(subscriptionData);
        } else {
          setUserSubscription({ status: 'inactive' });
        }
      }
    };

    checkSubscription();
  }, [currentUser]);

  const handlePlay = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userSubscription?.status !== 'active') {
      navigate('/billing');
      return;
    }

    // Navigate to episodes page
    navigate(`/episodes/${id}`);
  };

  const handleWatchTrailer = () => {
    toast.success("Playing trailer...");
  };

  const handleAddToWatchlist = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Removed from watchlist" : "Added to watchlist");
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!series) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Series Not Found</h2>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const canPlay = currentUser && userSubscription?.status === 'active';
  const needsSubscription = currentUser && userSubscription?.status !== 'active';

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <div className="relative h-screen overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${getBackdropUrl(series.backdrop_path)})`
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          {/* Content */}
          <div className="relative z-10 flex items-center min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Series Poster */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex justify-center lg:justify-start"
                >
                  <div className="relative group">
                    <img
                      src={getPosterUrl(series.poster_path)}
                      alt={series.name}
                      className="w-80 h-auto rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>

                {/* Series Info */}
                <div className="lg:col-span-2 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => navigate(-1)}
                      className="text-white hover:bg-white/20 mb-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                      {series.name}
                    </h1>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <Badge className="bg-yellow-500 text-black font-bold">
                        <Star className="w-4 h-4 mr-1" />
                        {series.vote_average?.toFixed(1) || 'N/A'}
                      </Badge>
                      <div className="flex items-center text-white/80">
                        <Calendar className="w-4 h-4 mr-2" />
                        {series.first_air_date ? new Date(series.first_air_date).getFullYear() : 'N/A'}
                      </div>
                      <div className="flex items-center text-white/80">
                        <Tv className="w-4 h-4 mr-2" />
                        {series.number_of_seasons || 0} Season{(series.number_of_seasons || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center text-white/80">
                        <Clock className="w-4 h-4 mr-2" />
                        {series.episode_run_time?.[0] || 45} min/ep
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {series.genres && series.genres.length > 0 && series.genres.map((genre) => (
                        <Badge key={genre.id} variant="outline" className="text-white border-white/30">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-lg text-white/90 leading-relaxed max-w-2xl"
                  >
                    {series.overview}
                  </motion.p>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-wrap gap-4"
                  >
                    {canPlay ? (
                      <Button
                        size="lg"
                        onClick={handlePlay}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-bold"
                      >
                        <Play className="w-6 h-6 mr-2 fill-current" />
                        Watch Series
                      </Button>
                    ) : needsSubscription ? (
                      <Button
                        size="lg"
                        onClick={() => navigate('/billing')}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-bold"
                      >
                        <CreditCard className="w-6 h-6 mr-2" />
                        Subscribe to Watch
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => navigate('/login')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-bold"
                      >
                        <Play className="w-6 h-6 mr-2 fill-current" />
                        Sign In to Watch
                      </Button>
                    )}

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleWatchTrailer}
                      className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-3 text-lg font-bold"
                    >
                      <Eye className="w-6 h-6 mr-2" />
                      Watch Trailer
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleAddToWatchlist}
                      className={`backdrop-blur-sm border-white/30 px-6 py-3 ${
                        isLiked 
                          ? 'bg-red-600 text-white border-red-600' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-6 py-3"
                    >
                      <Share className="w-6 h-6" />
                    </Button>

                    {canPlay && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-6 py-3"
                      >
                        <Download className="w-6 h-6" />
                      </Button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seasons Section */}
        {series.seasons && series.seasons.length > 0 && (
          <div className="bg-background/50 py-16 border-t border-border">
            <div className="max-w-7xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-2xl font-bold mb-8">Seasons</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {series.seasons.map((season: any, index: number) => (
                    <motion.div
                      key={season?.season_number || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/episodes/${id}/${season?.season_number || 0}`)}
                      className="group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-lg mb-3">
                        <img
                          src={season?.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : getPosterUrl(series.poster_path)}
                          alt={season?.name || 'Season'}
                          className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white fill-white" />
                        </div>
                        <div className="absolute top-2 right-2 bg-primary/90 px-2 py-1 rounded text-xs font-semibold">
                          S{season?.season_number || 0}
                        </div>
                      </div>
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {season?.name || 'Season'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {season?.episode_count || 0} Episode{(season?.episode_count || 0) !== 1 ? 's' : ''}
                      </p>
                      {season?.air_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(season.air_date).getFullYear()}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-background py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">About the Series</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {series.overview || 'No description available'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">First Air Date:</span>
                    <p className="text-muted-foreground">{series.first_air_date ? new Date(series.first_air_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Last Air Date:</span>
                    <p className="text-muted-foreground">
                      {series.last_air_date ? new Date(series.last_air_date).toLocaleDateString() : 'Ongoing'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <p className="text-muted-foreground">{series.status || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Episodes:</span>
                    <p className="text-muted-foreground">{series.number_of_episodes || 0} total</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Series Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">Genres:</span>
                    <p className="text-muted-foreground">
                      {series.genres && series.genres.length > 0 ? series.genres.map(g => g.name).join(', ') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Rating:</span>
                    <p className="text-muted-foreground">{series.vote_average?.toFixed(1) || 'N/A'}/10</p>
                  </div>
                  <div>
                    <span className="font-semibold">Language:</span>
                    <p className="text-muted-foreground">{series.original_language ? series.original_language.toUpperCase() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Seasons:</span>
                    <p className="text-muted-foreground">{series.number_of_seasons || 0}</p>
                  </div>
                  {series.networks && series.networks.length > 0 && (
                    <div>
                      <span className="font-semibold">Network:</span>
                      <p className="text-muted-foreground">
                        {series.networks[0].name}
                      </p>
                    </div>
                  )}
                  {series.production_companies && series.production_companies.length > 0 && (
                    <div>
                      <span className="font-semibold">Production:</span>
                      <p className="text-muted-foreground">
                        {series.production_companies[0].name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SeriesDetailsNew;
