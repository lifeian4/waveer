import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Trash2,
  CheckCheck,
  Check,
  Plus,
  Search,
  Eye,
  Video,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { formatDistanceToNow } from "date-fns";
import type { Story } from "@/lib/chat";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name: string;
    display_name: string;
    avatar_url: string;
  } | {
    id: string;
    full_name: string;
    display_name: string;
    avatar_url: string;
  }[];
}

interface UserProfile {
  id: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  email: string;
}

interface Conversation {
  user_id: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_sender: boolean;
}

const ChatWithStories = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Stories
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  
  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      loadStories();
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && userId) {
      initializeChat();
    }
  }, [currentUser, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentUser && userId) {
      // Subscribe to new messages
      const channel = supabase
        .channel(`direct-messages-${currentUser.id}-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${currentUser.id}`,
          },
          (payload) => {
            if (payload.new.sender_id === userId) {
              loadMessages();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadStories = async () => {
    if (!currentUser) return;

    try {
      // Use the new getStories function from chat.ts
      const { getStories } = await import('@/lib/chat');
      const allStories = await getStories(currentUser.id);
      
      // Separate my stories from others
      const myStoriesData = allStories.filter(s => s.user_id === currentUser.id);
      const otherStories = allStories.filter(s => s.user_id !== currentUser.id);
      
      setMyStories(myStoriesData);
      setStories(otherStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const loadConversations = async () => {
    if (!currentUser) return;

    try {
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      const conversationMap = new Map<string, Conversation>();

      for (const msg of messages || []) {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(otherUserId)) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (profile) {
            const { count: unreadCount } = await supabase
              .from('direct_messages')
              .select('*', { count: 'exact', head: true })
              .eq('sender_id', otherUserId)
              .eq('receiver_id', currentUser.id)
              .eq('is_read', false);

            conversationMap.set(otherUserId, {
              user_id: profile.id,
              full_name: profile.full_name,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: unreadCount || 0,
              is_sender: msg.sender_id === currentUser.id,
            });
          }
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url, email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setOtherUser(userData);
      
      await loadMessages();
      await markMessagesAsRead();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          sender:profiles!sender_id(id, full_name, display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${currentUser!.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser!.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform data to handle sender array from Supabase join
      const transformedMessages = data ? data.map((msg: any) => ({
        ...msg,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      })) : [];
      
      setMessages(transformedMessages as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUser!.id)
        .eq('sender_id', userId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('direct_messages').insert({
        sender_id: currentUser!.id,
        receiver_id: userId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      await loadMessages();
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', currentUser!.id);
      
      await loadMessages();
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const viewStory = (story: Story) => {
    navigate(`/story/${story.id}`);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  if (loading && userId) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-16 h-screen flex">
          {/* Left Sidebar - Conversations */}
          <div className="w-80 border-r border-border flex flex-col">
            {/* Stories Section */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold mb-3">Stories</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {/* My Story */}
                <div
                  onClick={() => navigate('/create-story')}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-dashed border-primary">
                      <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {currentUser?.user_metadata?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                      <Plus className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-center mt-1 font-medium">Your Story</p>
                  {myStories.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground">{myStories.length}</p>
                  )}
                </div>

                {/* Other Stories */}
                {Object.entries(groupedStories).map(([userId, userStories]) => {
                  const story = userStories[0];
                  return (
                    <div
                      key={userId}
                      onClick={() => viewStory(story)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-primary ring-2 ring-background">
                          <AvatarImage src={story.user?.avatar_url} />
                          <AvatarFallback>
                            {story.user?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {userStories.length > 1 && (
                          <Badge className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {userStories.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-center mt-1 truncate w-16">
                        {story.user?.display_name || story.user?.full_name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.user_id}
                      onClick={() => navigate(`/chat/${conversation.user_id}`)}
                      className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                        userId === conversation.user_id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.avatar_url} />
                          <AvatarFallback>
                            {conversation.display_name?.charAt(0) || conversation.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate">
                              {conversation.display_name || conversation.full_name}
                            </h4>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(conversation.last_message_time), {
                                addSuffix: false,
                              })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm truncate ${
                                conversation.unread_count > 0
                                  ? 'font-semibold text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {conversation.is_sender && (
                                <Send className="w-3 h-3 inline mr-1" />
                              )}
                              {conversation.last_message}
                            </p>

                            {conversation.unread_count > 0 && (
                              <Badge className="ml-2 h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex-shrink-0">
                                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right - Chat Area */}
          <div className="flex-1 flex flex-col">
            {userId && otherUser ? (
              <>
                {/* Chat Header */}
                <div className="bg-card border-b border-border p-4 flex items-center gap-3">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/profile/${userId}`)}
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarImage src={otherUser.avatar_url} />
                      <AvatarFallback>
                        {otherUser.display_name?.charAt(0) || otherUser.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {otherUser.display_name || otherUser.full_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {otherUser.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Call Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary/10"
                      onClick={async () => {
                        const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        // Create call invitation
                        await supabase.from('call_invitations').insert({
                          call_id: callId,
                          caller_id: currentUser!.id,
                          receiver_id: userId,
                          call_type: 'audio',
                          status: 'pending',
                        });
                        
                        navigate(`/audio-call/${callId}?userId=${userId}&userName=${otherUser.display_name || otherUser.full_name}&caller=true`);
                      }}
                      title="Audio Call"
                    >
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary/10"
                      onClick={async () => {
                        const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        // Create call invitation
                        await supabase.from('call_invitations').insert({
                          call_id: callId,
                          caller_id: currentUser!.id,
                          receiver_id: userId,
                          call_type: 'video',
                          status: 'pending',
                        });
                        
                        navigate(`/video-call/${callId}?userId=${userId}&userName=${otherUser.display_name || otherUser.full_name}&caller=true`);
                      }}
                      title="Video Call"
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <p className="text-lg mb-2">No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message) => {
                        const isOwn = message.sender_id === currentUser!.id;
                        // Handle sender being array or single object
                        const sender = message.sender 
                          ? (Array.isArray(message.sender) ? message.sender[0] : message.sender)
                          : null;
                        const senderProfile = sender || otherUser;

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isOwn && (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={senderProfile?.avatar_url} />
                                <AvatarFallback>
                                  {senderProfile?.display_name?.charAt(0) || senderProfile?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                              <div className="relative group">
                                <div
                                  className={`px-4 py-2 rounded-2xl ${
                                    isOwn
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm break-words">{message.content}</p>
                                </div>

                                {isOwn && (
                                  <div className="absolute top-0 left-0 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 px-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => deleteMessage(message.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                                {isOwn && (
                                  message.is_read ? (
                                    <CheckCheck className="w-3 h-3 text-blue-500" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 bg-card border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      size="icon"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ChatWithStories;
