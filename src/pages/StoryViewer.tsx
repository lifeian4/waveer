import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStories, type Story } from "@/lib/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Heart, Send, Pause, Play, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const StoryViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserStories, setCurrentUserStories] = useState<Story[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const STORY_DURATION = 5000; // 5 seconds for images
  
  // Load all stories
  useEffect(() => {
    const loadStories = async () => {
      if (!currentUser) return;
      
      try {
        const stories = await getStories(currentUser.id);
        
        // Group stories by user
        const groupedStories: { [key: string]: Story[] } = {};
        stories.forEach(story => {
          if (!groupedStories[story.user_id]) {
            groupedStories[story.user_id] = [];
          }
          groupedStories[story.user_id].push(story);
        });
        
        setAllStories(stories);
        
        // Find the story and user
        if (id) {
          const storyIndex = stories.findIndex(s => s.id === id);
          if (storyIndex !== -1) {
            const story = stories[storyIndex];
            const userStories = groupedStories[story.user_id] || [];
            const storyIndexInUser = userStories.findIndex(s => s.id === id);
            
            setCurrentUserStories(userStories);
            setCurrentStoryIndex(storyIndexInUser);
            
            // Find user index in all users
            const userIds = Object.keys(groupedStories);
            const userIdx = userIds.indexOf(story.user_id);
            setCurrentUserIndex(userIdx);
          }
        }
      } catch (error) {
        console.error('Error loading stories:', error);
        toast.error('Failed to load stories');
      } finally {
        setLoading(false);
      }
    };
    
    loadStories();
  }, [currentUser, id]);
  
  const currentStory = currentUserStories[currentStoryIndex];
  
  // Auto-progress story
  useEffect(() => {
    if (!currentStory || isPaused || loading) return;
    
    const duration = currentStory.media_type === 'video' && videoRef.current 
      ? videoRef.current.duration * 1000 
      : STORY_DURATION;
    
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory, isPaused, loading, currentStoryIndex]);
  
  // Play audio if story has audio
  useEffect(() => {
    if (audioRef.current && currentStory?.media_url) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.log('Audio play error:', err));
      }
    }
  }, [currentStory, isPaused]);
  
  const goToNextStory = () => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to next user's stories
      goToNextUser();
    }
  };
  
  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to previous user's stories
      goToPreviousUser();
    }
  };
  
  const goToNextUser = () => {
    // Get all unique user IDs
    const userIds = [...new Set(allStories.map(s => s.user_id))];
    const currentUserId = currentStory?.user_id;
    const currentIdx = userIds.indexOf(currentUserId);
    
    if (currentIdx < userIds.length - 1) {
      const nextUserId = userIds[currentIdx + 1];
      const nextUserStories = allStories.filter(s => s.user_id === nextUserId);
      setCurrentUserStories(nextUserStories);
      setCurrentStoryIndex(0);
      setCurrentUserIndex(currentIdx + 1);
      setProgress(0);
    } else {
      // No more stories, close viewer
      navigate(-1);
    }
  };
  
  const goToPreviousUser = () => {
    const userIds = [...new Set(allStories.map(s => s.user_id))];
    const currentUserId = currentStory?.user_id;
    const currentIdx = userIds.indexOf(currentUserId);
    
    if (currentIdx > 0) {
      const prevUserId = userIds[currentIdx - 1];
      const prevUserStories = allStories.filter(s => s.user_id === prevUserId);
      setCurrentUserStories(prevUserStories);
      setCurrentStoryIndex(prevUserStories.length - 1);
      setCurrentUserIndex(currentIdx - 1);
      setProgress(0);
    }
  };
  
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      // Tapped left third - go to previous
      goToPreviousStory();
    } else if (x > (width * 2) / 3) {
      // Tapped right third - go to next
      goToNextStory();
    } else {
      // Tapped middle - pause/play
      setIsPaused(!isPaused);
    }
  };
  
  const handleReply = () => {
    if (!replyText.trim()) return;
    
    // TODO: Implement reply functionality (send as DM)
    toast.success('Reply sent!');
    setReplyText('');
  };
  
  const handleClose = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (!currentStory) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Story not found</p>
          <Button onClick={handleClose} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Story Container */}
      <div className="relative w-full h-full max-w-[500px] mx-auto">
        {/* Story Content */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handleTap}
        >
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              loop={false}
              muted={isMuted}
              onEnded={goToNextStory}
            />
          )}
          
          {/* Audio for stories with music */}
          {currentStory.content && (
            <audio
              ref={audioRef}
              src={currentStory.content}
              loop
              autoPlay
            />
          )}
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
        
        {/* Top Section - Always Visible */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
              {/* Progress Bars */}
              <div className="flex gap-1 mb-4">
                {currentUserStories.map((_, index) => (
                  <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100"
                      style={{
                        width: index < currentStoryIndex 
                          ? '100%' 
                          : index === currentStoryIndex 
                          ? `${progress}%` 
                          : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* User Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src={currentStory.user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-white">
                      {currentStory.user?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {currentStory.user?.display_name || currentStory.user?.full_name}
                    </p>
                    <p className="text-white/70 text-xs">
                      {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentStory.media_type === 'video' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPaused(!isPaused);
                        }}
                      >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
        
        {/* Side Navigation - Other Users' Stories */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          {allStories
            .filter((s, i, arr) => arr.findIndex(story => story.user_id === s.user_id) === i)
            .slice(Math.max(0, currentUserIndex - 1), currentUserIndex + 2)
            .map((story, index) => {
              const isActive = story.user_id === currentStory.user_id;
              return (
                <motion.div
                  key={story.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`cursor-pointer transition-all ${
                    isActive ? 'scale-110' : 'scale-90 opacity-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) {
                      const userStories = allStories.filter(s => s.user_id === story.user_id);
                      setCurrentUserStories(userStories);
                      setCurrentStoryIndex(0);
                      setProgress(0);
                    }
                  }}
                >
                  <Avatar className="w-12 h-12 border-2 border-white">
                    <AvatarImage src={story.user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {story.user?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              );
            })}
        </div>
        
        {/* Bottom Section - Reply - Always Visible */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${currentStory.user?.display_name || 'user'}...`}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 pr-20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleReply();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add like functionality
                        toast.success('Liked!');
                      }}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReply();
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        
        {/* Navigation Arrows (Desktop) */}
        <div className="hidden md:block">
          {currentStoryIndex > 0 || currentUserIndex > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousStory();
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          ) : null}
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              goToNextStory();
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
