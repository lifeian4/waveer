import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  Search, 
  User as UserIcon,
  Bell,
  Moon,
  Sun,
  Music
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("home");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showThemeToggle, setShowThemeToggle] = useState(false);

  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActiveTab("home");
    else if (path.includes("/profile")) setActiveTab("profile");
    else if (path.includes("/courses")) setActiveTab("courses");
    else if (path.includes("/music")) setActiveTab("music");
  }, [location.pathname]);

  // Navigation items
  const navItems = [
    { 
      id: "home", 
      label: "Home", 
      icon: Home, 
      action: () => navigate("/") 
    },
    { 
      id: "music", 
      label: "Music", 
      icon: Music, 
      action: () => navigate("/music") 
    },
    { 
      id: "search", 
      label: "Search", 
      icon: Search, 
      action: () => setIsSearchOpen(true) 
    },
    { 
      id: "profile", 
      label: "Profile", 
      icon: UserIcon, 
      action: () => {
        if (location.pathname.includes("/profile")) {
          setShowThemeToggle(!showThemeToggle);
        } else {
          navigate("/profile");
        }
      }
    }
  ];

  return (
    <>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4"
      >
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg flex items-center justify-between w-full max-w-md mx-auto overflow-hidden">
          {navItems.map((item) => (
            <div key={item.id} className="relative flex-1">
              <button
                onClick={item.action}
                className="relative w-full py-3 flex flex-col items-center justify-center"
              >
                {/* Active indicator */}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Top indicator dot */}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeNavDot"
                    className="absolute top-0 w-10 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative z-10"
                >
                  <item.icon className={`w-5 h-5 mb-1 ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </motion.div>
              </button>
              
              {item.id === "profile" && showThemeToggle && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -60 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-popover shadow-lg border border-border"
                >
                  <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Pass isSearchOpen state to your search component */}
      {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};

export default BottomNavbar;