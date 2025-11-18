import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const VideoCall2 = () => {
  const { callId } = useParams<{ callId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const [isConnecting, setIsConnecting] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCaller] = useState(searchParams.get("caller") === "true");

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

    const initCall = async () => {
      try {
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        peerConnection.current = new RTCPeerConnection(TURN_CONFIG);

        // Add local tracks
        stream.getTracks().forEach((track) => {
          peerConnection.current!.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.current.ontrack = (event) => {
          const [remoteStream] = event.streams;
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
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
          console.log("Created offer");
        }

        toast.success("Call initialized");
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
      const table = "videocall5";
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

  const toggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover absolute inset-0"
      />

      {/* Local Video (Picture in Picture) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-6 right-6 w-32 h-40 bg-black rounded-lg overflow-hidden border-2 border-primary shadow-lg"
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Call Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 text-center text-white z-10"
      >
        <h2 className="text-xl font-bold">{isConnecting ? "Connecting..." : "Video Call"}</h2>
        <p className="text-sm text-gray-300 mt-1">{formatDuration(callDuration)}</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10"
      >
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center"
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button
          onClick={toggleVideo}
          variant={isVideoOff ? "destructive" : "default"}
          size="lg"
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center"
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        <Button
          onClick={endCall}
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  );
};

export default VideoCall2;
