import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const VideoCallWebRTC = () => {
  const { callId } = useParams<{ callId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const callStartTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const ringTimeout = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signalChannel = useRef<any>(null);

  const otherUserId = searchParams.get("userId");
  const otherUserName = searchParams.get("userName");
  const isCaller = searchParams.get("caller") === "true";

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Fetch other user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!otherUserId) return;

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, username, avatar_url")
        .eq("id", otherUserId)
        .single();

      if (data) {
        setOtherUserProfile(data);
      }
    };

    fetchProfile();
  }, [otherUserId]);

  // Initialize WebRTC
  useEffect(() => {
    if (!currentUser || !callId || !otherUserId) return;

    const initCall = async () => {
      try {
        // Play ringing sound
        audioRef.current = new Audio('https://www.soundjay.com/phone/sounds/phone-calling-1.mp3');
        audioRef.current.loop = true;
        audioRef.current.play().catch(err => console.log('Audio play error:', err));

        // Set timeout to end call after 2 minutes if not answered
        ringTimeout.current = setTimeout(() => {
          if (!remoteStream) {
            toast.error('Call not answered');
            endCall();
          }
        }, 120000);

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        peerConnection.current = new RTCPeerConnection(iceServers);

        // Add local stream tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current!.addTrack(track, stream);
        });

        // Handle incoming remote stream
        peerConnection.current.ontrack = (event) => {
          console.log('Received remote track:', event.track.kind);
          const [remoteStream] = event.streams;
          setRemoteStream(remoteStream);
          
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }

          // Stop ringing when connected
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          if (ringTimeout.current) {
            clearTimeout(ringTimeout.current);
          }
          setIsConnecting(false);

          // Start call duration timer
          if (!callStartTime.current) {
            callStartTime.current = Date.now();
            durationInterval.current = setInterval(() => {
              setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
            }, 1000);
          }
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal('ice-candidate', { candidate: event.candidate });
          }
        };

        // Subscribe to signaling channel
        signalChannel.current = supabase
          .channel(`call:${callId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'call_signals',
              filter: `call_id=eq.${callId}`,
            },
            async (payload) => {
              const signal = payload.new;
              
              // Ignore own signals
              if (signal.sender_id === currentUser.id) return;

              console.log('Received signal:', signal.signal_type);

              if (signal.signal_type === 'offer') {
                await handleOffer(signal.signal_data);
              } else if (signal.signal_type === 'answer') {
                await handleAnswer(signal.signal_data);
              } else if (signal.signal_type === 'ice-candidate') {
                await handleIceCandidate(signal.signal_data);
              } else if (signal.signal_type === 'end-call') {
                toast.info('Call ended by other user');
                endCall();
              }
            }
          )
          .subscribe();

        // If caller, create and send offer
        if (isCaller) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await sendSignal('offer', { offer });
        }

        toast.success("Call initialized");
      } catch (error: any) {
        console.error("Error initializing call:", error);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error("Camera/Microphone permission denied. Please allow access.");
        } else {
          toast.error(`Failed to initialize call: ${error.message}`);
        }
        
        setTimeout(() => navigate(-1), 2000);
      }
    };

    initCall();

    return () => {
      cleanup();
    };
  }, [currentUser, callId, otherUserId, isCaller]);

  const sendSignal = async (type: string, data: any) => {
    try {
      await supabase.from('call_signals').insert({
        call_id: callId,
        sender_id: currentUser!.id,
        receiver_id: otherUserId,
        signal_type: type,
        signal_data: data,
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  };

  const handleOffer = async (data: any) => {
    try {
      if (!peerConnection.current) return;

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      await sendSignal('answer', { answer });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data: any) => {
    try {
      if (!peerConnection.current) return;

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (data: any) => {
    try {
      if (!peerConnection.current) return;

      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    if (ringTimeout.current) {
      clearTimeout(ringTimeout.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (signalChannel.current) {
      signalChannel.current.unsubscribe();
    }
  };

  const endCall = async () => {
    try {
      await sendSignal('end-call', {});
      cleanup();
      toast.success("Call ended");
      navigate(-1);
    } catch (error) {
      console.error("Error ending call:", error);
      cleanup();
      navigate(-1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Remote Video (Main) */}
      <div className="absolute inset-0">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/20">
                <AvatarImage src={otherUserProfile?.avatar_url} />
                <AvatarFallback className="bg-primary text-white text-4xl">
                  {otherUserProfile?.display_name?.charAt(0) || otherUserName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-2xl font-semibold mb-2">
                {otherUserProfile?.display_name || otherUserName || "User"}
              </p>
              <p className="text-white/70 text-lg">
                {isConnecting ? "Calling..." : "Connecting..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-4 right-4 w-40 h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10"
      >
        {!isVideoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <Avatar className="w-20 h-20">
              <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-white text-2xl">
                {currentUser?.user_metadata?.display_name?.charAt(0) || "Y"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <p className="text-white text-xs font-medium">You</p>
        </div>
      </motion.div>

      {/* Top Bar - Call Info */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={otherUserProfile?.avatar_url} />
              <AvatarFallback className="bg-primary text-white">
                {otherUserProfile?.display_name?.charAt(0) || otherUserName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-lg">
                {otherUserProfile?.display_name || otherUserName || "User"}
              </p>
              <p className="text-white/70 text-sm">{formatDuration(callDuration)}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent z-10">
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-20 h-20 bg-red-600 hover:bg-red-700"
            onClick={endCall}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          {/* Video Toggle Button */}
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-16 h-16"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallWebRTC;
