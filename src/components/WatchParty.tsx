import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Send, Copy, Check, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WatchPartyProps {
  mediaId: string | number;
  mediaTitle: string;
  videoUrl: string;
}

interface PartyMessage {
  id: string;
  user_id: string;
  party_id: string;
  message: string;
  created_at: string;
  user_profile?: {
    username: string;
    avatar_url: string;
  };
}

interface PartyMember {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  is_host: boolean;
  joined_at: string;
}

export default function WatchParty({ mediaId, mediaTitle, videoUrl }: WatchPartyProps) {
  const { user } = useAuth();
  const [partyId, setPartyId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Video sync state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Check if joining existing party from URL
    const urlParams = new URLSearchParams(window.location.search);
    const partyIdFromUrl = urlParams.get('party');
    
    if (partyIdFromUrl) {
      joinParty(partyIdFromUrl);
    }
  }, []);

  useEffect(() => {
    if (partyId) {
      subscribeToParty();
      subscribeToMessages();
      fetchMembers();
      fetchMessages();
    }
  }, [partyId]);

  const createParty = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watch_parties')
        .insert({
          host_id: user.id,
          media_id: mediaId.toString(),
          media_title: mediaTitle,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setPartyId(data.id);
      setIsHost(true);

      // Add host as member
      await supabase.from('party_members').insert({
        party_id: data.id,
        user_id: user.id,
        is_host: true,
      });

      // Generate invite link
      const link = `${window.location.origin}${window.location.pathname}?party=${data.id}`;
      setInviteLink(link);
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };

  const joinParty = async (id: string) => {
    if (!user) return;

    try {
      // Check if party exists and is active
      const { data: party, error: partyError } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (partyError || !party) {
        alert('Party not found or has ended');
        return;
      }

      setPartyId(id);
      setIsHost(party.host_id === user.id);

      // Add as member
      await supabase.from('party_members').upsert({
        party_id: id,
        user_id: user.id,
        is_host: party.host_id === user.id,
      });

      const link = `${window.location.origin}${window.location.pathname}?party=${id}`;
      setInviteLink(link);
    } catch (error) {
      console.error('Error joining party:', error);
    }
  };

  const subscribeToParty = () => {
    const channel = supabase
      .channel(`party:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'party_sync',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            handleSyncUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_messages',
          filter: `party_id=eq.${partyId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSyncUpdate = (syncData: any) => {
    if (isSyncingRef.current || syncData.user_id === user?.id) return;

    isSyncingRef.current = true;

    if (videoRef.current) {
      const timeDiff = Math.abs(videoRef.current.currentTime - syncData.video_time);
      
      // Only sync if difference is significant (> 2 seconds)
      if (timeDiff > 2) {
        videoRef.current.currentTime = syncData.video_time;
      }

      if (syncData.is_playing && videoRef.current.paused) {
        videoRef.current.play();
      } else if (!syncData.is_playing && !videoRef.current.paused) {
        videoRef.current.pause();
      }

      setIsPlaying(syncData.is_playing);
      setCurrentTime(syncData.video_time);
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 500);
  };

  const broadcastSync = async (playing: boolean, time: number) => {
    if (!isHost || !partyId || !user) return;

    try {
      await supabase.from('party_sync').upsert({
        party_id: partyId,
        user_id: user.id,
        is_playing: playing,
        video_time: time,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error broadcasting sync:', error);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);

    if (newPlayingState) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }

    if (isHost) {
      broadcastSync(newPlayingState, videoRef.current.currentTime);
    }
  };

  const fetchMembers = async () => {
    if (!partyId) return;

    try {
      const { data, error } = await supabase
        .from('party_members')
        .select(`
          *,
          user_profile:profiles(username, avatar_url)
        `)
        .eq('party_id', partyId);

      if (error) throw error;

      setMembers(data?.map(m => ({
        id: m.id,
        user_id: m.user_id,
        username: m.user_profile?.username || 'Unknown',
        avatar_url: m.user_profile?.avatar_url || '/default-avatar.png',
        is_host: m.is_host,
        joined_at: m.created_at,
      })) || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchMessages = async () => {
    if (!partyId) return;

    try {
      const { data, error } = await supabase
        .from('party_messages')
        .select(`
          *,
          user_profile:profiles(username, avatar_url)
        `)
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !partyId) return;

    try {
      await supabase.from('party_messages').insert({
        party_id: partyId,
        user_id: user.id,
        message: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endParty = async () => {
    if (!isHost || !partyId) return;

    try {
      await supabase
        .from('watch_parties')
        .update({ is_active: false })
        .eq('id', partyId);

      setPartyId(null);
      window.location.href = window.location.pathname;
    } catch (error) {
      console.error('Error ending party:', error);
    }
  };

  if (!partyId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border">
        <Users className="w-16 h-16 mb-4 text-primary" />
        <h3 className="text-2xl font-bold mb-2">Watch Together</h3>
        <p className="text-muted-foreground mb-6 text-center">
          Start a watch party and invite friends to watch {mediaTitle} together in sync!
        </p>
        <Button onClick={createParty} size="lg">
          <Users className="w-5 h-5 mr-2" />
          Create Watch Party
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Video Player */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
          
          {/* Custom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                disabled={!isHost}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>

              {!isHost && (
                <span className="text-sm text-white/70">
                  Only the host can control playback
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invite Link */}
        <div className="flex gap-2">
          <Input value={inviteLink} readOnly className="flex-1" />
          <Button onClick={copyInviteLink} variant="outline">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {isHost && (
          <Button onClick={endParty} variant="destructive" className="w-full">
            End Watch Party
          </Button>
        )}
      </div>

      {/* Chat & Members */}
      <div className="flex flex-col bg-card rounded-lg border overflow-hidden">
        {/* Members */}
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Watching ({members.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <img
                  src={member.avatar_url}
                  alt={member.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm">
                  {member.username}
                  {member.is_host && <span className="ml-2 text-xs text-primary">(Host)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <img
                src={msg.user_profile?.avatar_url || '/default-avatar.png'}
                alt={msg.user_profile?.username}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{msg.user_profile?.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
