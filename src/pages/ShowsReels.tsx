import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Volume2,
  VolumeX,
  Music
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";

interface Post {
  id: string;
  user_id: string;
  caption: string;
  media_url: string;
  media_type: "image" | "video";
  video_duration: number | null;
  music_title?: string;
  music_artist?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  is_liked: boolean;
  is_bookmarked: boolean;
}

const ShowsReels = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(id, full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const currentPost = posts[currentPostIndex];

  const handleNext = () => {
    if (currentPostIndex < posts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
      setPlayingVideo(true);
    }
  };

  const handlePrevious = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
      setPlayingVideo(true);
    }
  };

  const handleLike = async () => {
    if (!currentPost) return;
    try {
      // Toggle like logic here
      toast.success('Liked!');
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleShare = async () => {
    if (!currentPost) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentPost.profile.username,
          text: currentPost.caption,
          url: window.location.href
        });
      } else {
        toast.success('Link copied!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!currentPost) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">No posts available</h2>
            <p className="text-gray-400">Check back later for new content</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="fixed inset-0 bg-black z-40 flex items-center justify-center overflow-hidden">
        {/* Main Content */}
        <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
          {/* Media Container */}
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full bg-black rounded-2xl overflow-hidden"
          >
            {currentPost.media_type === 'video' ? (
              <video
                ref={videoRef}
                src={currentPost.media_url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={isMuted}
                onClick={() => setPlayingVideo(!playingVideo)}
              />
            ) : (
              <img
                src={currentPost.media_url}
                alt={currentPost.caption}
                className="w-full h-full object-cover"
              />
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

            {/* Top Section - User Info */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src={currentPost.profile.avatar_url} />
                    <AvatarFallback>{currentPost.profile.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">{currentPost.profile.username}</p>
                    <p className="text-gray-300 text-xs">Follow</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Bottom Section - Caption & Music */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              {/* Caption */}
              <div className="mb-4">
                <p className="text-white text-sm line-clamp-2">{currentPost.caption}</p>
              </div>

              {/* Music Info */}
              {currentPost.music_title && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 w-fit">
                  <Music className="w-4 h-4 text-white" />
                  <span className="text-white text-xs truncate">
                    {currentPost.music_artist && `${currentPost.music_artist} - `}
                    {currentPost.music_title}
                  </span>
                </div>
              )}
            </div>

            {/* Right Side - Actions */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-6">
              {/* Like */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleLike}
                  className="flex flex-col items-center gap-1 text-white hover:text-red-500 h-auto p-0"
                >
                  <Heart className="w-7 h-7 fill-current" />
                  <span className="text-xs">{currentPost.likes_count}</span>
                </Button>
              </motion.div>

              {/* Comments */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-white hover:text-blue-500 h-auto p-0"
                >
                  <MessageCircle className="w-7 h-7" />
                  <span className="text-xs">{currentPost.comments_count}</span>
                </Button>
              </motion.div>

              {/* Share */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1 text-white hover:text-green-500 h-auto p-0"
                >
                  <Share2 className="w-7 h-7" />
                </Button>
              </motion.div>

              {/* Bookmark */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-white hover:text-yellow-500 h-auto p-0"
                >
                  <Bookmark className="w-7 h-7" />
                </Button>
              </motion.div>

              {/* Mute Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex flex-col items-center gap-1 text-white hover:text-gray-300 h-auto p-0"
                >
                  {isMuted ? (
                    <VolumeX className="w-7 h-7" />
                  ) : (
                    <Volume2 className="w-7 h-7" />
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Navigation Arrows */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
            <Button
              onClick={handlePrevious}
              disabled={currentPostIndex === 0}
              className="rounded-full bg-white/20 hover:bg-white/40 text-white disabled:opacity-50"
              size="lg"
            >
              ↑
            </Button>
          </div>

          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
            <Button
              onClick={handleNext}
              disabled={currentPostIndex === posts.length - 1}
              className="rounded-full bg-white/20 hover:bg-white/40 text-white disabled:opacity-50"
              size="lg"
            >
              ↓
            </Button>
          </div>

          {/* Post Counter */}
          <div className="absolute top-4 left-4 z-30 text-white text-sm font-semibold">
            {currentPostIndex + 1} / {posts.length}
          </div>
        </div>

        {/* Navigation Bar */}
        <Navigation />
      </div>
    </PageWrapper>
  );
};

export default ShowsReels;
