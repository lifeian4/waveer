import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, X, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import StreamingHero from "@/components/StreamingHero";
import TrendingSection from "@/components/TrendingSection";
import NewReleasesSection from "@/components/NewReleasesSection";
import Footer from "@/components/Footer";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";


const Index = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const verification = searchParams.get("verification");
    const subscription = searchParams.get("subscription");
    
    if (verification === "pending") {
      setShowVerificationMessage(true);
    }
    
    if (subscription === "success") {
      setShowSuccessMessage(true);
      // Auto-hide success message after 8 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 8000);
    }
  }, [searchParams]);

  // Real-time subscription monitoring
  useEffect(() => {
    if (!currentUser) return;

    // Listen for profile changes (subscription activation)
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          
          // Check if subscription was activated
          if (payload.new.subscription_status === 'active' && payload.old.subscription_status !== 'active') {
            console.log('Subscription activated!');
            setShowVerificationMessage(false);
            setShowSuccessMessage(true);
            
            // Auto-hide success message after 10 seconds
            setTimeout(() => {
              setShowSuccessMessage(false);
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Countdown timer for verification message
  useEffect(() => {
    if (showVerificationMessage && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setShowVerificationMessage(false);
    }
  }, [showVerificationMessage, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        {/* Payment Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              className="fixed top-20 left-0 right-0 z-50 px-4"
            >
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          🎉 Payment Approved! Welcome to Premium!
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                          </motion.div>
                        </h3>
                        <p className="text-green-100 mb-3">
                          Your subscription has been activated! You now have access to all premium features.
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span className="text-sm">Premium access activated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-300" />
                            <span className="text-sm">All features unlocked</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuccessMessage(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification Pending Message */}
        <AnimatePresence>
          {showVerificationMessage && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              className="fixed top-20 left-0 right-0 z-50 px-4"
            >
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Payment Verification Submitted!</h3>
                        <p className="text-blue-100 mb-3">
                          Please wait 5 minutes for our team to activate your plan. Don't forget to send your payment screenshot to WhatsApp +250732539470.
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span className="text-sm">Verification request submitted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-300" />
                            <span className="text-sm">Activation in: {formatTime(timeLeft)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVerificationMessage(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-4 bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Verification Progress</span>
                      <span>{Math.round(((300 - timeLeft) / 300) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((300 - timeLeft) / 300) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <StreamingHero />
        
        {/* Content Sections */}
        <div className="relative z-10 space-y-16 pb-20">
          <TrendingSection type="movie" title="🔥 Trending Movies" />
          <TrendingSection type="tv" title="📺 Trending TV Shows" />
          <NewReleasesSection type="movie" title="🎬 New Movie Releases" />
          <NewReleasesSection type="tv" title="📡 New TV Show Episodes" />
        </div>
        
        <Footer />
        
      </div>

    </PageWrapper>
  );
};

export default Index;
