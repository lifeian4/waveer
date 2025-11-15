import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { getUnreadCount } from "@/lib/notifications";

const NotificationsDropdown = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count with real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount(currentUser.id);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up real-time subscription for notifications
    const notificationsChannel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          console.log('New notification received');
          await fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          console.log('Notification updated');
          await fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${currentUser.id}`,
        },
        async () => {
          console.log('New follow request received');
          await fetchUnreadCount();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentUser]);

  const handleClick = () => {
    navigate('/notifications');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="relative p-3 hover:bg-primary/10 rounded-full transition-all duration-300 group"
    >
      <Bell className="w-5 h-5 text-foreground group-hover:text-primary transition-colors duration-300" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </span>
      )}
    </motion.button>
  );
};

export default NotificationsDropdown;