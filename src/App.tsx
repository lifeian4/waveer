import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Suspense, lazy, useEffect } from "react";
import { useServiceWorker } from "@/hooks/useServiceWorker";

// Lazy load all page components
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const NotificationsNew = lazy(() => import("./pages/NotificationsNew"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const SeriesDetails = lazy(() => import("./pages/SeriesDetails"));
const MovieDetailsNew = lazy(() => import("./pages/MovieDetailsNew"));
const SeriesDetailsNew = lazy(() => import("./pages/SeriesDetailsNew"));
const Music = lazy(() => import("./pages/Music"));
const MusicTest = lazy(() => import("./pages/MusicTest"));
const Billing = lazy(() => import("./pages/Billing"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentVerification = lazy(() => import("./pages/PaymentVerification"));
const Manager = lazy(() => import("./pages/Manager"));
const Watch = lazy(() => import("./pages/Watch"));
const Episodes = lazy(() => import("./pages/Episodes"));
const WatchEpisode = lazy(() => import("./pages/WatchEpisode"));
const GoogleAuth = lazy(() => import("./pages/GoogleAuth"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const CreateWithMusic = lazy(() => import("./pages/CreateWithMusic"));
const Shows = lazy(() => import("./pages/Shows"));
const ShowsReels = lazy(() => import("./pages/ShowsReels"));
const PostDetails = lazy(() => import("./pages/PostDetails"));
const SpotifyCallback = lazy(() => import("./pages/SpotifyCallback"));
const ChatNew = lazy(() => import("./pages/ChatNew"));
const ChatWithStories = lazy(() => import("./pages/ChatWithStories"));
const CreateStory = lazy(() => import("./pages/CreateStory"));
const StoryViewer = lazy(() => import("./pages/StoryViewer"));
const VideoCallWebRTC = lazy(() => import("./pages/VideoCallWebRTC"));
const AudioCallWebRTC = lazy(() => import("./pages/AudioCallWebRTC"));
const VideoCall2 = lazy(() => import("./pages/VideoCall2"));
const AudioCall2 = lazy(() => import("./pages/AudioCall2"));
const IncomingCallNotification = lazy(() => import("./components/IncomingCallNotification"));
const Security = lazy(() => import("./pages/Security"));
const Trending = lazy(() => import("./pages/Trending"));
const VerifyAccount = lazy(() => import("./pages/VerifyAccount"));
const Booster = lazy(() => import("./pages/Booster"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const OAuthAuthorize = lazy(() => import("./pages/OAuthAuthorize"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

const App = () => {
  // Initialize service worker for offline support
  useServiceWorker();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<LoadingFallback />}>
                <IncomingCallNotification />
              </Suspense>
              <Routes>
                <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
                <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
                <Route path="/signup" element={<Suspense fallback={<LoadingFallback />}><Signup /></Suspense>} />
                <Route path="/verify-email" element={<Suspense fallback={<LoadingFallback />}><VerifyEmail /></Suspense>} />
                <Route path="/forgot-password" element={<Suspense fallback={<LoadingFallback />}><ForgotPassword /></Suspense>} />
                <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>} />
                <Route path="/onboarding" element={<Suspense fallback={<LoadingFallback />}><Onboarding /></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
                <Route path="/profile/:userId" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
                <Route path="/notifications" element={<Suspense fallback={<LoadingFallback />}><NotificationsNew /></Suspense>} />
                <Route path="/movie/:id" element={<Suspense fallback={<LoadingFallback />}><MovieDetails /></Suspense>} />
                <Route path="/movie-details/:id" element={<Suspense fallback={<LoadingFallback />}><MovieDetails /></Suspense>} />
                <Route path="/series/:id" element={<Suspense fallback={<LoadingFallback />}><SeriesDetailsNew /></Suspense>} />
                <Route path="/serie-details/:id" element={<Suspense fallback={<LoadingFallback />}><SeriesDetailsNew /></Suspense>} />
                <Route path="/music" element={<Suspense fallback={<LoadingFallback />}><Music /></Suspense>} />
                <Route path="/billing" element={<Suspense fallback={<LoadingFallback />}><Billing /></Suspense>} />
                <Route path="/payment" element={<Suspense fallback={<LoadingFallback />}><Payment /></Suspense>} />
                <Route path="/payment-verification" element={<Suspense fallback={<LoadingFallback />}><PaymentVerification /></Suspense>} />
                <Route path="/manager" element={<Suspense fallback={<LoadingFallback />}><Manager /></Suspense>} />
                <Route path="/watch/:id" element={<Suspense fallback={<LoadingFallback />}><Watch /></Suspense>} />
                <Route path="/episodes/:id" element={<Suspense fallback={<LoadingFallback />}><Episodes /></Suspense>} />
                <Route path="/episodes/:id/:season" element={<Suspense fallback={<LoadingFallback />}><Episodes /></Suspense>} />
                <Route path="/watch-episode/:id/:season/:episode" element={<Suspense fallback={<LoadingFallback />}><WatchEpisode /></Suspense>} />
                <Route path="/google" element={<Suspense fallback={<LoadingFallback />}><GoogleAuth /></Suspense>} />
                <Route path="/google-callback" element={<Suspense fallback={<LoadingFallback />}><GoogleCallback /></Suspense>} />
                <Route path="/spotify-callback" element={<Suspense fallback={<LoadingFallback />}><SpotifyCallback /></Suspense>} />
                <Route path="/create" element={<Suspense fallback={<LoadingFallback />}><CreatePost /></Suspense>} />
                <Route path="/create-music" element={<Suspense fallback={<LoadingFallback />}><CreateWithMusic /></Suspense>} />
                <Route path="/shows" element={<Suspense fallback={<LoadingFallback />}><Shows /></Suspense>} />
                <Route path="/shows-reels" element={<Suspense fallback={<LoadingFallback />}><ShowsReels /></Suspense>} />
                <Route path="/post/:id" element={<Suspense fallback={<LoadingFallback />}><PostDetails /></Suspense>} />
                <Route path="/chat/:userId?" element={<Suspense fallback={<LoadingFallback />}><ChatWithStories /></Suspense>} />
                <Route path="/create-story" element={<Suspense fallback={<LoadingFallback />}><CreateStory /></Suspense>} />
                <Route path="/story/:id" element={<Suspense fallback={<LoadingFallback />}><StoryViewer /></Suspense>} />
                <Route path="/video-call/:callId" element={<Suspense fallback={<LoadingFallback />}><VideoCallWebRTC /></Suspense>} />
                <Route path="/audio-call/:callId" element={<Suspense fallback={<LoadingFallback />}><AudioCallWebRTC /></Suspense>} />
                <Route path="/video-call2/:callId" element={<Suspense fallback={<LoadingFallback />}><VideoCall2 /></Suspense>} />
                <Route path="/audio-call2/:callId" element={<Suspense fallback={<LoadingFallback />}><AudioCall2 /></Suspense>} />
                <Route path="/security" element={<Suspense fallback={<LoadingFallback />}><Security /></Suspense>} />
                <Route path="/trending" element={<Suspense fallback={<LoadingFallback />}><Trending /></Suspense>} />
                <Route path="/verify-account" element={<Suspense fallback={<LoadingFallback />}><VerifyAccount /></Suspense>} />
                <Route path="/booster" element={<Suspense fallback={<LoadingFallback />}><Booster /></Suspense>} />
                <Route path="/about" element={<Suspense fallback={<LoadingFallback />}><About /></Suspense>} />
                <Route path="/contact" element={<Suspense fallback={<LoadingFallback />}><Contact /></Suspense>} />
                <Route path="/feed" element={<Suspense fallback={<LoadingFallback />}><ChatWithStories /></Suspense>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
