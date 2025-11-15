import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Heart,
  Reply,
  Trash2,
  CheckCheck,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  reply_to_id: string | null;
  is_read: boolean;
  is_deleted_for_everyone: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    display_name: string;
    avatar_url: string;
  };
  reactions: Array<{
    id: string;
    user_id: string;
    reaction_type: string;
  }>;
  reply_to?: {
    id: string;
    content: string;
    sender_id: string;
  };
}

const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!currentUser) {
      setError('You must be logged in to use chat');
      setLoading(false);
      return;
    }
    
    if (!userId) {
      setError('No user selected for chat');
      setLoading(false);
      return;
    }
    
    if (currentUser && userId) {
      initializeChat();
    }
  }, [currentUser, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (conversationId) {
      const unsubMessages = subscribeToMessages();
      const unsubTyping = subscribeToTyping();
      markAsOnline();

      return () => {
        if (unsubMessages) unsubMessages();
        if (unsubTyping) unsubTyping();
        markAsOffline();
      };
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Initializing chat with userId:', userId);
      
      // First, load the other user info
      await loadOtherUser();
      
      // Try to get or create conversation using direct database queries
      let convId = await getOrCreateConversation();
      
      if (!convId) {
        throw new Error('Failed to create or find conversation');
      }

      console.log('Conversation ID:', convId);
      setConversationId(convId);
      
      // Load messages
      await loadMessages(convId);
      
      // Mark messages as read
      await markMessagesAsRead(convId);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const getOrCreateConversation = async (): Promise<string | null> => {
    try {
      // First, check if a conversation already exists between these two users
      const { data: existingParticipants, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser!.id);

      if (participantError) {
        console.error('Error checking participants:', participantError);
        throw participantError;
      }

      if (existingParticipants && existingParticipants.length > 0) {
        // Check each conversation to see if the other user is also a participant
        for (const participant of existingParticipants) {
          const { data: otherParticipant, error: otherError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', userId)
            .maybeSingle();

          if (!otherError && otherParticipant) {
            console.log('Found existing conversation:', participant.conversation_id);
            return participant.conversation_id;
          }
        }
      }

      // No existing conversation found, create a new one
      console.log('Creating new conversation');
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();

      if (convError || !newConversation) {
        console.error('Error creating conversation:', convError);
        throw convError || new Error('Failed to create conversation');
      }

      // Add both participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: currentUser!.id },
          { conversation_id: newConversation.id, user_id: userId },
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        throw participantsError;
      }

      console.log('Created new conversation:', newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  };

  const loadMessages = async (convId: string) => {
    console.log('Loading messages for conversation:', convId);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, display_name, avatar_url),
        reply_to:messages!reply_to_id(id, content, sender_id),
        reactions:message_reactions(id, user_id, reaction_type)
      `)
      .eq('conversation_id', convId)
      .eq('is_deleted_for_everyone', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      console.log('Loaded messages:', data?.length || 0);
      setMessages(data || []);
    }
  };

  const loadOtherUser = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setOtherUser(data);
    }

    // Load participant status
    if (conversationId) {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('is_online, is_typing, last_seen_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();

      if (participant) {
        setIsOnline(participant.is_online);
        setIsTyping(participant.is_typing);
        setLastSeen(participant.last_seen_at);
      }
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            await loadMessages(conversationId!);
            if (payload.new && payload.new.sender_id !== currentUser!.id) {
              await markMessagesAsRead(conversationId!);
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = () => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new.user_id !== currentUser!.id) {
            setIsTyping(payload.new.is_typing);
            setIsOnline(payload.new.is_online);
            setLastSeen(payload.new.last_seen_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async (convId: string) => {
    try {
      // Update messages to mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUser!.id)
        .eq('is_read', false);

      // Update participant last_read_at
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('user_id', currentUser!.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markAsOnline = async () => {
    try {
      await supabase
        .from('conversation_participants')
        .update({ is_online: true })
        .eq('user_id', currentUser!.id);
    } catch (error) {
      console.error('Error marking as online:', error);
    }
  };

  const markAsOffline = async () => {
    try {
      await supabase
        .from('conversation_participants')
        .update({ 
          is_online: false,
          last_seen_at: new Date().toISOString()
        })
        .eq('user_id', currentUser!.id);
    } catch (error) {
      console.error('Error marking as offline:', error);
    }
  };

  const handleTyping = () => {
    if (!conversationId) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    supabase
      .from('conversation_participants')
      .update({ is_typing: true })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUser!.id)
      .then(() => {});

    typingTimeoutRef.current = setTimeout(() => {
      supabase
        .from('conversation_participants')
        .update({ is_typing: false })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser!.id)
        .then(() => {});
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser!.id,
        content: newMessage.trim(),
        reply_to_id: replyingTo?.id || null,
      });

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);

      await supabase
        .from('conversation_participants')
        .update({ is_typing: false })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser!.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    try {
      if (forEveryone) {
        await supabase
          .from('messages')
          .update({ 
            is_deleted_for_everyone: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', messageId);
      } else {
        await supabase
          .from('messages')
          .update({ is_deleted_for_sender: true })
          .eq('id', messageId);
      }
      
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const likeMessage = async (messageId: string) => {
    try {
      const existing = messages
        .find((m) => m.id === messageId)
        ?.reactions.find((r) => r.user_id === currentUser!.id);

      if (existing) {
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: currentUser!.id,
          reaction_type: 'like',
        });
      }

      await loadMessages(conversationId!);
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };

  const getStatusText = () => {
    if (isOnline) return "Online";
    if (lastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
    }
    return "Offline";
  };

  if (loading) {
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

  if (error) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 mb-4">
              <X className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Error Loading Chat</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate(-1)} variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-16 h-screen flex flex-col">
          {/* Chat Header */}
          <div className="bg-card border-b border-border p-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => navigate(`/profile/${userId}`)}
            >
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={otherUser?.avatar_url} />
                  <AvatarFallback>
                    {otherUser?.display_name?.charAt(0) || otherUser?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {otherUser?.display_name || otherUser?.full_name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isTyping ? (
                    <span className="flex items-center gap-1">
                      <span>typing</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </span>
                  ) : (
                    getStatusText()
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUser!.id;
                const hasLiked = message.reactions.some((r) => r.user_id === currentUser!.id);

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
                        <AvatarImage src={message.sender.avatar_url} />
                        <AvatarFallback>
                          {message.sender.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Reply Preview */}
                      {message.reply_to && (
                        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-t-lg mb-1">
                          <Reply className="w-3 h-3 inline mr-1" />
                          {message.reply_to.content.substring(0, 50)}...
                        </div>
                      )}

                      {/* Message Bubble */}
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

                        {/* Message Actions */}
                        <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 px-2`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setReplyingTo(message)}
                          >
                            <Reply className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => likeMessage(message.id)}
                          >
                            <Heart className={`w-3 h-3 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                          {isOwn && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => deleteMessage(message.id, false)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete for me
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteMessage(message.id, true)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete for everyone
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions.length > 0 && (
                          <div className="absolute -bottom-2 right-2 bg-card border border-border rounded-full px-2 py-0.5 flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                            <span className="text-xs">{message.reactions.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Message Info */}
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
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyingTo && (
            <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Replying to: {replyingTo.content.substring(0, 50)}...
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 bg-card border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
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
        </div>
      </div>
    </PageWrapper>
  );
};

export default Chat;
