import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Volume2, VolumeX, Plus, Bookmark, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getTrendingMovies, getBackdropUrl, type Movie } from "@/lib/tmdb";

const StreamingHero = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const trendingMovies = await getTrendingMovies('week');
        setMovies(trendingMovies.slice(0, 5)); // Get top 5 trending
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching movies:', error);
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_status, subscription_plan, subscription_expires_at')
            .eq('id', currentUser.id)
            .single();

          if (error) throw error;

          setUserSubscription({
            status: profile?.subscription_status || 'inactive',
            plan: profile?.subscription_plan || null,
            expires_at: profile?.subscription_expires_at || null
          });
        } catch (error) {
          console.error('Error fetching subscription:', error);
          setUserSubscription({ status: 'inactive' });
        }
      }
    };

    checkSubscription();

    // Real-time subscription updates
    if (currentUser) {
      const subscription = supabase
        .channel('hero-profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${currentUser.id}`
          },
          () => {
            checkSubscription();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  // Auto-slide every 20 seconds
  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [movies.length]);


  if (isLoading || movies.length === 0) {
    return (
      <div className="relative h-screen w-full bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative h-screen w-full overflow-hidden mb-20">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getBackdropUrl(currentMovie.backdrop_path)})`,
            }}
          />

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6 md:px-12 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-2xl space-y-6"
            >
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-5xl md:text-7xl font-black text-foreground leading-tight"
              >
                {currentMovie.title}
              </motion.h1>

              {/* Meta Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex items-center gap-4 text-sm md:text-base"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(currentMovie.vote_average / 2)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-600 fill-gray-600"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-foreground/80 font-semibold">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
                <span className="text-foreground/60">•</span>
                <span className="text-foreground/80 font-medium">
                  {new Date(currentMovie.release_date).getFullYear()}
                </span>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold">
                  TRENDING
                </span>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="text-base md:text-lg text-foreground/80 leading-relaxed line-clamp-3"
              >
                {currentMovie.overview}
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="flex items-center gap-4 flex-wrap"
              >
                {currentUser ? (
                  userSubscription?.status === 'active' ? (
                    <>
                      <Button
                        size="lg"
                        onClick={() => navigate(`/movie-details/${currentMovie.id}`)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-bold shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
                      >
                        <Play className="w-6 h-6 mr-2 fill-current" />
                        Play Now
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-background/50 backdrop-blur-sm border-2 border-foreground/20 hover:border-foreground/40 rounded-full px-8 py-6 text-lg font-bold"
                      >
                        <Info className="w-6 h-6 mr-2" />
                        Watch Trailer
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-background/50 backdrop-blur-sm border-2 border-foreground/20 hover:border-foreground/40 rounded-full px-6 py-6"
                      >
                        <Plus className="w-6 h-6 mr-2" />
                        Add to Watchlist
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => navigate('/billing')}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 py-6 text-lg font-bold shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 transition-all duration-300"
                      >
                        <CreditCard className="w-6 h-6 mr-2" />
                        Subscribe to Watch
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-background/50 backdrop-blur-sm border-2 border-foreground/20 hover:border-foreground/40 rounded-full px-8 py-6 text-lg font-bold"
                      >
                        <Info className="w-6 h-6 mr-2" />
                        Watch Trailer
                      </Button>
                    </>
                  )
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate('/signup')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-bold shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
                    >
                      <Play className="w-6 h-6 mr-2 fill-current" />
                      Sign Up for Free Trial
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-background/50 backdrop-blur-sm border-2 border-foreground/20 hover:border-foreground/40 rounded-full px-8 py-6 text-lg font-bold"
                    >
                      <Info className="w-6 h-6 mr-2" />
                      Watch Trailer
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.3 }}
                className="text-sm text-foreground/60 italic"
              >
                "Watch, Chat, Create" - Experience entertainment like never before
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>


      {/* Mute Button */}
      <div className="absolute bottom-32 md:bottom-24 right-4 md:right-8 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 md:p-4 bg-background/30 backdrop-blur-md hover:bg-background/50 rounded-full border border-foreground/20 transition-all duration-300"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
          ) : (
            <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
          )}
        </motion.button>
      </div>

      {/* Slide Indicators with Progress */}
      <div className="absolute bottom-24 left-6 md:left-12 z-20 flex items-center gap-3">
        {movies.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative group"
          >
            <div className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-16 bg-primary"
                : "w-12 bg-foreground/30 group-hover:bg-foreground/50"
            }`}>
              {index === currentIndex && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 20, ease: "linear" }}
                  className="h-full bg-primary rounded-full shadow-lg shadow-primary/50"
                />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default StreamingHero;
