import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  Clock,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  caption: string;
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

const PostDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (id && currentUser) {
      fetchPost();
      fetchComments();
      trackView();
    }
  }, [id, currentUser]);

  const trackView = async () => {
    if (!id || !currentUser) return;

    try {
      // Check if user already viewed this post
      const { data: existingView } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', currentUser.id)
        .single();

      if (!existingView) {
        // Insert new view
        await supabase
          .from('post_views')
          .insert({
            post_id: id,
            user_id: currentUser.id,
            viewed_at: new Date().toISOString()
          });

        // Increment views count
        await supabase.rpc('increment_post_views', { post_id: id });
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchPost = async () => {
    try {
      if (!id || !currentUser) return;

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          media_url,
          media_type,
          video_duration,
          likes_count,
          comments_count,
          views_count,
          created_at
        `)
        .eq('id', id)
        .single();

      if (postError) throw postError;

      if (!postData) {
        toast.error('Post not found');
        navigate('/shows');
        return;
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, username, avatar_url')
        .eq('id', postData.user_id)
        .single();

      // Check if user liked this post
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', id)
        .eq('user_id', currentUser.id)
        .single();

      setPost({
        ...postData,
        profile: profileData || {
          id: postData.user_id,
          full_name: 'Unknown User',
          display_name: 'Unknown',
          username: 'unknown',
          avatar_url: '',
        },
        is_liked: !!likeData,
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/shows');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      if (!id) return;

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
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      setComments(commentsData?.map(c => ({
        ...c,
        profile: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      })) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !post) return;

    try {
      if (post.is_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        await supabase.rpc('decrement_post_likes', { post_id: post.id });

        setPost({ ...post, is_liked: false, likes_count: post.likes_count - 1 });
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: currentUser.id });

        await supabase.rpc('increment_post_likes', { post_id: post.id });

        setPost({ ...post, is_liked: true, likes_count: post.likes_count + 1 });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser || !post) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUser.id,
          post_id: post.id,
          content: newComment.trim(),
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Increment comments count
      await supabase.rpc('increment_post_comments', { post_id: post.id });

      setNewComment('');
      fetchComments();
      setPost({ ...post, comments_count: post.comments_count + 1 });
      toast.success('Comment posted!');
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast.error(error?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <PageWrapper>
          <div className="min-h-screen bg-background py-8 px-4 pt-24 md:pt-28">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/4"></div>
                <div className="h-96 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <Navigation />
      <PageWrapper>
        <div className="min-h-screen bg-background py-8 px-4 pt-24 md:pt-28">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate('/shows')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Button>

            {/* Post Card */}
            <Card className="overflow-hidden mb-8">
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
              </div>

              {/* Post Media */}
              <div className="relative bg-black">
                {post.media_type === 'image' ? (
                  <img
                    src={post.media_url}
                    alt={post.caption}
                    className="w-full max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={post.media_url}
                      className="w-full max-h-[600px]"
                      loop
                      playsInline
                      muted={isMuted}
                      autoPlay={isPlaying}
                      onClick={() => setIsPlaying(!isPlaying)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full w-16 h-16"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </Button>
                    </div>
                    {post.video_duration && (
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">
                          {formatDuration(post.video_duration)}
                        </span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-4 right-4 rounded-full"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className="gap-2"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        post.is_liked ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    <span>{post.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views_count}</span>
                  </Button>
                </div>

                {/* Caption */}
                <div>
                  <p className="text-sm">
                    <span 
                      className="font-semibold mr-2 cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
                      {post.profile.display_name || post.profile.full_name}
                    </span>
                    {post.caption}
                  </p>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Comments ({comments.length})
              </h2>

              {/* Add Comment */}
              {currentUser && (
                <div className="mb-6">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] mb-3"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handlePostComment} 
                      disabled={submitting || !newComment.trim()}
                    >
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-4 bg-accent/20 rounded-lg"
                  >
                    <Avatar 
                      className="w-10 h-10 cursor-pointer"
                      onClick={() => navigate(`/profile/${comment.user_id}`)}
                    >
                      <AvatarImage src={comment.profile?.avatar_url} />
                      <AvatarFallback>
                        {comment.profile?.display_name?.charAt(0) || 
                         comment.profile?.full_name?.charAt(0) || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/profile/${comment.user_id}`)}
                        >
                          {comment.profile?.display_name || comment.profile?.full_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </motion.div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        <Footer />
      </PageWrapper>
    </>
  );
};

export default PostDetails;
