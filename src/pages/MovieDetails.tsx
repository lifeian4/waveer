import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Heart, Share, Star, Clock, ArrowLeft, X, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward, Pause } from "lucide-react";
import { toast } from "sonner";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
      fetchMovieCast();
      fetchSimilarMovies();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast.error('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovieCast = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${id}/credits?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      console.log('Cast data:', data);
      setCast(data.cast?.slice(0, 12) || []);
    } catch (error) {
      console.error('Error fetching cast:', error);
      // Set fallback cast data if API fails
      setCast([
        { name: "Leonardo DiCaprio", character: "Dom Cobb", profile_path: null },
        { name: "Marion Cotillard", character: "Mal", profile_path: null },
        { name: "Tom Hardy", character: "Eames", profile_path: null },
        { name: "Ellen Page", character: "Ariadne", profile_path: null }
      ]);
    }
  };

  const fetchSimilarMovies = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${id}/similar?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      console.log('Similar movies data:', data);
      setSimilarMovies(data.results?.slice(0, 12) || []);
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      // Set fallback similar movies if API fails
      setSimilarMovies([
        { id: 157336, title: "Interstellar", release_date: "2014-11-07", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
        { id: 155, title: "The Dark Knight", release_date: "2008-07-18", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
        { id: 77, title: "Memento", release_date: "2000-10-11", poster_path: "/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg" },
        { id: 330457, title: "Dunkirk", release_date: "2017-07-19", poster_path: "/f7DImXDebOs148U4uPjI61iDvaK.jpg" }
      ]);
    }
  };

  const handleWatchMovie = () => {
    // Option 1: Navigate to dedicated watch page
    navigate(`/watch/${id}`);
    
    // Option 2: Open modal (commented out)
    // setIsWatchModalOpen(true);
    // setIsPlaying(true);
  };

  const handleCloseModal = () => {
    setIsWatchModalOpen(false);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Loading movie details...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!movie) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="relative pt-48">
          <div 
            className="h-[50vh] md:h-[70vh] bg-cover bg-center relative"
            style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            
            <div className="relative h-full flex items-end">
              <div className="container mx-auto px-4 pb-8 md:pb-16">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 md:mb-6 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full max-w-sm mx-auto rounded-xl shadow-2xl"
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="lg:col-span-3 text-white mt-6 lg:mt-0"
                  >
                    <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4">{movie.title}</h1>
                    
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                        <span>{movie.vote_average?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 md:w-5 md:h-5" />
                        <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                      {movie.genres?.map((genre, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/20 text-white text-xs md:text-sm">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-sm md:text-lg mb-6 md:mb-8 max-w-3xl line-clamp-3 md:line-clamp-none">{movie.overview}</p>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      <Button size="lg" className="bg-primary" onClick={handleWatchMovie}>
                        <Play className="w-5 h-5 mr-2" />
                        Play Movie
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white">
                        <Heart className="w-5 h-5 mr-2" />
                        Like
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white">
                        <Share className="w-5 h-5 mr-2" />
                        Share
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Cast Section */}
          <section className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Cast & Crew</h2>
            {cast.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {cast.map((actor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3 group-hover:scale-105 transition-transform">
                    <img
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w300${actor.profile_path}` : '/api/placeholder/150/225'}
                      alt={actor.name}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-sm">{actor.name}</h4>
                  <p className="text-xs text-muted-foreground">{actor.character}</p>
                </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading cast information...</p>
              </div>
            )}
          </section>

          {/* Movie Details */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8">Movie Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-xl font-semibold mb-4">Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Release Date:</span>
                    <span>{new Date(movie.release_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Runtime:</span>
                    <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span>${movie.budget ? (movie.budget / 1000000).toFixed(0) + 'M' : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span>${movie.revenue ? (movie.revenue / 1000000).toFixed(0) + 'M' : 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-xl font-semibold mb-4">Production</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Companies:</span>
                    <span className="text-right text-sm">
                      {movie.production_companies?.slice(0, 2).map(c => c.name).join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Countries:</span>
                    <span className="text-right text-sm">
                      {movie.production_countries?.map(c => c.name).join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Languages:</span>
                    <span className="text-right text-sm">
                      {movie.spoken_languages?.map(l => l.english_name).join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{movie.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 border">
                <h3 className="text-xl font-semibold mb-4">Awards</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">4 Academy Awards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">3 BAFTA Awards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Critics Choice Award</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Similar Movies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8">More Like This</h2>
            {similarMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {similarMovies.map((similarMovie, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/movie-details/${similarMovie.id}`)}
                >
                  <div className="relative overflow-hidden rounded-lg mb-3 group-hover:scale-105 transition-transform">
                    <img
                      src={similarMovie.poster_path ? `https://image.tmdb.org/t/p/w300${similarMovie.poster_path}` : '/api/placeholder/300/450'}
                      alt={similarMovie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm">{similarMovie.title}</h4>
                  <p className="text-xs text-muted-foreground">{new Date(similarMovie.release_date).getFullYear()}</p>
                </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading similar movies...</p>
              </div>
            )}
          </section>

          {/* Reviews */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-8">Reviews</h2>
            <div className="space-y-6">
              {[
                {
                  author: "John Smith",
                  rating: 9,
                  review: "Inception is a masterpiece of modern cinema. Christopher Nolan's intricate plot and stunning visuals create an unforgettable experience.",
                  date: "2 weeks ago"
                },
                {
                  author: "Sarah Johnson", 
                  rating: 8,
                  review: "Mind-bending and visually spectacular. The performances are top-notch and the concept is brilliantly executed.",
                  date: "1 month ago"
                }
              ].map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-card rounded-lg p-6 border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold">
                          {review.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{review.author}</h4>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{review.rating}/10</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{review.review}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <Footer />

        {/* Netflix-Style Watch Modal */}
        <AnimatePresence>
          {isWatchModalOpen && (
            <Dialog open={isWatchModalOpen} onOpenChange={setIsWatchModalOpen}>
              <DialogContent className="max-w-7xl w-full h-[90vh] md:h-[90vh] p-0 bg-black border-none">
                <div className="relative w-full h-full">
                  {/* Video Player */}
                  <div className="relative w-full h-full bg-black">
                    <iframe
                      src={`https://vidsrc-embed.ru/embed/movie/${id}?autoplay=1`}
                      className="w-full h-full"
                      allowFullScreen
                      title={movie.title}
                      allow="autoplay; encrypted-media"
                    />
                    
                    {/* Minimal Overlay - Only Close Button */}
                    <div className="absolute inset-0 group pointer-events-none">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCloseModal}
                          className="text-white hover:bg-black/50 p-2 rounded-md backdrop-blur-sm border border-white/20"
                        >
                          <X className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default MovieDetails;
