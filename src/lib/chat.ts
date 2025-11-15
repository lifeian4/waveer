import { supabase } from './supabase';

// Types
export interface Profile {
  id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  email?: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  edited_at?: string;
  deleted_at?: string;
  created_at: string;
  sender?: Profile;
  reply_to?: Message;
  reactions?: MessageReaction[];
  read_by?: MessageReadReceipt[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: Profile;
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  user?: Profile;
}

export interface TypingIndicator {
  id: string;
  conversation_id: string;
  user_id: string;
  started_at: string;
  user?: Profile;
}

export interface Story {
  id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  background_color: string;
  expires_at: string;
  created_at: string;
  user?: Profile;
  views?: StoryView[];
  view_count?: number;
  has_viewed?: boolean;
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: Profile;
}

// =============================================
// CONVERSATION FUNCTIONS
// =============================================

// Get user's conversations
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    console.log('Fetching conversations for user:', userId);

    // First get conversations where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (participantError) {
      console.error('Error fetching participant data:', participantError);
      throw participantError;
    }

    if (!participantData || participantData.length === 0) {
      console.log('No conversations found for user');
      return [];
    }

    const conversationIds = participantData.map(p => p.conversation_id);
    console.log('Found conversation IDs:', conversationIds);

    // Get conversations with participants
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(id, full_name, display_name, avatar_url, username, email)
        )
      `)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      throw conversationsError;
    }

    console.log('Fetched conversations:', conversations);

    return (conversations || []).map(conv => ({
      ...conv,
      participants: conv.participants?.map((p: any) => ({
        ...p,
        profile: p.profile
      }))
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

// Create or get direct conversation
export const createDirectConversation = async (userId: string, otherUserId: string): Promise<string | null> => {
  try {
    // First check if conversation already exists
    const { data: existingConv, error: checkError } = await supabase
      .from('conversations')
      .select(`
        id,
        participants:conversation_participants(user_id)
      `)
      .eq('type', 'direct');

    if (!checkError && existingConv) {
      // Find existing conversation between these two users
      for (const conv of existingConv) {
        const participantIds = conv.participants?.map((p: any) => p.user_id) || [];
        if (participantIds.includes(userId) && participantIds.includes(otherUserId) && participantIds.length === 2) {
          return conv.id;
        }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'direct',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (convError) throw convError;

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        {
          conversation_id: newConv.id,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString()
        },
        {
          conversation_id: newConv.id,
          user_id: otherUserId,
          role: 'member',
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString()
        }
      ]);

    if (participantsError) throw participantsError;

    return newConv.id;
  } catch (error) {
    console.error('Error creating direct conversation:', error);
    return null;
  }
};

// Get conversation details
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          profile:profiles(id, full_name, display_name, avatar_url, username)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    return {
      ...data,
      participants: data.participants?.map((p: any) => ({
        ...p,
        profile: p.profile
      }))
    };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }
};

// =============================================
// MESSAGE FUNCTIONS
// =============================================

// Get messages for a conversation
export const getMessages = async (conversationId: string, limit = 50): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, display_name, avatar_url, username),
        reply_to:messages!messages_reply_to_id_fkey(
          id, content, sender_id,
          sender:profiles!messages_sender_id_fkey(full_name, display_name)
        ),
        reactions:message_reactions(
          id, emoji, user_id,
          user:profiles(full_name, display_name, avatar_url)
        ),
        read_by:message_read_receipts(
          id, user_id, read_at,
          user:profiles(full_name, display_name, avatar_url)
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).reverse();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  replyToId?: string
): Promise<Message | null> => {
  try {
    console.log('Attempting to send message:', {
      conversationId,
      senderId,
      content,
      messageType
    });

    // First, insert the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        reply_to_id: replyToId,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Message insert error:', messageError);
      throw messageError;
    }

    console.log('Message inserted successfully:', messageData);

    // Get sender profile separately
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url, username, email')
      .eq('id', senderId)
      .single();

    if (profileError) {
      console.warn('Could not fetch sender profile:', profileError);
    }

    // Update conversation last_message_at
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.warn('Could not update conversation timestamp:', updateError);
    }

    // Return message with sender profile
    const result: Message = {
      ...messageData,
      sender: senderProfile || undefined
    };

    console.log('Message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  try {
    await supabase
      .from('message_read_receipts')
      .upsert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

// =============================================
// TYPING INDICATOR FUNCTIONS
// =============================================

// Start typing
export const startTyping = async (conversationId: string, userId: string): Promise<void> => {
  try {
    await supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        started_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error starting typing:', error);
  }
};

// Stop typing
export const stopTyping = async (conversationId: string, userId: string): Promise<void> => {
  try {
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error stopping typing:', error);
  }
};

// Get typing users
export const getTypingUsers = async (conversationId: string): Promise<TypingIndicator[]> => {
  try {
    const { data, error } = await supabase
      .from('typing_indicators')
      .select(`
        *,
        user:profiles(id, full_name, display_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .gte('started_at', new Date(Date.now() - 10000).toISOString()); // Last 10 seconds

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching typing users:', error);
    return [];
  }
};

