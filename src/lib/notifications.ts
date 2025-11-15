import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow_request' | 'follow_accepted' | 'movie_release' | 'tv_release' | 'system';
  title: string;
  message: string;
  data?: any; // JSON data for additional info
  read: boolean;
  created_at: string;
  from_user_id?: string;
  from_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface FollowRequest {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  follower?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

// Get user notifications
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        from_user:profiles!notifications_from_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Get unread notification count
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Get follow requests
export const getFollowRequests = async (userId: string): Promise<FollowRequest[]> => {
  try {
    console.log('Fetching follow requests for user:', userId);
    
    const { data, error } = await supabase
      .from('follows')
      .select(`
        *,
        follower:profiles(
          id,
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq('following_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    console.log('Follow requests query result:', { data, error });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    return [];
  }
};

// Accept follow request
export const acceptFollowRequest = async (followId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .eq('id', followId);

    if (error) throw error;

    // Create notification for the follower
    const { data: followData } = await supabase
      .from('follows')
      .select('follower_id, following_id')
      .eq('id', followId)
      .single();

    if (followData) {
      await createNotification({
        user_id: followData.follower_id,
        type: 'follow_accepted',
        title: 'Follow Request Accepted',
        message: 'Your follow request has been accepted!',
        from_user_id: followData.following_id,
      });
    }
  } catch (error) {
    console.error('Error accepting follow request:', error);
    throw error;
  }
};

// Reject follow request
export const rejectFollowRequest = async (followId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('follows')
      .update({ status: 'rejected' })
      .eq('id', followId);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting follow request:', error);
    throw error;
  }
};

// Send follow request
export const sendFollowRequest = async (followerId: string, followingId: string): Promise<void> => {
  try {
    console.log('Sending follow request:', { followerId, followingId });
    
    // Check if already following or request exists
    const { data: existing, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing follow:', checkError);
      throw new Error(`Failed to check follow status: ${checkError.message}`);
    }

    if (existing) {
      console.log('Follow relationship already exists:', existing);
      throw new Error('Follow request already exists or you are already following this user');
    }

    console.log('Creating follow request...');
    
    // Create follow request
    const { data: insertData, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
        status: 'pending'
      })
      .select();

    if (insertError) {
      console.error('Error inserting follow request:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      throw new Error(`Failed to create follow request: ${insertError.message}`);
    }

    console.log('Follow request created successfully:', insertData);

    // Create notification
    try {
      console.log('Creating notification...');
      await createNotification({
        user_id: followingId,
        type: 'follow_request',
        title: 'New Follow Request',
        message: 'wants to follow you',
        from_user_id: followerId,
      });
      console.log('Notification created successfully');
    } catch (notifError) {
      console.error('Error creating notification (non-fatal):', notifError);
      // Don't throw - notification is optional
    }
  } catch (error: any) {
    console.error('Error sending follow request:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Check if user is following another user
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .eq('status', 'accepted')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

// Create notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        read: false
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create movie/TV release notifications
export const createReleaseNotification = async (
  userIds: string[],
  type: 'movie_release' | 'tv_release',
  title: string,
  message: string,
  data: any
): Promise<void> => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating release notifications:', error);
    throw error;
  }
};
