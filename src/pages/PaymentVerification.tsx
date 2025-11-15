import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Copy, 
  Upload, 
  Clock, 
  CheckCircle, 
  Smartphone,
  ArrowLeft,
  AlertCircle,
  Shield,
  Star,
  Sparkles,
  CreditCard,
  Zap,
  Crown,
  Diamond,
  Camera,
  User,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  currency: string;
}

const PaymentVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [agreedToWhatsApp, setAgreedToWhatsApp] = useState(false);
  
  const planId = searchParams.get("plan");
  const paymentMethod = searchParams.get("method") || "momo_mtn";
  
  const planDetails: Record<string, PlanDetails> = {
    "starter": { id: "starter", name: "💎 Starter", price: 200, currency: "RWF" },
    "pro": { id: "pro", name: "🚀 Pro", price: 500, currency: "RWF" },
    "weekly": { id: "weekly", name: "🌙 Weekly", price: 2000, currency: "RWF" },
    "monthly": { id: "monthly", name: "☀️ Monthly", price: 5000, currency: "RWF" },
    "3-month": { id: "3-month", name: "🪄 3-Month Plan", price: 20000, currency: "RWF" },
    "6-month": { id: "6-month", name: "🌍 6-Month Plan", price: 45000, currency: "RWF" },
    "yearly-vip": { id: "yearly-vip", name: "👑 1-Year VIP", price: 80000, currency: "RWF" }
  };
  
  const currentPlan = planId ? planDetails[planId] : null;
  const receiverPhone = paymentMethod === "momo_mtn" ? "+250792898287" : "+250732539470";
  const providerName = paymentMethod === "momo_mtn" ? "MTN Mobile Money" : "Airtel Money";
  const providerColor = paymentMethod === "momo_mtn" ? "text-yellow-600" : "text-red-600";

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      toast.error("Time expired! Please try again.");
      navigate("/billing");
    }
  }, [timeLeft, navigate]);

  // Redirect if no plan
  useEffect(() => {
    if (!currentPlan || !currentUser) {
      navigate("/billing");
    }
  }, [currentPlan, currentUser, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Phone number copied!");
  };

  const handleSubmitVerification = async () => {
    if (!currentPlan || !currentUser || !senderName || !senderPhone || !agreedToWhatsApp) {
      toast.error("Please fill in all required fields and agree to send screenshot via WhatsApp");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting verification process...');
      console.log('Current plan:', currentPlan);
      console.log('Current user:', currentUser.id);

      // Test basic Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (connectionError) {
        console.error('Supabase connection failed:', connectionError);
        toast.error(`Connection error: ${connectionError.message}`);
        return;
      }
      console.log('Supabase connection successful');

      // Check if tables exist by trying to select from them
      console.log('Checking if payment_transactions table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('payment_transactions')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('Table check error:', tableError);
        console.error('Full error details:', tableError);
        toast.error(`Database error: ${tableError.message}. Code: ${tableError.code}`);
        return;
      }

      console.log('Tables exist, proceeding with transaction creation...');

      // Create payment transaction (without screenshot URL)
      console.log('Creating payment transaction...');
      const transactionData = {
        user_id: currentUser.id,
        plan_id: currentPlan.id,
        amount: currentPlan.price,
        currency: currentPlan.currency,
        payment_method: paymentMethod,
        sender_name: senderName,
        sender_phone: senderPhone,
        receiver_phone: receiverPhone,
        screenshot_url: null, // Will be updated when screenshot is received via WhatsApp
        status: 'pending',
        notes: 'Screenshot to be sent via WhatsApp to +250732539470'
      };

      console.log('Transaction data:', transactionData);

      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        toast.error(`Transaction error: ${transactionError.message}`);
        throw transactionError;
      }

      console.log('Transaction created:', transaction);

      // Create verification request
      console.log('Creating verification request...');
      const verificationData = {
        transaction_id: transaction.id,
        user_id: currentUser.id,
        verification_status: 'pending'
      };

      console.log('Verification data:', verificationData);

      const { error: verificationError } = await supabase
        .from('payment_verifications')
        .insert(verificationData);

      if (verificationError) {
        console.error('Verification error:', verificationError);
        toast.error(`Verification error: ${verificationError.message}`);
        throw verificationError;
      }

      console.log('Verification request created successfully');
      toast.success("Payment verification submitted! Please send your screenshot to WhatsApp +250732539470");
      
      // Redirect to index with verification pending status
      navigate("/?verification=pending");
    } catch (error) {
      console.error('Full verification error:', error);
      
      // More detailed error message
      let errorMessage = "Failed to submit verification. ";
      if (error.message) {
        errorMessage += `Error: ${error.message}`;
      }
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentPlan) {
    return null;
  }

  const progressPercentage = ((180 - timeLeft) / 180) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, hsl(280 100% 70% / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(240 100% 70% / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, hsl(320 100% 70% / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, hsl(280 100% 70% / 0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
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
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-50"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/billing")}
          className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-xl border border-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plans
        </Button>
      </motion.div>

      {/* Main Content - Two Grid Layout */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Grid - Payment Instructions */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Hero Section */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="inline-flex items-center gap-3 mb-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white mb-2">
                    Premium Access
                  </h1>
                  <p className="text-purple-200">Unlock {currentPlan.name}</p>
                </div>
              </motion.div>

              {/* Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 mb-8"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Clock className="w-8 h-8 text-orange-400" />
                  </motion.div>
                  <span className="text-3xl font-bold text-white">{formatTime(timeLeft)}</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-3 bg-orange-900/50 mb-3" 
                />
                <p className="text-orange-200 font-medium">Complete before time expires</p>
              </motion.div>
            </div>

            {/* Payment Instructions Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 ${paymentMethod === "momo_mtn" ? "bg-yellow-500" : "bg-red-500"} rounded-xl flex items-center justify-center`}>
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Send via {providerName}</h3>
                  <p className="text-white/70">Follow the steps below</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white/80 font-medium">Send to this number:</Label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-4 mt-2"
                  >
                    <span className="font-mono text-2xl font-bold text-white">{receiverPhone}</span>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(receiverPhone)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </motion.div>
                </div>

                {/* Amount & Plan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80 font-medium">Amount:</Label>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 mt-2">
                      <span className="text-2xl font-bold text-green-400">
                        {currentPlan.price.toLocaleString()} {currentPlan.currency}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/80 font-medium">Plan:</Label>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 mt-2">
                      <span className="font-bold text-purple-300">{currentPlan.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Grid - Verification Form */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification</h2>
                <p className="text-white/70">Upload your payment proof</p>
              </div>

              <div className="space-y-6">
                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Label className="text-white/80 font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl backdrop-blur-xl"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Label className="text-white/80 font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="+250788123456"
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl backdrop-blur-xl"
                    />
                  </motion.div>
                </div>

                {/* WhatsApp Instructions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Label className="text-white/80 font-medium flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4" />
                    Payment Screenshot Instructions
                  </Label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="border-2 border-green-500/30 rounded-2xl p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">Send Screenshot via WhatsApp</h4>
                        <p className="text-green-200">After payment, send your screenshot to:</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">+250732539470</span>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard("+250732539470")}
                          className="bg-green-500 hover:bg-green-600 border-0"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <p className="text-white/90">Make your mobile money payment</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <p className="text-white/90">Take a screenshot of the transaction</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <p className="text-white/90">Send the screenshot to our WhatsApp</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="whatsapp-agreement"
                        checked={agreedToWhatsApp}
                        onChange={(e) => setAgreedToWhatsApp(e.target.checked)}
                        className="w-5 h-5 text-green-500 bg-white/10 border-white/30 rounded focus:ring-green-500"
                      />
                      <Label htmlFor="whatsapp-agreement" className="text-white/90 cursor-pointer">
                        I agree to send my payment screenshot via WhatsApp to +250732539470
                      </Label>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <Button
                    onClick={handleSubmitVerification}
                    disabled={isSubmitting || !agreedToWhatsApp || !senderName || !senderPhone || timeLeft <= 0}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 border-0 rounded-2xl shadow-2xl"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="flex items-center gap-3"
                      >
                        <Zap className="w-6 h-6" />
                        Processing...
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-6 h-6" />
                        Submit for Verification
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                {/* Security Notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl"
                >
                  <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium">Secure & Protected</p>
                    <p>Your payment information is encrypted and secure. Verification typically takes 2-5 minutes.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerification;
