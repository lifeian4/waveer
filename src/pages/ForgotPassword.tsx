import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, User, Phone, ArrowRight, Sparkles, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
  const [step, setStep] = useState<"identifier" | "verification" | "sent">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Simple verification questions
  const questions = [
    { question: "What is 2 + 2?", answer: "4" },
    { question: "What color is the sky?", answer: "blue" },
    { question: "How many days in a week?", answer: "7" },
    { question: "What is the capital of France?", answer: "paris" },
    { question: "How many fingers on one hand?", answer: "5" },
  ];

  const getRandomQuestion = () => {
    return questions[Math.floor(Math.random() * questions.length)];
  };

  const [currentQuestion, setCurrentQuestion] = useState(getRandomQuestion());

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier) {
      toast({
        title: "Error",
        description: "Please enter email or username",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if identifier is email or username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

      if (isEmail) {
        setEmail(identifier);
        setStep("verification");
      } else {
        // Look up email by username
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", identifier)
          .single();

        if (error || !profile) {
          toast({
            title: "Error",
            description: "Username not found",
            variant: "destructive",
          });
          return;
        }

        setEmail(profile.email);
        setStep("verification");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationAnswer.toLowerCase().trim() !== currentQuestion.answer.toLowerCase()) {
      toast({
        title: "Incorrect Answer",
        description: "Please answer the question correctly",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use Supabase's built-in password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email Sent!",
        description: "Check your email for the password reset link",
      });

      setStep("sent");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine which icon to show based on input
  const getInputIcon = () => {
    if (!identifier) return <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier);

    if (isEmail) {
      return <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />;
    } else if (isPhone) {
      return <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />;
    } else {
      return <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />;
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

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-black">
                <span className="text-primary">W</span>
                <span className="text-foreground">aver</span>
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
            <p className="text-muted-foreground text-sm">
              {step === "identifier" && "Enter your email or username"}
              {step === "verification" && "Answer the security question"}
              {step === "sent" && "Check your email for reset link"}
            </p>
          </motion.div>

          {/* Step 1: Identifier */}
          {step === "identifier" && (
            <form onSubmit={handleIdentifierSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="identifier" className="text-foreground font-semibold">
                  Email or Username
                </Label>
                <div className="relative mt-2">
                  {getInputIcon()}
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="email@example.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-11 h-12 bg-background/50 border-2 focus:border-primary"
                    disabled={loading}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-12 text-base font-bold rounded-xl group"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Continue"}
                </Button>
              </motion.div>
            </form>
          )}

          {/* Step 2: Verification Question */}
          {step === "verification" && (
            <form onSubmit={handleVerificationSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground mb-2">{currentQuestion.question}</p>
                      <Input
                        type="text"
                        placeholder="Your answer"
                        value={verificationAnswer}
                        onChange={(e) => setVerificationAnswer(e.target.value)}
                        className="bg-background/50 border-2 focus:border-primary"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-12 text-base font-bold rounded-xl group"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Send Reset Link"}
                </Button>
              </motion.div>
            </form>
          )}

          {/* Step 3: Email Sent Success */}
          {step === "sent" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 rounded-full bg-primary/20 border border-primary/40"
                >
                  <CheckCircle className="w-12 h-12 text-primary" />
                </motion.div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-foreground">Email Sent!</h3>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to reset your password. The link will expire in 24 hours.
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try again.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => navigate("/login")}
                  variant="hero"
                  className="w-full h-12 text-base font-bold rounded-xl"
                >
                  Back to Login
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Login
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
