import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Chrome } from "lucide-react";
import { toast } from "sonner";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Failed to authenticate with Google');
          toast.error("Authentication failed");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!session) {
          console.error('No session found');
          setStatus('error');
          setMessage('No session found');
          toast.error("Authentication failed");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Check if user profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.error('Profile check error:', profileCheckError);
        }

        // Create or update profile
        if (!existingProfile) {
          // New user - create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
              username: session.user.email?.split('@')[0] || '',
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          setStatus('success');
          setMessage('Account created successfully!');
          toast.success("Welcome to Waver!");
          
          // Redirect to onboarding for new users
          setTimeout(() => navigate('/onboarding'), 1500);
        } else {
          // Existing user - update last sign in
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              last_sign_in_at: new Date().toISOString(),
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || existingProfile.avatar_url,
            })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Profile update error:', updateError);
          }

          setStatus('success');
          setMessage('Welcome back!');
          toast.success("Successfully signed in!");
          
          // Redirect to home for existing users
          setTimeout(() => navigate('/'), 1500);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        toast.error("Authentication failed");
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, hsl(280 80% 50% / 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.15) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center relative z-10"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-12 shadow-2xl max-w-md">
          {status === 'loading' && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-6"
              >
                <Chrome className="w-16 h-16 text-primary" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Authenticating</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Please wait...</span>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-block mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Success!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Redirecting...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-block mb-6"
              >
                <XCircle className="w-16 h-16 text-red-500" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Redirecting to login...</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleCallback;
