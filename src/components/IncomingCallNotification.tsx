import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CallInvitation {
  id: string;
  call_id: string;
  caller_id: string;
  user_id: string; // receiver
  call_type: 'audio' | 'video';
  title: string;
  body: string;
  read: boolean;
  data?: any;
  caller_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

const IncomingCallNotification = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState<CallInvitation | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to incoming calls via notifi table
    const channel = supabase
      .channel(`notifi:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifi',
          filter: `user_id=eq.${currentUser.id},type=eq.incoming_call`,
        },
        async (payload) => {
          const notification = payload.new as any;
          
          // Fetch caller profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', notification.caller_id)
            .single();

          const invitation: CallInvitation = {
            id: notification.id,
            call_id: notification.call_id,
            caller_id: notification.caller_id,
            user_id: notification.user_id,
            call_type: notification.call_type,
            title: notification.title,
            body: notification.body,
            read: notification.read,
            data: notification.data,
            caller_profile: profile || undefined,
          };

          setIncomingCall(invitation);

          // Play ringtone
          ringtoneRef.current = new Audio('https://www.soundjay.com/phone/sounds/phone-calling-1.mp3');
          ringtoneRef.current.loop = true;
          ringtoneRef.current.play().catch(err => console.log('Ringtone error:', err));
        }
      )
      .subscribe();
    
    // Also listen for realtime broadcast from server
    const broadcastChannel = supabase
      .channel(`notifi:${currentUser.id}`)
      .on('broadcast', { event: 'incoming_call' }, (payload) => {
        const notification = payload.payload;
        
        supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', notification.data.callerId)
          .single()
          .then(({ data: profile }) => {
            const invitation: CallInvitation = {
              id: notification.id || crypto.randomUUID(),
              call_id: notification.data.callId,
              caller_id: notification.data.callerId,
              user_id: currentUser.id,
              call_type: notification.data.callType,
              title: notification.title,
              body: notification.body,
              read: false,
              data: notification.data,
              caller_profile: profile || undefined,
            };
            
            setIncomingCall(invitation);
            
            // Play ringtone
            ringtoneRef.current = new Audio('https://www.soundjay.com/phone/sounds/phone-calling-1.mp3');
            ringtoneRef.current.loop = true;
            ringtoneRef.current.play().catch(err => console.log('Ringtone error:', err));
          });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, [currentUser]);

  const dismissCall = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
    setIncomingCall(null);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      // Mark notification as read
      await supabase
        .from('notifi')
        .update({ read: true })
        .eq('id', incomingCall.id);

      dismissCall();

      // Navigate to call page
      const callPage = incomingCall.call_type === 'video' ? 'video-call' : 'audio-call';
      navigate(`/${callPage}/${incomingCall.call_id}?userId=${incomingCall.caller_id}&caller=false`);
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      // Mark notification as read (rejected)
      await supabase
        .from('notifi')
        .update({ read: true })
        .eq('id', incomingCall.id);

      dismissCall();
      toast.info('Call rejected');
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className="bg-card border-2 border-primary rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={incomingCall.caller_profile?.avatar_url} />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {incomingCall.caller_profile?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {incomingCall.caller_profile?.display_name || 'Unknown'}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {incomingCall.call_type === 'video' ? (
                    <>
                      <Video className="w-4 h-4" />
                      Incoming video call
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      Incoming audio call
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1 rounded-full"
                size="lg"
                onClick={rejectCall}
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={acceptCall}
              >
                {incomingCall.call_type === 'video' ? (
                  <Video className="w-5 h-5 mr-2" />
                ) : (
                  <Phone className="w-5 h-5 mr-2" />
                )}
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallNotification;
