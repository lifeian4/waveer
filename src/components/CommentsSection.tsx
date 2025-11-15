import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  user_id: string;
  media_id: string;
  media_type: 'movie' | 'series';
  content: string;
  created_at: string;
  user_profile?: {
    username: string;
    avatar_url: string;
  };
  reactions?: {
    likes: number;
    loved: number;
    fire: number;
    laugh: number;
    sad: number;
  };
  user_reaction?: string | null;
}

interface CommentsSectionProps {
  mediaId: string | number;
  mediaType: 'movie' | 'series';
}

const REACTIONS = [
  { emoji: '❤️', key: 'loved', label: 'Love' },
  { emoji: '😂', key: 'laugh', label: 'Laugh' },
  { emoji: '🔥', key: 'fire', label: 'Fire' },
  { emoji: '😢', key: 'sad', label: 'Sad' },
  { emoji: '👍', key: 'likes', label: 'Like' },
];

export default function CommentsSection({ mediaId, mediaType }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest');

  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [mediaId, sortBy]);

  const fetchComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user_profile:profiles(username, avatar_url),
          reactions:comment_reactions(reaction_type)
        `)
        .eq('media_id', mediaId.toString())
        .eq('media_type', mediaType);

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process reactions count
      const processedComments = data?.map(comment => {
        const reactions = { likes: 0, loved: 0, fire: 0, laugh: 0, sad: 0 };
        comment.reactions?.forEach((r: any) => {
          if (reactions[r.reaction_type as keyof typeof reactions] !== undefined) {
            reactions[r.reaction_type as keyof typeof reactions]++;
          }
        });

        return {
          ...comment,
          reactions,
          user_reaction: comment.reactions?.find((r: any) => r.user_id === user?.id)?.reaction_type || null,
        };
      }) || [];

      if (sortBy === 'top') {
        processedComments.sort((a, b) => {
          const aTotal = Object.values(a.reactions || {}).reduce((sum, val) => sum + val, 0);
          const bTotal = Object.values(b.reactions || {}).reduce((sum, val) => sum + val, 0);
          return bTotal - aTotal;
        });
      }

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`comments:${mediaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `media_id=eq.${mediaId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        media_id: mediaId.toString(),
        media_type: mediaType,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;

    try {
      const comment = comments.find(c => c.id === commentId);
      const hasReacted = comment?.user_reaction === reactionType;

      if (hasReacted) {
        // Remove reaction
        await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Add or update reaction
        await supabase.from('comment_reactions').upsert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        });
      }

      fetchComments();
    } catch (error) {
      console.error('Error reacting to comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Comments ({comments.length})
        </h2>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'latest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('latest')}
          >
            Latest
          </Button>
          <Button
            variant={sortBy === 'top' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('top')}
          >
            Top
          </Button>
        </div>
      </div>

      {/* Add Comment */}
      {user && (
        <div className="bg-card rounded-lg p-4 border">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] mb-3"
          />
          <div className="flex justify-end">
            <Button onClick={handlePostComment} disabled={loading || !newComment.trim()}>
              {loading ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-card rounded-lg p-4 border">
            {/* User Info */}
            <div className="flex items-start gap-3 mb-3">
              <img
                src={comment.user_profile?.avatar_url || '/default-avatar.png'}
                alt={comment.user_profile?.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comment.user_profile?.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 text-foreground">{comment.content}</p>
              </div>
              {user?.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Reactions */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
              {REACTIONS.map((reaction) => {
                const count = comment.reactions?.[reaction.key as keyof typeof comment.reactions] || 0;
                const isActive = comment.user_reaction === reaction.key;

                return (
                  <button
                    key={reaction.key}
                    onClick={() => handleReaction(comment.id, reaction.key)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    disabled={!user}
                  >
                    <span>{reaction.emoji}</span>
                    {count > 0 && <span className="text-sm font-medium">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
