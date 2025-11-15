import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Film, Tv, User, TrendingUp, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchMovies, searchTVShows, getPosterUrl, type Movie, type TVShow } from "@/lib/tmdb";
import { searchUsers, getPopularUsers, type UserProfile } from "@/lib/userSearch";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UnifiedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnifiedSearch = ({ isOpen, onClose }: UnifiedSearchProps) => {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [popularUsers, setPopularUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchContent = async () => {
      if (query.trim().length < 2) {
        setMovies([]);
        setTVShows([]);
        setUsers([]);
        return;
      }

      setIsSearching(true);
      try {
        const [movieResults, tvResults, userResults] = await Promise.all([
          searchMovies(query),
          searchTVShows(query),
          searchUsers(query)
        ]);
        setMovies(movieResults.slice(0, 4));
        setTVShows(tvResults.slice(0, 4));
        setUsers(userResults.slice(0, 6));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Load popular users when component opens
  useEffect(() => {
    if (isOpen && popularUsers.length === 0) {
      getPopularUsers().then(setPopularUsers).catch(console.error);
    }
  }, [isOpen, popularUsers.length]);

  const handleMovieClick = (id: number) => {
    navigate(`/movie-details/${id}`);
    onClose();
  };

  const handleTVShowClick = (id: number) => {
    navigate(`/serie-details/${id}`);
    onClose();
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl overflow-y-auto"
        onClick={onClose}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-5xl min-h-full">
          {/* Search Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies, TV shows, users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full h-12 sm:h-14 md:h-16 pl-12 sm:pl-16 pr-12 sm:pr-16 text-base sm:text-lg bg-background/50 border-2 border-border focus:border-primary rounded-xl sm:rounded-2xl shadow-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </div>
          </motion.div>

          {/* Search Results */}
          <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
            {isSearching && (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
              </div>
            )}

            {!isSearching && query.trim().length >= 2 && (
              <>
                {/* Users Section */}
                {users.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-lg sm:text-xl font-bold">Users</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {users.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          onClick={() => handleUserClick(user.id)}
                          className="flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-muted cursor-pointer transition-all group border border-transparent hover:border-primary/20"
                        >
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary/20">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {user.full_name || "Anonymous User"}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.bio || user.email}
                            </p>
                            {user.country_name && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {user.country_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Movies Section */}
                {movies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Film className="w-5 h-5 text-primary" />
                      <h3 className="text-lg sm:text-xl font-bold">Movies</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {movies.map((movie, index) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          onClick={() => handleMovieClick(movie.id)}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-muted cursor-pointer transition-all group border border-transparent hover:border-primary/20"
                        >
                          <img
                            src={getPosterUrl(movie.poster_path)}
                            alt={movie.title}
                            className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {movie.title}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {movie.overview}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(movie.release_date).getFullYear()}
                              </span>
                              <span className="text-xs text-yellow-500 font-medium">
                                ★ {movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* TV Shows Section */}
                {tvShows.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Tv className="w-5 h-5 text-primary" />
                      <h3 className="text-lg sm:text-xl font-bold">TV Shows</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {tvShows.map((show, index) => (
                        <motion.div
                          key={show.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          onClick={() => handleTVShowClick(show.id)}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-muted cursor-pointer transition-all group border border-transparent hover:border-primary/20"
                        >
                          <img
                            src={getPosterUrl(show.poster_path)}
                            alt={show.name}
                            className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {show.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {show.overview}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(show.first_air_date).getFullYear()}
                              </span>
                              <span className="text-xs text-yellow-500 font-medium">
                                ★ {show.vote_average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* No Results */}
                {movies.length === 0 && tvShows.length === 0 && users.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Search className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base sm:text-lg text-muted-foreground">
                      No results found for "{query}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try searching for movies, TV shows, or users
                    </p>
                  </motion.div>
                )}
              </>
            )}

            {/* Trending Searches and Popular Users (when no query) */}
            {query.trim().length === 0 && (
              <div className="space-y-8">
                {/* Popular Users */}
                {popularUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-lg sm:text-xl font-bold">Popular Users</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {popularUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * index }}
                          onClick={() => handleUserClick(user.id)}
                          className="flex items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-muted cursor-pointer transition-all group border border-transparent hover:border-primary/20"
                        >
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary/20">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {user.full_name || "Anonymous User"}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.bio || user.email}
                            </p>
                            {user.country_name && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {user.country_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Trending Searches */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg sm:text-xl font-bold">Trending Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Action Movies', 'Comedy Series', 'Sci-Fi', 'Thriller', 'Romance', 'Marvel', 'Netflix', 'HBO'].map((tag) => (
                      <motion.button
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuery(tag)}
                        className="px-3 sm:px-4 py-2 bg-muted hover:bg-primary/20 rounded-full text-sm font-medium transition-colors border border-transparent hover:border-primary/30"
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedSearch;
