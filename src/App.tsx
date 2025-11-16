import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import NotificationsNew from "./pages/NotificationsNew";
import MovieDetails from "./pages/MovieDetails";
import SeriesDetails from "./pages/SeriesDetails";
import MovieDetailsNew from "./pages/MovieDetailsNew";
import SeriesDetailsNew from "./pages/SeriesDetailsNew";
import Music from "./pages/Music";
import MusicTest from "./pages/MusicTest";
import Billing from "./pages/Billing";
import Payment from "./pages/Payment";
import PaymentVerification from "./pages/PaymentVerification";
import Manager from "./pages/Manager";
import Watch from "./pages/Watch";
import Episodes from "./pages/Episodes";
import GoogleAuth from "./pages/GoogleAuth";
import GoogleCallback from "./pages/GoogleCallback";
import CreatePost from "./pages/CreatePost";
import CreateWithMusic from "./pages/CreateWithMusic";
import Shows from "./pages/Shows";
import ShowsReels from "./pages/ShowsReels";
import PostDetails from "./pages/PostDetails";
import SpotifyCallback from "./pages/SpotifyCallback";
import ChatNew from "./pages/ChatNew";
import ChatWithStories from "./pages/ChatWithStories";
import CreateStory from "./pages/CreateStory";
import StoryViewer from "./pages/StoryViewer";
import VideoCallWebRTC from "./pages/VideoCallWebRTC";
import AudioCallWebRTC from "./pages/AudioCallWebRTC";
import IncomingCallNotification from "./components/IncomingCallNotification";
import Security from "./pages/Security";
import Trending from "./pages/Trending";
import VerifyAccount from "./pages/VerifyAccount";
import Booster from "./pages/Booster";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <IncomingCallNotification />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/notifications" element={<NotificationsNew />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/movie-details/:id" element={<MovieDetails />} />
              <Route path="/series/:id" element={<SeriesDetailsNew />} />
              <Route path="/serie-details/:id" element={<SeriesDetailsNew />} />
              <Route path="/music" element={<Music />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-verification" element={<PaymentVerification />} />
              <Route path="/manager" element={<Manager />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/episodes/:id" element={<Episodes />} />
              <Route path="/episodes/:id/:season" element={<Episodes />} />
              <Route path="/google" element={<GoogleAuth />} />
              <Route path="/google-callback" element={<GoogleCallback />} />
              <Route path="/spotify-callback" element={<SpotifyCallback />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/create-music" element={<CreateWithMusic />} />
              <Route path="/shows" element={<Shows />} />
              <Route path="/shows-reels" element={<ShowsReels />} />
              <Route path="/post/:id" element={<PostDetails />} />
              <Route path="/chat/:userId?" element={<ChatWithStories />} />
              <Route path="/create-story" element={<CreateStory />} />
              <Route path="/story/:id" element={<StoryViewer />} />
              <Route path="/video-call/:callId" element={<VideoCallWebRTC />} />
              <Route path="/audio-call/:callId" element={<AudioCallWebRTC />} />
              <Route path="/security" element={<Security />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/verify-account" element={<VerifyAccount />} />
              <Route path="/booster" element={<Booster />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/feed" element={<ChatWithStories />} /> {/* Using chat as feed for now */}
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
