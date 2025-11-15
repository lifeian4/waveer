import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, Chrome } from "lucide-react";
import { toast } from "sonner";

const GoogleAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initiateGoogleAuth = async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/google-callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('Google auth error:', error);
          toast.error("Failed to initiate Google sign-in");
          navigate('/login');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error("An unexpected error occurred");
        navigate('/login');
      }
    };

    initiateGoogleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-12 shadow-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Chrome className="w-16 h-16 text-primary" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">Connecting to Google</h2>
          <p className="text-muted-foreground mb-6">
            Please wait while we redirect you to Google...
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Redirecting...</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleAuth;
