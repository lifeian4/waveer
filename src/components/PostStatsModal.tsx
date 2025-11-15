import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Heart, MessageCircle, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface PostStatsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Visitor {
  id: string;
  user_id: string;
  viewed_at: string;
  profile: {
    full_name: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

interface Like {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    full_name: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: {
    full_name: string;
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

export default function PostStatsModal({ postId, isOpen, onClose }: PostStatsModalProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && postId) {
      fetchStats();
    }
  }, [isOpen, postId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch visitors (views)
      const { data: viewsData } = await supabase
        .from('post_views')
        .select(`
          id,
          user_id,
          viewed_at,
          profiles:user_id (
            full_name,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('viewed_at', { ascending: false })
        .limit(50);

      // Fetch likes
      const { data: likesData } = await supabase
        .from('post_likes')
        .select(`
          id,
          user_id,
          created_at,
          profiles:user_id (
            full_name,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          content,
          created_at,
          profiles:user_id (
            full_name,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      setVisitors(viewsData?.map(v => ({
        ...v,
        profile: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles
      })) || []);

      setLikes(likesData?.map(l => ({
        ...l,
        profile: Array.isArray(l.profiles) ? l.profiles[0] : l.profiles
      })) || []);

      setComments(commentsData?.map(c => ({
        ...c,
        profile: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      })) || []);
    } catch (error) {
      console.error('Error fetching post stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const UserItem = ({ user, timestamp, subtitle }: { 
    user: any; 
    timestamp: string;
    subtitle?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors"
      onClick={() => {
        navigate(`/profile/${user.user_id}`);
        onClose();
      }}
    >
      <Avatar className="w-10 h-10 border-2 border-primary/20">
        <AvatarImage src={user.profile?.avatar_url} />
        <AvatarFallback>
          {user.profile?.display_name?.charAt(0) || 
           user.profile?.full_name?.charAt(0) || 
           'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {user.profile?.display_name || user.profile?.full_name}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Post Statistics</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="visitors" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visitors" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Visitors</span>
              <span className="text-xs">({visitors.length})</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Likes</span>
              <span className="text-xs">({likes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Comments</span>
              <span className="text-xs">({comments.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="visitors" className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visitors.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No visitors yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {visitors.map((visitor) => (
                    <UserItem
                      key={visitor.id}
                      user={visitor}
                      timestamp={visitor.viewed_at}
                      subtitle={`@${visitor.profile?.username || 'user'}`}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : likes.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No likes yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {likes.map((like) => (
                    <UserItem
                      key={like.id}
                      user={like}
                      timestamp={like.created_at}
                      subtitle={`@${like.profile?.username || 'user'}`}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-full animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 hover:bg-accent/50 rounded-lg transition-colors"
                    >
                      <div 
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => {
                          navigate(`/profile/${comment.user_id}`);
                          onClose();
                        }}
                      >
                        <Avatar className="w-8 h-8 border-2 border-primary/20">
                          <AvatarImage src={comment.profile?.avatar_url} />
                          <AvatarFallback>
                            {comment.profile?.display_name?.charAt(0) || 
                             comment.profile?.full_name?.charAt(0) || 
                             'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {comment.profile?.display_name || comment.profile?.full_name}
                          </p>
                          <p className="text-sm text-foreground mt-1">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
