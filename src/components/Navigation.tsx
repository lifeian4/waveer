import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  Shield, 
  Moon, 
  Sun,
  ChevronRight,
  Star,
  Calendar,
  Mail,
  Lock,
  BookOpen,
  BadgeCheck,
  Home,
  Users,
  Menu,
  X,
  Film,
  Tv,
  Music,
  Plus,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import ImprovedSearch from "./ImprovedSearch";
import AdjustedBottomNavbar from "./AdjustedBottomNavbar";
import NotificationsDropdown from "./NotificationsDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

const Navigation = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [isVerified, setIsVerified] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const navLinks = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Movies", icon: Film, path: "/movies" },
    { name: "Waver Shows", icon: Sparkles, path: "/shows" },
    { name: "Music", icon: Music, path: "/music" }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const handleSwitchAccount = () => {
    // Generate OAuth state
    const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem('oauth_state', state);
    
    // Redirect to OAuth authorize page
    const params = new URLSearchParams({
      client_id: 'waveer_client_123',
      redirect_uri: window.location.origin + '/oauth/callback',
      response_type: 'code',
      state: state,
      scope: 'profile email',
    });
    
    window.location.href = `${window.location.origin}/oauth/authorize?${params.toString()}`;
  };

  // Check verification status and fetch date of birth
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!currentUser) {
        setIsVerified(false);
        setDateOfBirth(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_verified, date_of_birth')
          .eq('id', currentUser.id)
          .single();

        if (!error && data) {
          setIsVerified(data.is_verified || false);
          setDateOfBirth(data.date_of_birth || null);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setIsVerified(false);
        setDateOfBirth(null);
      }
    };

    checkVerificationStatus();
  }, [currentUser]);

  // Close search on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      {!isMobile ? (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="text-2xl font-bold cursor-pointer relative group"
            >
              <motion.span 
                className="text-primary relative inline-block"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                W
                <motion.span
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                </motion.span>
              </motion.span>
              <span className="text-foreground group-hover:text-primary transition-colors duration-300">aveer</span>
            </motion.div>

            {/* Centered Navigation Links */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <motion.div 
                className="flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-lg relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                
                {navLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.name}
                      onClick={() => setActiveLink(link.name)}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <Link
                        to={link.path}
                        className={`relative px-6 py-2 text-sm font-semibold transition-all duration-300 rounded-full z-10 flex items-center gap-2 ${
                          activeLink === link.name
                            ? "text-primary"
                            : "text-foreground/70 hover:text-foreground"
                        }`}
                      >
                      <Icon className="w-4 h-4" />
                      {/* Active indicator */}
                      {activeLink === link.name && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-primary/10 rounded-full border border-primary/30"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      {/* Hover glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-full opacity-0"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      <span className="relative z-10">{link.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Animated Search Button */}
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                whileHover={{ scale: 1.15, rotate: 15 }}
                whileTap={{ scale: 0.9, rotate: -15 }}
                className="relative p-3 hover:bg-primary/10 rounded-full transition-all duration-300 group overflow-hidden"
              >
                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <Search className="w-5 h-5 text-foreground group-hover:text-primary transition-colors duration-300 relative z-10" />
              </motion.button>

              {currentUser ? (
                <>
                  {/* Create Button */}
                  <motion.button
                    onClick={() => navigate("/create")}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-3 hover:bg-primary/10 rounded-full transition-all duration-300 group"
                  >
                    <Plus className="w-5 h-5 text-foreground group-hover:text-primary transition-colors duration-300" />
                  </motion.button>

                  {/* User Menu with Notifications */}
                  <div className="flex items-center gap-2">
                    {/* Notification Bell */}
                    <NotificationsDropdown />

                    {/* Avatar */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 focus:outline-none"
                        >
                          <Avatar className="w-10 h-10 border-2 border-primary/50">
                            <AvatarImage src={currentUser.user_metadata?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                              {currentUser.user_metadata?.full_name?.charAt(0) || currentUser.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </motion.button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end" forceMount>
                      <div className="flex items-center justify-between px-2 py-3">
                        <DropdownMenuLabel className="p-0">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium leading-none">
                                {currentUser.user_metadata?.full_name || "User"}
                              </p>
                              {isVerified && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs leading-none text-muted-foreground">
                              {currentUser.email}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {isVerified ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Account Verified
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Not Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-full text-xs h-7"
                            onClick={() => navigate("/profile")}
                          >
                            View Profile
                          </Button>
                          {!isVerified && (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="rounded-full text-xs h-7 bg-amber-600 hover:bg-amber-700"
                              onClick={() => navigate("/verify-account")}
                            >
                              Verify Now
                            </Button>
                          )}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => navigate("/chat")}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span>Chat</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/billing")}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Billing & Plans</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/security")}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Security</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={handleSwitchAccount} className="text-blue-500 focus:text-blue-500">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Switch Account</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <motion.div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/login">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="rounded-full"
                      >
                        Log In
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/signup">
                      <Button 
                        variant="hero" 
                        size="lg" 
                        className="rounded-full relative overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span className="relative z-10 font-bold">Sign Up</span>
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.nav>
      ) : (
        /* Mobile Navigation */
        <>
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="text-xl font-bold cursor-pointer relative group"
                onClick={() => navigate("/")}
              >
                <motion.span 
                  className="text-primary relative inline-block"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  W
                  <motion.span
                    className="absolute -top-1 -right-1"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                  </motion.span>
                </motion.span>
                <span className="text-foreground group-hover:text-primary transition-colors duration-300">aver</span>
              </motion.div>

              {/* Mobile Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setIsSearchOpen(true)}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-primary/10 rounded-full transition-all duration-300"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </motion.button>

                {currentUser ? (
                  <>
                    {/* Chat/Message Icon */}
                    <motion.button
                      onClick={() => navigate("/chat")}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-primary/10 rounded-full transition-all duration-300"
                    >
                      <MessageCircle className="w-5 h-5 text-foreground" />
                    </motion.button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          className="flex items-center gap-2 focus:outline-none"
                        >
                          <Avatar className="w-8 h-8 border-2 border-primary/50">
                            <AvatarImage src={currentUser.user_metadata?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                              {currentUser.user_metadata?.full_name?.charAt(0) || currentUser.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64" align="end">
                        <DropdownMenuLabel>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {currentUser.user_metadata?.full_name || "User"}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {currentUser.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => navigate("/billing")}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Billing & Plans</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/security")}>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Security</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Link to="/signup">
                    <Button variant="hero" size="sm" className="rounded-full">
                      Sign Up
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.nav>

          {/* Mobile Menu Overlay - Removed since we removed the menu icon */}
        </>
      )}

      {/* Old bottom navbar removed */}

      {/* Improved Search */}
      <ImprovedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Adjusted Bottom Navbar */}
      <AdjustedBottomNavbar onSearchClick={() => setIsSearchOpen(true)} />
     
    </>
  );
};

export default Navigation;