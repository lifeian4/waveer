import { motion } from 'framer-motion';
import { X, Play, Plus, Star, Clock, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MovieDetailsModal = ({ movie, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-card text-card-foreground rounded-2xl w-full max-w-5xl h-auto max-h-[95vh] overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 md:h-96 w-full">
          <img src={getBackdropUrl(movie.backdrop_path, 'original')} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 bg-black/50 text-white rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-6 md:p-8 -mt-24 md:-mt-32 relative z-10 flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-64 flex-shrink-0">
            <img src={getPosterUrl(movie.poster_path, 'w500')} className="rounded-2xl shadow-xl w-full" />
          </div>
          <div className="flex-grow">
            <h2 className="text-3xl md:text-5xl font-bold mb-2">{movie.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>{movie.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{movie.release_date.substring(0, 4)}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-base mb-6 max-h-32 overflow-y-auto">{movie.overview}</p>
            
            <div className="flex flex-wrap gap-3">
              {currentUser ? (
                <Button size="lg" onClick={() => navigate(`/movie/${movie.id}`)} className="bg-primary text-primary-foreground">
                  <Play className="w-5 h-5 mr-2" /> Play Now
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate('/billing')} className="bg-orange-500 text-white">
                  <CreditCard className="w-5 h-5 mr-2" /> Subscribe to Watch
                </Button>
              )}
              <Button size="lg" variant="outline">
                <Plus className="w-5 h-5 mr-2" /> Add to List
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MovieDetailsModal;
