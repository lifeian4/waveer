import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Clock,
  Music as MusicIcon,
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { musicAPI, type Track } from "@/lib/musicAPI";
import SquareMusicPlayer from "@/components/SquareMusicPlayer";

const Music = () => {
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [searchSuggestions, setSuggestions] = useState<string[]>([]);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load trending songs from Spotify API
    const loadTrendingSongs = async () => {
      try {
        setIsLoading(true);
        const tracks = await musicAPI.getTrendingTracks(20);
        setTrendingSongs(tracks);
      } catch (error) {
        console.error('Error loading trending songs:', error);
        // Fallback to empty array to ensure page still loads
        setTrendingSongs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrendingSongs();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setPlaylist(searchQuery ? searchResults : trendingSongs);
    }
  };

  const handleNext = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentTrack(playlist[nextIndex]);
  };

  const handlePrevious = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentTrack(playlist[prevIndex]);
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = (trackId: string) => {
    const newLikedSongs = new Set(likedSongs);
    if (likedSongs.has(trackId)) {
      newLikedSongs.delete(trackId);
    } else {
      newLikedSongs.add(trackId);
    }
    setLikedSongs(newLikedSongs);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const tracks = await musicAPI.searchTracks(query, 10);
        setSearchResults(tracks);
        
        // Get search suggestions
        const suggestions = await musicAPI.getSearchSuggestions(query);
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error searching tracks:', error);
        setSearchResults([]);
        setSuggestions([]);
      }
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]); // Clear suggestions immediately
    handleSearch(suggestion);
  };

  const TrackCard = ({ track, index }: { track: Track; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={track.artwork_url || "/placeholder-album.jpg"}
                alt={track.album}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handlePlayPause(track)}
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{track.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {track.popularity}% popular
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDuration(track.duration)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleLike(track.id)}
                className={likedSongs.has(track.id) ? "text-red-500" : "text-muted-foreground"}
              >
                <Heart className={`w-4 h-4 ${likedSongs.has(track.id) ? "fill-current" : ""}`} />
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative pt-20 pb-12 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"
              >
                <MusicIcon className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Discover Music
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore trending songs, discover new artists, and enjoy the best music experience
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for songs, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg max-w-2xl mx-auto"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-accent/50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Search className="w-6 h-6" />
                Search Results
              </h2>
              <div className="space-y-4">
                {searchResults.map((track, index) => (
                  <TrackCard key={track.id} track={track} index={index} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Trending Songs */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Trending Songs
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {trendingSongs.map((track, index) => (
                  <TrackCard key={track.id} track={track} index={index} />
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* Square Modal Music Player */}
        <SquareMusicPlayer
          currentTrack={currentTrack}
          playlist={playlist}
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onTrackEnd={handleTrackEnd}
        />
      </div>
    </PageWrapper>
  );
};

export default Music;
