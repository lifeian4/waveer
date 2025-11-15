import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Film, 
  Tv,
  Music,
  Search, 
  User as UserIcon,
  Plus,
  Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdjustedBottomNavbarProps {
  onSearchClick: () => void;
}

const AdjustedBottomNavbar = ({ onSearchClick }: AdjustedBottomNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const isMobile = useIsMobile();

  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActiveTab("home");
    else if (path.includes("/movies")) setActiveTab("movies");
    else if (path.includes("/tv-shows")) setActiveTab("tv");
    else if (path.includes("/music")) setActiveTab("music");
    else if (path.includes("/create")) setActiveTab("create");
    else if (path.includes("/notifications")) setActiveTab("notifications");
    else if (path.includes("/profile")) setActiveTab("profile");
    else if (path.includes("/login")) setActiveTab("login");
  }, [location.pathname]);

  // Navigation items based on authentication status
  const navItems = currentUser 
    ? [
        { 
          id: "home", 
          label: "Home", 
          icon: Home, 
          action: () => navigate("/") 
        },
        { 
          id: "search", 
          label: "Search", 
          icon: Search, 
          action: onSearchClick
        },
        { 
          id: "notifications", 
          label: "Notifications", 
          icon: Bell, 
          action: () => navigate("/notifications") 
        },
        { 
          id: "create", 
          label: "Create", 
          icon: Plus, 
          action: () => navigate("/create") 
        },
        { 
          id: "profile", 
          label: "Profile", 
          icon: UserIcon, 
          action: () => navigate("/profile") 
        }
      ]
    : [
        { 
          id: "home", 
          label: "Home", 
          icon: Home, 
          action: () => navigate("/") 
        },
        { 
          id: "search", 
          label: "Search", 
          icon: Search, 
          action: onSearchClick
        },
        { 
          id: "movies", 
          label: "Movies", 
          icon: Film, 
          action: () => navigate("/movies") 
        },
        { 
          id: "login", 
          label: "Login", 
          icon: UserIcon, 
          action: () => navigate("/login") 
        }
      ];

  // Only render on mobile screens
  if (!isMobile) return null;
  
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg flex items-center justify-between w-full max-w-md mx-auto overflow-hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="relative flex-1 py-3 flex flex-col items-center justify-center"
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
        ))}
      </div>
    </motion.div>
  );
};

export default AdjustedBottomNavbar;