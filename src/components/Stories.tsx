import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStories, viewStory, type Story } from "@/lib/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Stories = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadStories = async () => {
      try {
        const storiesData = await getStories(currentUser.id);
        setStories(storiesData);
      } catch (error) {
        console.error('Error loading stories:', error);
        toast.error('Failed to load stories');
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, [currentUser]);


  const handleViewStory = async (story: Story) => {
    if (!currentUser) return;

    // Navigate to story viewer
    navigate(`/story/${story.id}`);
    
    if (!story.has_viewed) {
      await viewStory(story.id, currentUser.id);
      setStories(prev => 
        prev.map(s => s.id === story.id ? { ...s, has_viewed: true, view_count: (s.view_count || 0) + 1 } : s)
      );
    }
  };

  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  if (loading) {
    return (
      <div className="flex items-center gap-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 overflow-x-auto">
        {/* Add Story Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/create-story')}
          className="flex-shrink-0 cursor-pointer"
        >
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-dashed border-primary">
              <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10">
                {currentUser?.user_metadata?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <p className="text-xs text-center mt-2 text-muted-foreground">Add Story</p>
        </motion.div>

        {/* Stories */}
        {Object.entries(groupedStories).map(([userId, userStories]) => {
          const latestStory = userStories[0];
          const hasUnviewed = userStories.some(story => !story.has_viewed);
          
          return (
            <motion.div
              key={userId}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewStory(latestStory)}
              className="flex-shrink-0 cursor-pointer"
            >
              <div className="relative">
                <Avatar className={`w-16 h-16 border-2 ${hasUnviewed ? 'border-primary' : 'border-muted'}`}>
                  <AvatarImage src={latestStory.user?.avatar_url} />
                  <AvatarFallback>
                    {latestStory.user?.display_name?.charAt(0) || latestStory.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {userStories.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">
                      {userStories.length}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-2 truncate w-16">
                {latestStory.user?.display_name || latestStory.user?.full_name || 'User'}
              </p>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};

export default Stories;
