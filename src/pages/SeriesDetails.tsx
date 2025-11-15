import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Share, Star, Calendar, ArrowLeft, Tv } from "lucide-react";

const SeriesDetails = () => {
  const navigate = useNavigate();
  
  const series = {
    name: "Breaking Bad",
    overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    backdrop_path: "/eSzpy96DwBujGFj0xMbXBcGcfxX.jpg",
    poster_path: "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
    first_air_date: "2008-01-20",
    number_of_seasons: 5,
    vote_average: 9.5,
    genres: [{ name: "Drama" }, { name: "Crime" }]
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="relative">
          <div 
            className="h-[70vh] bg-cover bg-center relative"
            style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${series.backdrop_path})` }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            
            <div className="relative h-full flex items-end">
              <div className="container mx-auto px-4 pb-16">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                      alt={series.name}
                      className="w-full max-w-sm mx-auto rounded-xl shadow-2xl"
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="lg:col-span-3 text-white"
                  >
                    <h1 className="text-4xl lg:text-6xl font-bold mb-4">{series.name}</h1>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span>{series.vote_average}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>{new Date(series.first_air_date).getFullYear()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tv className="w-5 h-5" />
                        <span>{series.number_of_seasons} Seasons</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                      {series.genres.map((genre, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/20 text-white">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-lg mb-8 max-w-3xl">{series.overview}</p>

                    <div className="flex gap-4">
                      <Button size="lg" className="bg-primary">
                        <Play className="w-5 h-5 mr-2" />
                        Watch Series
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white">
                        <Heart className="w-5 h-5 mr-2" />
                        Favorite
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
      </div>
    </PageWrapper>
  );
};

export default SeriesDetails;
