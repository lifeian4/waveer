import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Clock, BookOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserSearch from "./UserSearch";
import { useIsMobile } from "@/hooks/use-mobile";

interface AnimatedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnimatedSearch = ({ isOpen, onClose }: AnimatedSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("courses"); // "courses" or "users"
  const isMobile = useIsMobile();

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

          {/* Search Container */}
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
            className={
              isMobile 
                ? "fixed top-0 left-0 right-0 bottom-0 z-[70] bg-background"
                : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl z-[70] px-4 mx-auto"
            }
          >
            <div className={isMobile ? "h-full flex flex-col" : "bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"}>
              {/* Search Input */}
              <div className={isMobile ? "p-4 border-b border-border sticky top-0 bg-background z-10" : "flex items-center gap-3 p-6 border-b border-border"}>
                <Search className="w-6 h-6 text-primary animate-pulse" />
                <Input
                  type="text"
                  placeholder="Search courses, tutorials, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isMobile 
                    ? "flex-1 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground" 
                    : "flex-1 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  }
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

              {/* Search Tabs - Only on desktop */}
              {!isMobile && (
                <div className="flex border-b border-border">
                  <button
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium ${
                      activeTab === "courses" 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setActiveTab("courses")}
                  >
                    <BookOpen className="w-4 h-4" />
                    Courses
                  </button>
                  <button
                    className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium ${
                      activeTab === "users" 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setActiveTab("users")}
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </button>
                </div>
              )}

              {/* Search Results / Suggestions */}
              <div className={isMobile ? "flex-1 overflow-y-auto p-4" : "p-6 max-h-[60vh] overflow-y-auto"}>
                {isMobile ? (
                  // Mobile view - always show user search
                  <UserSearch />
                ) : activeTab === "courses" ? (
                  searchQuery === "" ? (
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
                        Searching for "{searchQuery}"...
                      </p>
                      <div className="space-y-2">
                        {[1, 2, 3].map((item) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: item * 0.05 }}
                            whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                            className="p-4 rounded-lg hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-primary/20"
                          >
                            <h4 className="font-semibold text-foreground mb-1">
                              Course Result {item}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Learn advanced concepts and build real-world projects
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )
                ) : (
                  <UserSearch />
                )}
              </div>

              {/* Footer Hint - Only on desktop */}
              {!isMobile && (
                <div className="px-6 py-3 bg-muted/30 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Press <kbd className="px-2 py-1 bg-background rounded border border-border">ESC</kbd> to close
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnimatedSearch;