import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { getDiscoverMovies, getGenres, type Movie, type Genre } from "@/lib/tmdb";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Placeholder for the new components I will create
const MovieCard = ({ movie, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
    className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group"
    onClick={() => onClick(movie)}
  >
    <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:from-black/90 transition-all" />
    <div className="absolute bottom-0 left-0 p-4">
      <h3 className="text-white font-bold text-lg">{movie.title}</h3>
    </div>
  </motion.div>
);

const MovieDetailsModal = ({ movie, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
    <div className="bg-card text-card-foreground rounded-2xl w-full max-w-4xl h-auto max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-3xl font-bold mb-4">{movie.title}</h2>
      <p>{movie.overview}</p>
      <Button onClick={onClose} className="mt-6">Close</Button>
    </div>
  </div>
);

const Movies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("popularity.desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [moviesData, genresData] = await Promise.all([
          getDiscoverMovies({ sortBy: sortOption, page }),
          getGenres('movie'),
        ]);
        setMovies(moviesData.results);
        setGenres([{ id: 'all', name: 'All Genres' }, ...genresData]);
      } catch (error) {
        toast.error("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const moviesData = await getDiscoverMovies({
          sortBy: sortOption,
          page,
          withGenres: selectedGenre === 'all' ? undefined : selectedGenre,
        });
        setMovies(page === 1 ? moviesData.results : (prev) => [...prev, ...moviesData.results]);
      } catch (error) {
        toast.error("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [selectedGenre, sortOption, page]);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">Explore Movies</h1>
            <div className="flex items-center gap-2">
              {/* Filters will go here */}
            </div>
          </header>

          {loading && movies.length === 0 ? (
            <div className="text-center py-20">Loading...</div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} onClick={setSelectedMovie} />
              ))}
            </motion.div>
          )}

          {selectedMovie && (
            <MovieDetailsModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
          )}
        </main>
      </div>
    </PageWrapper>
  );
};

export default Movies;
