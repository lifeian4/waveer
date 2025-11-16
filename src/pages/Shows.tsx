import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreVertical,
  Bookmark,
  Flag,
  UserPlus,
  Clock,
  Eye,
  ChevronUp,
  ChevronDown,
  X,
  Music
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
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
import PostStatsModal from "@/components/PostStatsModal";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  caption: string;
  title?: string;
  hashtags?: string;
  music_url?: string;
  music_title?: string;
  media_url: string;
  media_type: "image" | "video";
  video_duration: number | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
  is_liked: boolean;
  is_bookmarked: boolean;
}

const Shows = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const [autoSlide, setAutoSlide] = useState(false);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [mutedMusic, setMutedMusic] = useState<Set<string>>(new Set());
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const autoSlideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
    
    // Set up real-time subscription for new posts
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [currentUser]);

  const fetchPosts = async () => {
    try {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Fetch ALL posts from ALL users (show everything)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          title,
          hashtags,
          media_url,
          media_type,
          video_duration,
          likes_count,
          comments_count,
          views_count,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (postsError) {
        console.error('Posts fetch error:', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch profile data for each post
      const userIdsInPosts = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .in('id', userIdsInPosts);

      // Fetch likes and bookmarks for current user
      const postIds = postsData.map(p => p.id);
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id)
        .in('post_id', postIds);

      const { data: bookmarksData } = await supabase
        .from('post_bookmarks')
        .select('post_id')
        .eq('user_id', currentUser.id)
        .in('post_id', postIds);

      const likedPostIds = new Set(likesData?.map(l => l.post_id) || []);
      const bookmarkedPostIds = new Set(bookmarksData?.map(b => b.post_id) || []);

      // Combine data
      const postsWithProfiles: Post[] = postsData.map(post => ({
        ...post,
        music_url: (post as any).music_url || undefined,
        music_title: (post as any).music_title || undefined,
        profile: profilesData?.find(p => p.id === post.user_id) || {
          id: post.user_id,
          full_name: 'Unknown User',
          display_name: 'Unknown',
          username: 'unknown',
          avatar_url: '',
        },
        is_liked: likedPostIds.has(post.id),
        is_bookmarked: bookmarkedPostIds.has(post.id),
      }));

      setPosts(postsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      toast.error(error?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const trackPostView = async (postId: string) => {
    if (!currentUser || viewedPosts.has(postId)) return;

    // Mark as viewed immediately to prevent duplicate calls
    setViewedPosts(prev => new Set(prev).add(postId));

    try {
      // Check if user already viewed this post (use maybeSingle to avoid error)
      const { data: existingView, error: checkError } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing view:', checkError);
        return;
      }

      if (!existingView) {
        // Insert new view
        const { error: insertError } = await supabase
          .from('post_views')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
            viewed_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting view:', insertError);
          return;
        }

        // Increment views count
        const { error: rpcError } = await supabase.rpc('increment_post_views', { post_id: postId });
        
        if (rpcError) {
          console.error('Error incrementing views:', rpcError);
          return;
        }

        // Update local state
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, views_count: p.views_count + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // Navigation functions
  const goToNextPost = () => {
    if (currentPostIndex < posts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    }
  };

  const goToPreviousPost = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    }
  };

  // Auto-slide effect - waits for video to end
  useEffect(() => {
    if (!autoSlide || posts.length === 0) {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
      return;
    }

    const currentPost = posts[currentPostIndex];
    
    if (currentPost.media_type === 'video') {
      // For videos, wait until they end
      const videoElement = videoRefs.current[currentPost.id];
      if (videoElement) {
        const handleVideoEnd = () => {
          setCurrentPostIndex(prev => (prev + 1) % posts.length);
        };
        videoElement.addEventListener('ended', handleVideoEnd);
        return () => {
          videoElement.removeEventListener('ended', handleVideoEnd);
        };
      }
    } else {
      // For images, auto-advance after 5 seconds
      autoSlideIntervalRef.current = setTimeout(() => {
        setCurrentPostIndex(prev => (prev + 1) % posts.length);
      }, 5000);
    }

    return () => {
      if (autoSlideIntervalRef.current) {
        clearTimeout(autoSlideIntervalRef.current);
      }
    };
  }, [autoSlide, posts, currentPostIndex]);

  // Delete post function
  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  // Set up Intersection Observer for tracking views
  useEffect(() => {
    if (!currentUser || posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              trackPostView(postId);
            }
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of post is visible
    );

    // Observe all post elements
    Object.values(postRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [posts, currentUser, viewedPosts]);

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        await supabase.rpc('decrement_post_likes', { post_id: postId });

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: currentUser.id });

        await supabase.rpc('increment_post_likes', { post_id: postId });

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_bookmarked) {
        await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        setPosts(posts.map(p => 
          p.id === postId ? { ...p, is_bookmarked: false } : p
        ));
        toast.success('Removed from bookmarks');
      } else {
        await supabase
          .from('post_bookmarks')
          .insert({ post_id: postId, user_id: currentUser.id });

        setPosts(posts.map(p => 
          p.id === postId ? { ...p, is_bookmarked: true } : p
        ));
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error('Failed to bookmark post');
    }
  };

  const handleVideoPlay = (postId: string) => {
    const video = videoRefs.current[postId];
    if (!video) return;

    if (playingVideo === postId) {
      video.pause();
      setPlayingVideo(null);
    } else {
      // Pause all other videos
      Object.entries(videoRefs.current).forEach(([id, v]) => {
        if (v && id !== postId) {
          v.pause();
        }
      });
      video.play();
      setPlayingVideo(postId);
    }
  };

  const toggleMute = (postId: string) => {
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMusicPlay = (postId: string, musicUrl: string) => {
    const audio = audioRefs.current[postId];
    if (!audio) return;

    if (playingMusic === postId) {
      audio.pause();
      setPlayingMusic(null);
    } else {
      // Pause all other music
      Object.entries(audioRefs.current).forEach(([id, a]) => {
        if (a && id !== postId) {
          a.pause();
        }
      });
      audio.src = musicUrl;
      audio.volume = mutedMusic.has(postId) ? 0 : 1;
      audio.play();
      setPlayingMusic(postId);
    }
  };

  const toggleMusicMute = (postId: string) => {
    const audio = audioRefs.current[postId];
    setMutedMusic(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        if (audio) audio.volume = 1;
      } else {
        newSet.add(postId);
        if (audio) audio.volume = 0;
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <PageWrapper>
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageWrapper>
        <div className="min-h-screen bg-gradient-to-b from-background to-black py-8 px-4 pt-24 md:pt-28 flex flex-col items-center justify-center relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-black mb-2">
              <span className="text-primary">W</span>
              <span className="text-foreground">aver Shows</span>
            </h1>
            <p className="text-muted-foreground">
              Discover amazing content
            </p>
          </motion.div>

          {/* Navigation Arrows */}
          {posts.length > 0 && (
            <>
              {/* Up Arrow */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPreviousPost}
                disabled={currentPostIndex === 0}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/20 hover:bg-white/40 disabled:opacity-50 text-white p-3 rounded-full transition-all"
              >
                <ChevronUp className="w-6 h-6" />
              </motion.button>

              {/* Down Arrow */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextPost}
                disabled={currentPostIndex === posts.length - 1}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/20 hover:bg-white/40 disabled:opacity-50 text-white p-3 rounded-full transition-all"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.button>
            </>
          )}

          {/* Posts Feed - Compact Square Modal */}
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share something amazing!
              </p>
              <Button onClick={() => navigate('/create')}>
                Create Your First Post
              </Button>
            </Card>
          ) : (
            <div className="w-full max-w-sm">
                {posts.length > 0 && (
                  <motion.div
                    key={posts[currentPostIndex].id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    ref={(el) => postRefs.current[posts[currentPostIndex].id] = el}
                    data-post-id={posts[currentPostIndex].id}
                  >
                    {(() => {
                      const post = posts[currentPostIndex];
                      return (
                    <Card className="overflow-hidden bg-gray-900 border-gray-800 shadow-2xl rounded-2xl">
                      {/* Post Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate(`/profile/${post.user_id}`)}
                        >
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            <AvatarImage src={post.profile.avatar_url} />
                            <AvatarFallback>
                              {post.profile.display_name?.charAt(0) || 
                               post.profile.full_name?.charAt(0) || 
                               'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {post.profile.display_name || post.profile.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setAutoSlide(!autoSlide)}
                          title={autoSlide ? "Stop Auto-Slide" : "Auto-Slide"}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Post Media - Square Aspect Ratio */}
                      <div className="relative bg-black aspect-square overflow-hidden">
                        {post.media_type === 'image' ? (
                          <img
                            src={post.media_url}
                            alt={post.caption}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              ref={(el) => videoRefs.current[post.id] = el}
                              src={post.media_url}
                              className="w-full h-full object-cover"
                              loop
                              playsInline
                              autoPlay
                              muted={mutedVideos.has(post.id)}
                            />
                            {post.video_duration && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full text-xs">
                                <Clock className="w-3 h-3 text-white" />
                                <span className="text-white">
                                  {formatDuration(post.video_duration)}
                                </span>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
                              onClick={() => toggleMute(post.id)}
                            >
                              {mutedVideos.has(post.id) ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="p-3 bg-gray-800/50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(post.id)}
                            className="gap-1 text-xs h-8"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                post.is_liked ? 'fill-red-500 text-red-500' : ''
                              }`}
                            />
                            <span className="text-xs">{post.likes_count}</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 text-xs h-8"
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments_count}</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 text-xs h-8"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 text-xs h-8"
                            onClick={() => {
                              setSelectedPostId(post.id);
                              setStatsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">{post.views_count}</span>
                          </Button>
                        </div>

                        {/* Caption & Title */}
                        <div className="space-y-1">
                          {post.caption && (
                            <p className="text-xs line-clamp-2">
                              <span 
                                className="font-semibold mr-1 cursor-pointer hover:text-primary"
                                onClick={() => navigate(`/profile/${post.user_id}`)}
                              >
                                {post.profile.display_name || post.profile.full_name}
                              </span>
                              {post.caption}
                            </p>
                          )}
                          {post.hashtags && (
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {post.hashtags}
                            </p>
                          )}
                          {post.music_url && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-primary font-semibold">
                                  <Music className="w-3 h-3 inline mr-1" />
                                  {post.music_title || 'Music'}
                                </p>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleMusicPlay(post.id, post.music_url)}
                                  >
                                    {playingMusic === post.id ? (
                                      <Pause className="w-3 h-3" />
                                    ) : (
                                      <Play className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleMusicMute(post.id)}
                                  >
                                    {mutedMusic.has(post.id) ? (
                                      <VolumeX className="w-3 h-3" />
                                    ) : (
                                      <Volume2 className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <audio
                                ref={(el) => audioRefs.current[post.id] = el}
                                onEnded={() => setPlayingMusic(null)}
                              />
                              {post.music_url.includes('youtube.com') || post.music_url.includes('youtu.be') ? (
                                <a
                                  href={post.music_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:underline"
                                >
                                  Watch on YouTube →
                                </a>
                              ) : (
                                <a
                                  href={post.music_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:underline"
                                >
                                  Open Link →
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                      );
                    })()}
                  </motion.div>
                )}
              </div>
            )}
        </div>

        {/* Post Stats Modal */}
        {selectedPostId && (
          <PostStatsModal
            postId={selectedPostId}
            isOpen={statsModalOpen}
            onClose={() => {
              setStatsModalOpen(false);
              setSelectedPostId(null);
            }}
          />
        )}
      </PageWrapper>
    </>
  );
};

export default Shows;
