import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AudioCallWebRTC = () => {
  const { callId } = useParams<{ callId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const otherUserId = searchParams.get("userId");
  const isCaller = searchParams.get("caller") === "true";

  useEffect(() => {
    if (!currentUser || !callId) return;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = stream;

        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        stream.getTracks().forEach(t => peerConnection.current!.addTrack(t, stream));

        peerConnection.current.ontrack = (e) => {
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0];
          setIsConnected(true);
        };

        if (isCaller) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          await supabase.from('call_signals').insert({
            call_id: callId,
            sender_id: currentUser.id,
            receiver_id: otherUserId,
            signal_type: 'offer',
            signal_data: { offer },
          });
        }
      } catch (error: any) {
        toast.error("Failed to start call");
        navigate(-1);
      }
    };

    init();
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peerConnection.current?.close();
    };
  }, []);

  const endCall = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 z-50 flex items-center justify-center">
      <audio ref={remoteAudioRef} autoPlay />
      <div className="text-center">
        <Avatar className="w-40 h-40 mx-auto mb-4">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <p className="text-white text-2xl mb-8">{isConnected ? "Connected" : "Calling..."}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setIsMuted(!isMuted)} size="lg" className="rounded-full">
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button onClick={endCall} size="lg" className="rounded-full bg-red-600">
            <PhoneOff />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudioCallWebRTC;
