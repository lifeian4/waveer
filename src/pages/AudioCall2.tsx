import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AudioCall2 = () => {
  const { callId } = useParams<{ callId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCaller] = useState(searchParams.get("caller") === "true");
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);

  const otherUserId = searchParams.get("userId");
  const callStartTime = useRef<number | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const TURN_CONFIG = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };

  useEffect(() => {
    if (!currentUser?.id || !callId || !otherUserId) {
      toast.error("Missing call information");
      navigate(-1);
      return;
    }

    // Fetch other user profile
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", otherUserId)
        .single();
      setOtherUserProfile(data);
    };

    fetchProfile();

    const initCall = async () => {
      try {
        // Get local audio only
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        localStream.current = stream;

        // Create peer connection
        peerConnection.current = new RTCPeerConnection(TURN_CONFIG);

        // Add local tracks
        stream.getTracks().forEach((track) => {
          peerConnection.current!.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.current.ontrack = (event) => {
          console.log("Received remote audio track");
          setIsConnecting(false);

          // Start call duration timer
          if (!callStartTime.current) {
            callStartTime.current = Date.now();
            durationInterval.current = setInterval(() => {
              setCallDuration(Math.floor((Date.now() - callStartTime.current!) / 1000));
            }, 1000);
          }
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("ICE candidate:", event.candidate);
          }
        };

        // If caller, create offer
        if (isCaller) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          console.log("Created audio offer");
        }

        toast.success("Audio call initialized");
      } catch (error: any) {
        console.error("Error initializing call:", error);
        toast.error(`Failed to initialize call: ${error.message}`);
        setTimeout(() => navigate(-1), 2000);
      }
    };

    initCall();

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [currentUser?.id, callId, otherUserId, isCaller, navigate]);

  const endCall = async () => {
    try {
      // Stop all tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection.current) {
        peerConnection.current.close();
      }

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      // Update call record
      const table = "audiocall5";
      await supabase
        .from(table)
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("call_id", callId);

      toast.success("Call ended");
      navigate(-1);
    } catch (error) {
      console.error("Error ending call:", error);
      navigate(-1);
    }
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Call Info */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Avatar */}
        <Avatar className="w-32 h-32 border-4 border-primary">
          <AvatarImage src={otherUserProfile?.avatar_url} />
          <AvatarFallback className="bg-primary/20 text-primary text-4xl font-bold">
            {otherUserProfile?.display_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            {otherUserProfile?.display_name || "User"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {isConnecting ? "Connecting..." : "Audio Call"}
          </p>
        </div>

        {/* Duration */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl font-bold text-primary"
        >
          {formatDuration(callDuration)}
        </motion.div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10"
      >
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          className="rounded-full w-16 h-16 p-0 flex items-center justify-center"
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </Button>

        <Button
          onClick={endCall}
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16 p-0 flex items-center justify-center"
        >
          <PhoneOff className="w-7 h-7" />
        </Button>
      </motion.div>
    </div>
  );
};

export default AudioCall2;
