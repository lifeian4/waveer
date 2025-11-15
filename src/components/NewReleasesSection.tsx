import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Play, Calendar } from "lucide-react";
import { getNowPlayingMovies, getOnTheAirTVShows, getPosterUrl, type Movie, type TVShow } from "@/lib/tmdb";

interface NewReleasesSectionProps {
  type: 'movie' | 'tv';
  title: string;
}

const NewReleasesSection = ({ type, title }: NewReleasesSectionProps) => {
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = type === 'movie' 
          ? await getNowPlayingMovies()
          : await getOnTheAirTVShows();
        setItems(data);
        setIsLoading(false);
      } catch (error) {
        console.error(`Error fetching new ${type}:`, error);
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [type]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="h-8 w-48 bg-foreground/10 rounded-lg animate-pulse mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-72 bg-foreground/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 group">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3"
        >
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll('left')}
            className="p-2 bg-background/80 backdrop-blur-sm hover:bg-background rounded-full border border-foreground/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll('right')}
            className="p-2 bg-background/80 backdrop-blur-sm hover:bg-background rounded-full border border-foreground/20"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Items Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-6 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => {
          const title = 'title' in item ? item.title : item.name;
          const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="flex-shrink-0 w-48 md:w-56 cursor-pointer group/item relative"
            >
              {/* Poster */}
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={getPosterUrl(item.poster_path)}
                  alt={title}
                  className="w-full h-72 md:h-80 object-cover"
                />

                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col justify-end p-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground line-clamp-2">{title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-foreground/80">{item.vote_average.toFixed(1)}</span>
                      </div>
                      <span className="text-foreground/60">•</span>
                      <span className="text-foreground/60">
                        {new Date(releaseDate).getFullYear()}
                      </span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50"
                  >
                    <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
                  </motion.button>
                </motion.div>

                {/* NEW Badge */}
                <div className="absolute top-2 right-2 px-3 py-1 bg-primary rounded-full font-bold text-primary-foreground text-xs shadow-lg">
                  NEW
                </div>
              </div>

              {/* Title (always visible) */}
              <div className="mt-3 px-1">
                <h3 className="font-semibold text-foreground line-clamp-1 text-sm">{title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-foreground/60">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>{item.vote_average.toFixed(1)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NewReleasesSection;
