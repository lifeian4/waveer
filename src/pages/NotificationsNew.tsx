import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Bell, UserPlus, X, Check, Users, ExternalLink, CheckCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface FollowRequest {
  id: string;
  follower_id: string;
  created_at: string;
  follower_profile?: {
    full_name: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface Notification {
  id: string;
  user_id: string;
  type: 'follow_request' | 'like' | 'comment' | 'mention' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

const NotificationsNew = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch follow requests
  const fetchFollowRequests = async () => {
    if (!currentUser) return;

    try {
      // Get pending follows
      const { data: follows, error } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', currentUser.id)
        .eq('status', 'pending');

      if (error || !follows) {
        console.error("Error:", error);
        setFollowRequests([]);
        return;
      }

      // Get profiles for followers
      const followerIds = follows.map(f => f.follower_id);
      if (followerIds.length === 0) {
        setFollowRequests([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url, bio')
        .in('id', followerIds);

      // Combine data
      const requests = follows.map(follow => ({
        ...follow,
        follower_profile: profiles?.find(p => p.id === follow.follower_id)
      }));

      setFollowRequests(requests);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      setFollowRequests([]);
    }
  };

  // Fetch general notifications
  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      // Try to fetch from notifications table first
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
        console.error("Error fetching notifications:", error);
      }

      // If no table or no notifications, create some mock notifications for demo
      if (!dbNotifications || dbNotifications.length === 0) {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            user_id: currentUser.id,
            type: 'like',
            title: 'New Like',
            message: 'Someone liked your post about streaming movies',
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          },
          {
            id: '2',
            user_id: currentUser.id,
            type: 'comment',
            title: 'New Comment',
            message: 'John Doe commented on your movie review',
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          {
            id: '3',
            user_id: currentUser.id,
            type: 'system',
            title: 'Welcome to Liquid Wave Studio!',
            message: 'Discover amazing movies, TV shows, and music all in one place',
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          },
          {
            id: '4',
            user_id: currentUser.id,
            type: 'mention',
            title: 'You were mentioned',
            message: 'Sarah mentioned you in a discussion about The Batman',
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          }
        ];
        setNotifications(mockNotifications);
      } else {
        setNotifications(dbNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Initial data fetch
    Promise.all([
      fetchFollowRequests(),
      fetchNotifications()
    ]).finally(() => setLoading(false));

    // Set up real-time subscription for follow requests
    const followsChannel = supabase
      .channel('follows-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          console.log('New follow request received:', payload);
          // Fetch updated follow requests
          await fetchFollowRequests();
          toast.success('New follow request received!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          console.log('Follow request updated:', payload);
          // Refresh follow requests when status changes
          await fetchFollowRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          console.log('Follow request deleted:', payload);
          // Refresh follow requests when deleted
          await fetchFollowRequests();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(followsChannel);
    };
  }, [currentUser]);

  // Accept follow
  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success("Follow request accepted!");
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  // Reject follow
  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success("Follow request rejected");
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  // Navigate to user profile
  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;

    try {
      // Clear all notifications
      setNotifications([]);
      setFollowRequests([]);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  // Mark individual follow request as read
  const handleMarkAsRead = async (requestId: string) => {
    try {
      // Remove the specific request from the list
      setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  // Mark individual notification as read
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      // Remove the specific notification from the list
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24 md:pt-28">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Follow Requests</h1>
                  <p className="text-muted-foreground mt-1">Manage your follow requests</p>
                </div>
              </div>
              
              {followRequests.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border-primary/30"
                >
                  <CheckCheck className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </motion.div>

            {/* Follow Requests Section */}
            
            {followRequests.length === 0 ? (
              <div className="text-center py-12 border rounded-xl">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No follow requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {followRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleViewProfile(request.follower_id)}
                      title="View profile"
                    >
                      <Avatar className="w-12 h-12 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                        <AvatarImage src={request.follower_profile?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {request.follower_profile?.full_name?.charAt(0) || 
                           request.follower_profile?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 
                          className="font-semibold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleViewProfile(request.follower_id)}
                          title="View profile"
                        >
                          {request.follower_profile?.display_name || 
                           request.follower_profile?.full_name || "Unknown User"}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                          onClick={() => handleViewProfile(request.follower_id)}
                          title="View full profile"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.follower_profile?.bio || "Wants to follow you"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(request.id)}
                        className="text-muted-foreground hover:text-foreground border-muted-foreground/30 hover:border-primary/50"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Read
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default NotificationsNew;
