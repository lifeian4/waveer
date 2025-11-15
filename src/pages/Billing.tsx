import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Crown, 
  Zap, 
  Star, 
  Check, 
  Gift,
  Sparkles,
  Globe,
  Moon,
  Sun
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: string;
  price: number;
  originalPrice?: number;
  currency: string;
  features: string[];
  popular?: boolean;
  free?: boolean;
  color: string;
  gradient: string;
}

const Billing = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans: Plan[] = [

    {
      id: "starter",
      name: "Starter",
      icon: <Sparkles className="w-6 h-6" />,
      duration: "2 Days",
      price: 200,
      currency: "RWF",
      features: [
        "HD + 4K quality",
        "All movies & series",
        "Chat & stories",
        "Basic support"
      ],
      color: "text-blue-600",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      id: "pro",
      name: "Pro",
      icon: <Zap className="w-6 h-6" />,
      duration: "5 Days",
      price: 500,
      currency: "RWF",
      features: [
        "HD + 4K quality",
        "Everything unlocked",
        "Priority support",
        "Download offline"
      ],
      popular: true,
      color: "text-purple-600",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "weekly",
      name: "Weekly",
      icon: <Moon className="w-6 h-6" />,
      duration: "1 Week",
      price: 2000,
      currency: "RWF",
      features: [
        "All content access",
        "Music streaming",
        "Chat & stories",
        "Premium quality"
      ],
      color: "text-indigo-600",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      id: "monthly",
      name: "Monthly",
      icon: <Sun className="w-6 h-6" />,
      duration: "1 Month",
      price: 5000,
      currency: "RWF",
      features: [
        "Everything included",
        "Premium speed",
        "Priority downloads",
        "24/7 support"
      ],
      color: "text-orange-600",
      gradient: "from-orange-500 to-red-500"
    },
    {
      id: "3-month",
      name: "3-Month Plan",
      icon: <Star className="w-6 h-6" />,
      duration: "3 Months",
      price: 20000,
      originalPrice: 25000,
      currency: "RWF",
      features: [
        "Unlimited everything",
        "Best value deal",
        "Premium features",
        "Priority support"
      ],
      color: "text-yellow-600",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      id: "6-month",
      name: "6-Month Plan",
      icon: <Globe className="w-6 h-6" />,
      duration: "6 Months",
      price: 45000,
      originalPrice: 55000,
      currency: "RWF",
      features: [
        "Everything unlocked",
        "Maximum savings",
        "VIP treatment",
        "Early access"
      ],
      color: "text-teal-600",
      gradient: "from-teal-500 to-green-500"
    },
    {
      id: "yearly-vip",
      name: "1-Year VIP",
      icon: <Crown className="w-6 h-6" />,
      duration: "12 Months",
      price: 80000,
      originalPrice: 100000,
      currency: "RWF",
      features: [
        "Exclusive movies",
        "Early uploads",
        "VIP badge",
        "Ultimate experience"
      ],
      color: "text-amber-600",
      gradient: "from-amber-500 to-yellow-500"
    }
  ];

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === "welcome-pass") {
      // Handle free plan activation
      navigate(`/payment?plan=${planId}&type=free`);
    } else {
      navigate(`/payment?plan=${planId}`);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return `${price.toLocaleString()} ${currency}`;
  };

  const PlanCard = ({ plan, index }: { plan: Plan; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      <Card className={`h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
        plan.popular ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
      } ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="text-center pb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.gradient} mb-4 mx-auto`}>
            <div className="text-white">
              {plan.icon}
            </div>
          </div>
          
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
          <div className="text-sm text-muted-foreground">{plan.duration}</div>
          
          <div className="mt-4">
            {plan.originalPrice && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(plan.originalPrice, plan.currency)}
              </div>
            )}
            <div className={`text-3xl font-bold ${plan.color}`}>
              {formatPrice(plan.price, plan.currency)}
            </div>
            {plan.originalPrice && (
              <div className="text-sm text-green-600 font-medium">
                Save {formatPrice(plan.originalPrice - plan.price, plan.currency)}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button
            onClick={() => handleSubscribe(plan.id)}
            className={`w-full ${
              plan.free 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                : plan.popular
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            } text-white border-0`}
            size="lg"
          >
            {plan.free ? 'Start Free Trial' : 'Subscribe Now'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative pt-20 pb-12 px-4"
        >
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6"
            >
              <Crown className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Unlock unlimited entertainment with our flexible subscription plans. 
              Start with our free Welcome Pass and upgrade anytime.
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Instant activation</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
          
          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Why Choose Liquid Wave Studio?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Stream in HD and 4K with zero buffering on all devices
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Premium Content</h3>
                <p className="text-sm text-muted-foreground">
                  Access to exclusive movies, series, and music collections
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Global Access</h3>
                <p className="text-sm text-muted-foreground">
                  Watch anywhere, anytime with offline download support
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Billing;
