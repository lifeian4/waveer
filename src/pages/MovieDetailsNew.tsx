import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, getBackdropUrl, getPosterUrl, type MediaDetails } from "@/lib/tmdb";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const MovieDetailsNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(false);

  // Fetch movie data using React Query for better caching
  const { data: movie, isLoading: loading, error: movieError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => {
      if (!id) throw new Error('No movie ID');
      return getMovieDetails(parseInt(id));
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch subscription data using React Query
  const { data: userSubscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return { status: 'inactive' };
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, subscription_expires_at')
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;

      return {
        status: profile?.subscription_status || 'inactive',
        plan: profile?.subscription_plan || null,
        expires_at: profile?.subscription_expires_at || null
      };
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set up real-time subscription updates
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel(`movie-profile-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`
        },
        () => {
          // Invalidate subscription query to refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const handlePlay = useCallback(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userSubscription?.status !== 'active') {
      navigate('/billing');
      return;
    }

    navigate(`/watch/${id}`);
  }, [currentUser, userSubscription?.status, id, navigate]);

  const handleWatchTrailer = useCallback(() => {
    toast.success("Playing trailer...");
  }, []);

  const handleAddToWatchlist = useCallback(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setIsLiked(prev => !prev);
    toast.success(isLiked ? "Removed from watchlist" : "Added to watchlist");
  }, [currentUser, isLiked, navigate]);

  // Memoize computed values
  const canPlay = useMemo(() => currentUser && userSubscription?.status === 'active', [currentUser, userSubscription?.status]);
  const needsSubscription = useMemo(() => currentUser && userSubscription?.status !== 'active', [currentUser, userSubscription?.status]);

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

  if (!movie) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Movie Not Found</h2>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <div className="relative h-screen overflow-hidden">
          {/* Background Image with lazy loading */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          {/* Content */}
          <div className="relative z-10 flex items-center min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Movie Poster */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="flex justify-center lg:justify-start"
                >
                  <div className="relative group">
                    <OptimizedImage
                      src={getPosterUrl(movie.poster_path)}
                      alt={movie.title}
                      className="w-80 rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                      priority={true}
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>

                {/* Movie Info */}
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
                      {movie.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <Badge className="bg-yellow-500 text-black font-bold">
                        <Star className="w-4 h-4 mr-1" />
                        {movie.vote_average.toFixed(1)}
                      </Badge>
                      <div className="flex items-center text-white/80">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(movie.release_date).getFullYear()}
                      </div>
                      <div className="flex items-center text-white/80">
                        <Clock className="w-4 h-4 mr-2" />
                        {movie.runtime} min
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {movie.genres.map((genre) => (
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
                    {movie.overview}
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
                        Play Movie
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
                <h2 className="text-2xl font-bold mb-4">About the Movie</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {movie.overview}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Release Date:</span>
                    <p className="text-muted-foreground">{new Date(movie.release_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Runtime:</span>
                    <p className="text-muted-foreground">{movie.runtime || 'N/A'} minutes</p>
                  </div>
                  <div>
                    <span className="font-semibold">Budget:</span>
                    <p className="text-muted-foreground">
                      {movie.budget && movie.budget > 0 ? `$${movie.budget.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Revenue:</span>
                    <p className="text-muted-foreground">
                      {movie.revenue && movie.revenue > 0 ? `$${movie.revenue.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Movie Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">Genres:</span>
                    <p className="text-muted-foreground">
                      {movie.genres && movie.genres.length > 0 ? movie.genres.map(g => g.name).join(', ') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Rating:</span>
                    <p className="text-muted-foreground">{movie.vote_average?.toFixed(1) || 'N/A'}/10</p>
                  </div>
                  <div>
                    <span className="font-semibold">Language:</span>
                    <p className="text-muted-foreground">{movie.original_language ? movie.original_language.toUpperCase() : 'N/A'}</p>
                  </div>
                  {movie.production_companies && movie.production_companies.length > 0 && (
                    <div>
                      <span className="font-semibold">Production:</span>
                      <p className="text-muted-foreground">
                        {movie.production_companies[0].name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    </PageWrapper>
  );
};

export default MovieDetailsNew;
