import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Clock, User, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface CenteredSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  phone_number: string | null;
}

const CenteredSearchBar = ({ isOpen, onClose }: CenteredSearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Search for users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setUserResults([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Search by username, email, or phone number
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, phone_number")
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
          .limit(5);
        
        if (error) throw error;
        
        setUserResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setUserResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const delayDebounce = setTimeout(() => {
      searchUsers();
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const trendingSearches = [
    "React Fundamentals",
    "TypeScript Basics",
    "Advanced CSS",
    "Node.js Backend",
  ];

  const recentSearches = [
    "JavaScript ES6",
    "Tailwind CSS",
    "Framer Motion",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            onClick={onClose}
          />

          {/* Search Container - Centered at the top of the page */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-[70] px-4 mx-auto"
          >
            <div className="bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-6 border-b border-border">
                <Search className="w-6 h-6 text-primary animate-pulse" />
                <Input
                  type="text"
                  placeholder="Search courses, tutorials, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search Results / Suggestions */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {searchQuery === "" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Trending Searches */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Trending Searches
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((search, index) => (
                          <motion.button
                            key={search}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSearchQuery(search)}
                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-all border border-primary/20 hover:border-primary/40"
                          >
                            {search}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Recent Searches
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((search, index) => (
                          <motion.button
                            key={search}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                            onClick={() => setSearchQuery(search)}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-all flex items-center gap-3 group"
                          >
                            <Clock className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                              {search}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {/* Search Results */}
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? `Searching for "${searchQuery}"...` : 
                       userResults.length > 0 ? `Found ${userResults.length} users matching "${searchQuery}"` : 
                       `No users found matching "${searchQuery}"`}
                    </p>
                    
                    {/* User Results */}
                    {userResults.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          Users
                        </h3>
                        <div className="space-y-2">
                          {userResults.map((user) => (
                            <motion.button
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                              onClick={() => {
                                navigate(`/profile/${user.id}`);
                                onClose();
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted/50 transition-all flex items-center gap-3"
                            >
                              <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback>
                                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {user.full_name || 'User'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {user.email && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Mail className="w-3 h-3" />
                                      {user.email}
                                    </span>
                                  )}
                                  {user.phone_number && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Phone className="w-3 h-3" />
                                      {user.phone_number}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {/* Placeholder for search results */}
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="flex gap-3">
                            <div className="w-10 h-10 bg-muted rounded-md"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CenteredSearchBar;