// =============================================
// STORY FUNCTIONS
// =============================================

// Get stories from followed users and own stories
export const getStories = async (userId: string): Promise<Story[]> => {
  try {
    // Get list of followed users
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followedUserIds = followData?.map(f => f.following_id) || [];
    // Include own user ID to see own stories
    const userIdsToFetch = [userId, ...followedUserIds];

    // Calculate expiry time (24 hours ago)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - 24);

    // Fetch image stories
    const { data: imageStories } = await supabase
      .from('user_stories_images')
      .select(`
        id,
        user_id,
        storage_url,
        title,
        views_count,
        created_at,
        profiles:user_id (id, full_name, display_name, avatar_url, username)
      `)
      .in('user_id', userIdsToFetch)
      .gte('created_at', expiryTime.toISOString())
      .order('created_at', { ascending: false });

    // Fetch video stories
    const { data: videoStories } = await supabase
      .from('user_stories_videos')
      .select(`
        id,
        user_id,
        storage_url,
        title,
        views_count,
        created_at,
        profiles:user_id (id, full_name, display_name, avatar_url, username)
      `)
      .in('user_id', userIdsToFetch)
      .gte('created_at', expiryTime.toISOString())
      .order('created_at', { ascending: false});

    // Combine and format stories
    const allStories: Story[] = [];

    // Add image stories
    if (imageStories) {
      imageStories.forEach(story => {
        allStories.push({
          id: story.id,
          user_id: story.user_id,
          content: story.title || undefined,
          media_url: story.storage_url,
          media_type: 'image',
          background_color: '#000000',
          expires_at: new Date(new Date(story.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: story.created_at,
          user: Array.isArray(story.profiles) ? story.profiles[0] : story.profiles,
          view_count: story.views_count || 0,
          has_viewed: false // Will be updated below
        });
      });
    }

    // Add video stories
    if (videoStories) {
      videoStories.forEach(story => {
        allStories.push({
          id: story.id,
          user_id: story.user_id,
          content: story.title || undefined,
          media_url: story.storage_url,
          media_type: 'video',
          background_color: '#000000',
          expires_at: new Date(new Date(story.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: story.created_at,
          user: Array.isArray(story.profiles) ? story.profiles[0] : story.profiles,
          view_count: story.views_count || 0,
          has_viewed: false
        });
      });
    }

    // Sort by created_at (newest first)
    allStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // TODO: Check which stories user has viewed
    // This would require a story_views table

    return allStories;
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
};

// Create a story
export const createStory = async (
  userId: string,
  content?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  backgroundColor = '#000000'
): Promise<Story | null> => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        background_color: backgroundColor
      })
      .select(`
        *,
        user:profiles(id, full_name, display_name, avatar_url, username)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating story:', error);
    return null;
  }
};

// View a story
export const viewStory = async (storyId: string, viewerId: string): Promise<void> => {
  try {
    await supabase
      .from('story_views')
      .upsert({
        story_id: storyId,
        viewer_id: viewerId
      });
  } catch (error) {
    console.error('Error viewing story:', error);
  }
};

// =============================================
// USER SEARCH FUNCTIONS
// =============================================

// Search users by username, email, or phone
export const searchUsers = async (query: string, currentUserId: string): Promise<Profile[]> => {
  try {
    if (!query.trim()) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, username, avatar_url, email')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', currentUserId) // Exclude current user
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Get conversation name for display
export const getConversationName = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.type === 'group') {
    return conversation.name || 'Group Chat';
  }
  
  // For direct messages, show the other participant's name
  const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
  return otherParticipant?.profile?.display_name || 
         otherParticipant?.profile?.full_name || 
         'Unknown User';
};

// Get conversation avatar
export const getConversationAvatar = (conversation: Conversation, currentUserId: string): string | undefined => {
  if (conversation.type === 'group') {
    return conversation.avatar_url;
  }
  
  // For direct messages, show the other participant's avatar
  const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
  return otherParticipant?.profile?.avatar_url;
};

// Format message time
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};
