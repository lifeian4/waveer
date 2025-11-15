import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    full_name: string;
    display_name: string;
    avatar_url: string;
    is_online: boolean;
  };
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
  } | null;
  unread_count: number;
}

export default function FloatingChat() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (currentUser && isOpen) {
      loadConversations();
      subscribeToConversations();
    }
  }, [currentUser, isOpen]);

  const loadConversations = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      console.log('Loading conversations for user:', currentUser.id);
      
      // Get user's conversations
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (participantError) {
        console.error('Error loading conversation participants:', participantError);
        throw participantError;
      }

      console.log('Found participant data:', participantData);
      const conversationIds = participantData?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversations with details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Load details for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Get other participant
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              is_online,
              profiles:user_id(id, full_name, display_name, avatar_url)
            `)
            .eq('conversation_id', conv.id)
            .neq('user_id', currentUser.id)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id, created_at, is_read')
            .eq('conversation_id', conv.id)
            .eq('is_deleted_for_everyone', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser.id);

          return {
            id: conv.id,
            updated_at: conv.updated_at,
            other_user: {
              id: otherParticipant?.user_id || '',
              full_name: (otherParticipant?.profiles as any)?.full_name || '',
              display_name: (otherParticipant?.profiles as any)?.display_name || '',
              avatar_url: (otherParticipant?.profiles as any)?.avatar_url || '',
              is_online: otherParticipant?.is_online || false,
            },
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
      
      // Calculate total unread
      const total = conversationsWithDetails.reduce((sum, conv) => sum + conv.unread_count, 0);
      setTotalUnread(total);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const openChat = (userId: string) => {
    setIsOpen(false);
    navigate(`/chat/${userId}`);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
                    key={conversation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => openChat(conversation.other_user.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarImage src={conversation.other_user.avatar_url} />
                          <AvatarFallback>
                            {conversation.other_user.display_name?.charAt(0) ||
                             conversation.other_user.full_name?.charAt(0) ||
                             'U'}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.other_user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {conversation.other_user.display_name ||
                             conversation.other_user.full_name}
                          </h4>
                          {conversation.last_message && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                                addSuffix: false,
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm truncate ${
                              conversation.unread_count > 0
                                ? 'font-semibold text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {conversation.last_message ? (
                              <>
                                {conversation.last_message.sender_id === currentUser.id && (
                                  <Send className="w-3 h-3 inline mr-1" />
                                )}
                                {conversation.last_message.content}
                              </>
                            ) : (
                              'No messages yet'
                            )}
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
