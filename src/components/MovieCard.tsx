import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Plus, Star, CreditCard, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getPosterUrl } from '@/lib/tmdb';

const MovieCard = ({ movie, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', currentUser.id)
          .single();
        setUserSubscription(profile);
      }
    };
    checkSubscription();
  }, [currentUser]);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (userSubscription?.subscription_status === 'active') {
      navigate(`/movie/${movie.id}`);
    } else {
      navigate('/billing');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(movie)}
      className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group cursor-pointer bg-card"
    >
      <img src={getPosterUrl(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <h3 className="text-white font-bold text-xl truncate">{movie.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-white font-semibold">{movie.vote_average.toFixed(1)}</span>
        </div>
      </div>

      {isHovered && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 p-4 bg-black/70 backdrop-blur-md flex flex-col justify-between"
        >
          <div>
            <h3 className="text-white font-bold text-2xl mb-2">{movie.title}</h3>
            <p className="text-white/80 text-sm line-clamp-4">{movie.overview}</p>
          </div>
          <div className="space-y-3">
            {currentUser && userSubscription?.subscription_status === 'active' ? (
              <Button onClick={handlePlay} className="w-full bg-primary text-primary-foreground font-bold">
                <Play className="w-5 h-5 mr-2" /> Play
              </Button>
            ) : (
              <Button onClick={() => navigate('/billing')} className="w-full bg-orange-500 text-white font-bold">
                <CreditCard className="w-5 h-5 mr-2" /> Subscribe
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="w-full bg-white/20 text-white border-none">
                <Plus className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="w-full bg-white/20 text-white border-none">
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MovieCard;
