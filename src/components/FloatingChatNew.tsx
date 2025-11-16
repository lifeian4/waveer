import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  X,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function FloatingChatNew() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // Hide floating chat button on mobile (use top navigation chat icon instead)
  if (isMobile) return null;

  useEffect(() => {
    if (currentUser && isOpen) {
      loadConversations();
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (currentUser) {
      // Subscribe to new messages
      const channel = supabase
        .channel('new-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${currentUser.id}`,
          },
          () => {
            if (isOpen) {
              loadConversations();
            } else {
              // Just update unread count
              updateUnreadCount();
            }
          }
        )
        .subscribe();

      // Initial unread count
      updateUnreadCount();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, isOpen]);

  const updateUnreadCount = async () => {
    if (!currentUser) return;
    
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', currentUser.id)
      .eq('is_read', false);
    
    setTotalUnread(count || 0);
  };

  const loadConversations = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messages || []) {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(otherUserId)) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (profile) {
            // Count unread messages from this user
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

      const conversationsList = Array.from(conversationMap.values());
      setConversations(conversationsList);
      
      // Update total unread
      const total = conversationsList.reduce((sum, conv) => sum + conv.unread_count, 0);
      setTotalUnread(total);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (userId: string) => {
    setIsOpen(false);
    navigate(`/chat/${userId}`);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 relative"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </motion.div>

      {/* Chat Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md h-[600px] p-0 flex flex-col">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>Messages</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="px-4 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a conversation from a user's profile
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => openChat(conversation.user_id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarImage src={conversation.avatar_url} />
                          <AvatarFallback>
                            {conversation.display_name?.charAt(0) ||
                             conversation.full_name?.charAt(0) ||
                             'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Conversation Info */}
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
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
