import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  ArrowLeft, 
  Check,
  Lock,
  Gift,
  Upload,
  Copy
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PlanDetails {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
  features: string[];
  free?: boolean;
}

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("momo_mtn");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [receiverPhone, setReceiverPhone] = useState("");

  const planId = searchParams.get("plan");
  const planType = searchParams.get("type");

  const planDetails: Record<string, PlanDetails> = {
    "welcome-pass": {
      id: "welcome-pass",
      name: "Welcome Pass",
      duration: "1 Day",
      price: 0,
      currency: "RWF",
      features: ["HD + 4K quality", "All movies & series", "Chat & stories", "Limited time access"],
      free: true
    },
    "starter": {
      id: "starter",
      name: "💎 Starter",
      duration: "2 Days",
      price: 200,
      currency: "RWF",
      features: ["HD + 4K quality", "All movies & series", "Chat & stories", "Basic support"]
    },
    "pro": {
      id: "pro",
      name: "🚀 Pro",
      duration: "5 Days",
      price: 500,
      currency: "RWF",
      features: ["HD + 4K quality", "Everything unlocked", "Priority support", "Download offline"]
    },
    "weekly": {
      id: "weekly",
      name: "🌙 Weekly",
      duration: "1 Week",
      price: 2000,
      currency: "RWF",
      features: ["All content access", "Music streaming", "Chat & stories", "Premium quality"]
    },
    "monthly": {
      id: "monthly",
      name: "☀️ Monthly",
      duration: "1 Month",
      price: 5000,
      currency: "RWF",
      features: ["Everything included", "Premium speed", "Priority downloads", "24/7 support"]
    },
    "3-month": {
      id: "3-month",
      name: "🪄 3-Month Plan",
      duration: "3 Months",
      price: 20000,
      currency: "RWF",
      features: ["Unlimited everything", "Best value deal", "Premium features", "Priority support"]
    },
    "6-month": {
      id: "6-month",
      name: "🌍 6-Month Plan",
      duration: "6 Months",
      price: 45000,
      currency: "RWF",
      features: ["Everything unlocked", "Maximum savings", "VIP treatment", "Early access"]
    },
    "yearly-vip": {
      id: "yearly-vip",
      name: "👑 1-Year VIP",
      duration: "12 Months",
      price: 80000,
      currency: "RWF",
      features: ["Exclusive movies", "Early uploads", "VIP badge", "Ultimate experience"]
    }
  };

  const currentPlan = planId ? planDetails[planId] : null;

  // Set receiver phone based on payment method
  useEffect(() => {
    if (selectedPaymentMethod === "momo_mtn") {
      setReceiverPhone("+250792898287");
    } else if (selectedPaymentMethod === "momo_airtel") {
      setReceiverPhone("+250732539470");
    }
  }, [selectedPaymentMethod]);

  useEffect(() => {
    if (!currentPlan) {
      navigate("/billing");
    }
  }, [currentPlan, navigate]);

  const handlePayment = async () => {
    if (!currentPlan || !currentUser) return;

    setIsProcessing(true);

    try {
      if (currentPlan.free) {
        // Activate free plan immediately by updating profile
        console.log('Activating free plan for user:', currentUser.id);
        
        // Calculate expiration date (1 day for welcome pass)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);
        
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_plan: currentPlan.id,
            subscription_expires_at: expirationDate.toISOString()
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error('Error activating free plan:', error);
          throw error;
        }
        
        console.log('Free plan activated successfully');
        toast.success("Welcome Pass activated! Enjoy your free day of premium content.");
        navigate("/?subscription=success");
      } else {
        // For paid plans, redirect to verification page
        navigate(`/payment-verification?plan=${currentPlan.id}&method=${selectedPaymentMethod}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      let errorMessage = "Payment processing failed. Please try again.";
      
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!currentPlan || !currentUser || !screenshot || !senderName || !senderPhone) {
      toast.error("Please fill in all required fields and upload screenshot");
      return;
    }

    setIsProcessing(true);

    try {
      // Upload screenshot to Supabase storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('screenshots')
        .getPublicUrl(fileName);

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: currentUser.id,
          plan_id: currentPlan.id,
          amount: currentPlan.price,
          currency: currentPlan.currency,
          payment_method: selectedPaymentMethod,
          sender_name: senderName,
          sender_phone: senderPhone,
          receiver_phone: receiverPhone,
          screenshot_url: publicUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create verification request
      const { error: verificationError } = await supabase
        .from('payment_verifications')
        .insert({
          transaction_id: transaction.id,
          user_id: currentUser.id,
          verification_status: 'pending'
        });

      if (verificationError) throw verificationError;

      toast.success("Payment verification submitted! We'll review and activate your subscription within 24 hours.");
      navigate("/profile?verification=pending");
    } catch (error) {
      console.error('Verification error:', error);
      toast.error("Failed to submit verification. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Phone number copied to clipboard!");
  };

  if (!currentPlan) {
    return null;
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/billing")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {currentPlan.free ? (
                      <Gift className="w-5 h-5 text-green-500" />
                    ) : (
                      <Shield className="w-5 h-5 text-primary" />
                    )}
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{currentPlan.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentPlan.duration}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {currentPlan.free ? "Free" : `${currentPlan.price.toLocaleString()} ${currentPlan.currency}`}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Included Features:</h4>
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{currentPlan.free ? "Free" : `${currentPlan.price.toLocaleString()} ${currentPlan.currency}`}</span>
                  </div>

                  {currentPlan.free && (
                    <Badge className="w-full justify-center bg-green-100 text-green-800 hover:bg-green-100">
                      No payment required - Instant activation
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    {currentPlan.free ? "Activate Free Plan" : "Payment Method"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!currentPlan.free && (
                    <>
                      <RadioGroup
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="momo_mtn" id="momo_mtn" />
                          <Label htmlFor="momo_mtn" className="flex items-center gap-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-yellow-600" />
                            <div>
                              <div className="font-medium">MTN Mobile Money</div>
                              <div className="text-sm text-muted-foreground">Send to: +250792898287</div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="momo_airtel" id="momo_airtel" />
                          <Label htmlFor="momo_airtel" className="flex items-center gap-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-red-600" />
                            <div>
                              <div className="font-medium">Airtel Money</div>
                              <div className="text-sm text-muted-foreground">Send to: +250732539470</div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium">Credit/Debit Card</div>
                              <div className="text-sm text-muted-foreground">Visa, Mastercard, American Express</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Mobile Money Form */}
                      {selectedPaymentMethod === "momo" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="078XXXXXXX"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Card Form */}
                      {selectedPaymentMethod === "card" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="cardName">Cardholder Name</Label>
                            <Input
                              id="cardName"
                              type="text"
                              placeholder="John Doe"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                              id="cardNumber"
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input
                                id="expiry"
                                type="text"
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                type="text"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Payment Verification Form */}
                      {showVerification && !currentPlan.free && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4 p-4 bg-muted/20 rounded-lg border"
                        >
                          <h4 className="font-semibold text-center">Payment Verification</h4>
                          
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">Send money to:</p>
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border">
                              <span className="font-mono text-lg">{receiverPhone}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(receiverPhone)}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Amount: <strong>{currentPlan.price.toLocaleString()} {currentPlan.currency}</strong>
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="senderName">Your Full Name</Label>
                              <Input
                                id="senderName"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="John Doe"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="senderPhone">Your Phone Number</Label>
                              <Input
                                id="senderPhone"
                                value={senderPhone}
                                onChange={(e) => setSenderPhone(e.target.value)}
                                placeholder="+250788123456"
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="screenshot">Payment Screenshot</Label>
                            <div className="mt-1">
                              <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload a screenshot of your mobile money transaction
                            </p>
                          </div>

                          <Button
                            onClick={handleVerifyPayment}
                            disabled={isProcessing || !screenshot || !senderName || !senderPhone}
                            className="w-full"
                            size="lg"
                          >
                            {isProcessing ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                              </div>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Submit for Verification
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Payment Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : currentPlan.free ? (
                      "Activate Free Plan"
                    ) : (
                      `Pay ${currentPlan.price.toLocaleString()} ${currentPlan.currency}`
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Shield className="w-4 h-4" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Payment;
