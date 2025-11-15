import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Heart,
  Trash2,
  CheckCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { formatDistanceToNow } from "date-fns";

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
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  email: string;
}

const ChatNew = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Load other user info
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url, email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setOtherUser(userData);
      
      // Load messages
      await loadMessages();
      
      // Mark messages as read
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
      setMessages((data as Message[]) || []);
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

  if (!otherUser) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
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
                  const senderProfile = message.sender || otherUser;

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
                          <AvatarImage src={senderProfile.avatar_url} />
                          <AvatarFallback>
                            {senderProfile.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
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
        </div>
      </div>
    </PageWrapper>
  );
};

export default ChatNew;
