import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Bell, UserPlus, UserCheck, X, Check, Film, Tv, Star, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { formatDistanceToNow } from "date-fns";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  type Notification,
  type FollowRequest
} from "@/lib/notifications";


const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'follow_requests' | 'releases'>('all');

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      try {
        console.log("Fetching notifications data for user:", currentUser.id);
        
        const [notificationsData, followRequestsData, unreadCountData] = await Promise.all([
          getUserNotifications(currentUser.id),
          getFollowRequests(currentUser.id),
          getUnreadCount(currentUser.id)
        ]);
        
        console.log("Notifications data:", notificationsData);
        console.log("Follow requests data:", followRequestsData);
        console.log("Unread count:", unreadCountData);
        
        setNotifications(notificationsData);
        setFollowRequests(followRequestsData);
        setUnreadCount(unreadCountData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await markAllAsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleFollowAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      console.log(`${action}ing follow request:`, requestId);
      
      if (action === 'accept') {
        await acceptFollowRequest(requestId);
      } else {
        await rejectFollowRequest(requestId);
      }
      
      // Remove the request from the list
      setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Refresh notifications
      const notificationsData = await getUserNotifications(currentUser!.id);
      setNotifications(notificationsData);
      
      console.log(`Follow request ${action}ed successfully`);
    } catch (err) {
      console.error(`Error ${action}ing follow request:`, err);
    }
  };

  // Debug function to check if there are any follows in the database
  const debugFollows = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', currentUser.id);
      
      console.log('All follows for current user:', { data, error });
    } catch (err) {
      console.error('Error debugging follows:', err);
    }
  };

  // Call debug function on mount
  useEffect(() => {
    if (currentUser) {
      debugFollows();
    }
  }, [currentUser]);

  const getIcon = (type: string) => {
    switch (type) {
      case "follow_request":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "follow_accepted":
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case "movie_release":
        return <Film className="w-5 h-5 text-purple-500" />;
      case "tv_release":
        return <Tv className="w-5 h-5 text-orange-500" />;
      case "system":
        return <Bell className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'follow_requests') return notification.type === 'follow_request';
    if (activeTab === 'releases') return ['movie_release', 'tv_release'].includes(notification.type);
    return true;
  });

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 mt-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
          >
            {[
              { id: 'all', label: 'All', icon: Bell },
              { id: 'follow_requests', label: 'Follow Requests', icon: Users },
              { id: 'releases', label: 'New Releases', icon: Star }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'follow_requests' && followRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {followRequests.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Follow Requests Section */}
              {activeTab === 'follow_requests' && (
                <div className="space-y-4">
                  {followRequests.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No follow requests</p>
                    </div>
                  ) : (
                    followRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarImage src={request.follower?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {request.follower?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {request.follower?.full_name || "Anonymous User"}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {request.follower?.bio || "Wants to follow you"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleFollowAction(request.id, "accept")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFollowAction(request.id, "reject")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* All Notifications */}
              {(activeTab === 'all' || activeTab === 'releases') && (
                <div className="space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl">
                      <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {activeTab === 'releases' ? 'No release notifications' : 'No notifications'}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start gap-4 p-4 border rounded-xl transition-all hover:bg-muted/50 ${
                          !notification.read ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        
                        {notification.from_user && (
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={notification.from_user.avatar_url} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {notification.from_user.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                              >
                                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                          
                          {/* Movie/TV Release Data */}
                          {notification.data && (notification.type === 'movie_release' || notification.type === 'tv_release') && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                {notification.type === 'movie_release' ? (
                                  <Film className="w-4 h-4 text-purple-500" />
                                ) : (
                                  <Tv className="w-4 h-4 text-orange-500" />
                                )}
                                <span className="font-medium text-sm">
                                  {notification.data.title || notification.data.name}
                                </span>
                                {notification.data.vote_average && (
                                  <div className="flex items-center gap-1 ml-auto">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs">{notification.data.vote_average.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default NotificationsPage;