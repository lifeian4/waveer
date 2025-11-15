import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, CheckCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if email is already verified
    if (currentUser?.email_confirmed_at) {
      navigate("/onboarding");
    }

    // Listen for auth state changes (email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        navigate("/onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }, [currentUser, navigate]);

  const handleResendEmail = async () => {
    if (!currentUser?.email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email Sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

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

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Verification Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Mail className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-black">
              <span className="text-primary">W</span>
              <span className="text-foreground">aver</span>
            </h1>
          </div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-3"
          >
            Verify Your Email
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-6"
          >
            We've sent a verification link to{" "}
            <span className="font-semibold text-foreground">
              {currentUser?.email}
            </span>
          </motion.p>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-muted/30 rounded-xl p-4 mb-6 text-left"
          >
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                Click the verification link in your email
              </p>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                Check your spam folder if you don't see it
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                Return to this page after verifying
              </p>
            </div>
          </motion.div>

          {/* Resend Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleResendEmail}
              disabled={isResending || emailSent}
              variant="outline"
              className="w-full h-12 text-base font-semibold border-2 hover:border-primary/50 hover:bg-primary/5"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Email Sent!
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </motion.div>

          {/* Help Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-muted-foreground mt-6"
          >
            Having trouble?{" "}
            <a href="mailto:support@waver.com" className="text-primary hover:underline">
              Contact support
            </a>
          </motion.p>
        </div>

        {/* Auto-check status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-muted-foreground">
            Checking verification status automatically...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
