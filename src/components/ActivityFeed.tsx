import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Film, Tv, MessageSquare, Star, Heart, Share2, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  user_id: string;
  activity_type: 'watched' | 'rated' | 'commented' | 'shared' | 'added_to_list';
  media_id: string;
  media_type: 'movie' | 'series';
  media_title: string;
  media_poster: string;
  rating?: number;
  comment?: string;
  created_at: string;
  user_profile?: {
    username: string;
    avatar_url: string;
  };
}

interface ActivityFeedProps {
  userId?: string; // If provided, show only this user's activities
  showFollowingOnly?: boolean; // Show only activities from followed users
}

export default function ActivityFeed({ userId, showFollowingOnly = false }: ActivityFeedProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId, showFollowingOnly, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_activities')
        .select(`
          *,
          user_profile:profiles(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (userId) {
        // Show specific user's activities
        query = query.eq('user_id', userId);
      } else if (showFollowingOnly && user) {
        // Show activities from followed users
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = following?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          setActivities([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length < 20) {
        setHasMore(false);
      }

      setActivities(prev => page === 1 ? data || [] : [...prev, ...(data || [])]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watched':
        return <Play className="w-5 h-5 text-green-500" />;
      case 'rated':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'commented':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'shared':
        return <Share2 className="w-5 h-5 text-purple-500" />;
      case 'added_to_list':
        return <Heart className="w-5 h-5 text-red-500" />;
      default:
        return <Film className="w-5 h-5" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'watched':
        return 'watched';
      case 'rated':
        return `rated ${activity.rating}/10`;
      case 'commented':
        return 'commented on';
      case 'shared':
        return 'shared';
      case 'added_to_list':
        return 'added to their list';
      default:
        return 'interacted with';
    }
  };

  const handleMediaClick = (activity: Activity) => {
    const path = activity.media_type === 'movie' 
      ? `/movies/${activity.media_id}` 
      : `/series/${activity.media_id}`;
    navigate(path);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
          <p className="text-muted-foreground">
            {showFollowingOnly 
              ? "Follow users to see their activity here" 
              : "Start watching movies and shows to build your activity feed"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* User Avatar */}
              <img
                src={activity.user_profile?.avatar_url || '/default-avatar.png'}
                alt={activity.user_profile?.username}
                className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => handleUserClick(activity.user_id)}
              />

              <div className="flex-1 min-w-0">
                {/* Activity Header */}
                <div className="flex items-start gap-2 mb-2">
                  {getActivityIcon(activity.activity_type)}
                  <div className="flex-1">
                    <p className="text-sm">
                      <span 
                        className="font-semibold hover:underline cursor-pointer"
                        onClick={() => handleUserClick(activity.user_id)}
                      >
                        {activity.user_profile?.username}
                      </span>
                      {' '}
                      <span className="text-muted-foreground">
                        {getActivityText(activity)}
                      </span>
                      {' '}
                      <span 
                        className="font-semibold hover:underline cursor-pointer"
                        onClick={() => handleMediaClick(activity)}
                      >
                        {activity.media_title}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Activity Content */}
                {activity.comment && (
                  <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                    <p className="text-sm">{activity.comment}</p>
                  </div>
                )}

                {/* Media Card */}
                <div 
                  className="flex gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleMediaClick(activity)}
                >
                  {activity.media_poster && (
                    <img
                      src={activity.media_poster}
                      alt={activity.media_title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{activity.media_title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.media_type === 'movie' ? (
                        <Film className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Tv className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {activity.media_type}
                      </span>
                    </div>
                    {activity.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-semibold">{activity.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-4">
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
