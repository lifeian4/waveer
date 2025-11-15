import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Film, 
  Tv, 
  Music, 
  Play, 
  Heart,
  Clock,
  TrendingUp
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { musicAPI, type Track } from "@/lib/musicAPI";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'music';
  image?: string;
  description?: string;
  year?: string;
  artist?: string;
  duration?: string;
  popularity?: number;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: "1",
      title: "Flowers",
      type: "music",
      artist: "Miley Cyrus",
      duration: "3:20",
      popularity: 95,
      image: "https://i.scdn.co/image/ab67616d0000b273f4e552d3b0e7e5e8b5e5e5e5"
    },
    {
      id: "2",
      title: "The Batman",
      type: "movie",
      year: "2022",
      description: "When a sadistic serial killer begins murdering key political figures in Gotham...",
      image: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg"
    },
    {
      id: "3",
      title: "Stranger Things",
      type: "tv",
      year: "2016",
      description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments...",
      image: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg"
    },
    {
      id: "4",
      title: "Anti-Hero",
      type: "music",
      artist: "Taylor Swift",
      duration: "3:20",
      popularity: 94,
      image: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5"
    }
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsLoading(true);
      try {
        // Search music via Music API
        const musicTracks = await musicAPI.searchTracks(query, 5);
        const musicResults: SearchResult[] = musicTracks.map(track => ({
          id: track.id,
          title: track.name,
          type: 'music' as const,
          artist: track.artist,
          duration: `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`,
          popularity: track.popularity,
          image: track.artwork_url
        }));

        // Combine with mock movie/TV results for demo
        const mockMovieTvResults = mockResults.filter(item => 
          item.type !== 'music' && (
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
          )
        );

        setSearchResults([...musicResults, ...mockMovieTvResults]);
      } catch (error) {
        console.error('Error searching:', error);
        // Fallback to mock results
        const filtered = mockResults.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.artist?.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const filteredResults = searchResults.filter(result => {
    if (activeTab === "all") return true;
    return result.type === activeTab;
  });

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer"
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={result.image || "/placeholder.jpg"}
                alt={result.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              {result.type === 'music' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute inset-0 w-full h-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 text-white" />
                </Button>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getResultIcon(result.type)}
                <h3 className="font-semibold text-foreground truncate">{result.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {result.type}
                </Badge>
              </div>
              
              {result.type === 'music' ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{result.artist}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{result.duration}</span>
                    {result.popularity && (
                      <>
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{result.popularity}% popular</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{result.year}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
                </div>
              )}
            </div>
            
            {result.type === 'music' && (
              <Button size="sm" variant="ghost" className="text-muted-foreground">
                <Heart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0 bg-background/95 backdrop-blur-xl border-border/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search movies, TV shows, music..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                autoFocus
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {searchQuery ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="music">Music</TabsTrigger>
                  <TabsTrigger value="movie">Movies</TabsTrigger>
                  <TabsTrigger value="tv">TV Shows</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-6">
                  <TabsContent value={activeTab} className="mt-0">
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
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
                    ) : filteredResults.length > 0 ? (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {filteredResults.map((result) => (
                            <ResultCard key={result.id} result={result} />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : searchQuery && !isLoading ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No results found</p>
                        <p className="text-sm text-muted-foreground">Try searching with different keywords</p>
                      </div>
                    ) : null}
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6"
                >
                  <Search className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Universal Search</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Search across movies, TV shows, and music. Discover your next favorite content.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;