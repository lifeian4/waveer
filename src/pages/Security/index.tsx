import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LoginActivity from "./LoginActivity";
import TwoFactor from "./TwoFactor";
import PasswordEmail from "./PasswordEmail";
import TrustedDevices from "./TrustedDevices";
import SecurityAlerts from "./SecurityAlerts";
import DangerZone from "./DangerZone";

const Security = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container max-w-5xl mx-auto px-4 py-8 mt-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-primary/10">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">🔒 Security</h1>
                <p className="text-muted-foreground">
                  Manage your account security and privacy settings
                </p>
              </div>
            </div>
          </motion.div>

          <Separator className="mb-8" />

          {/* Security Sections */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Recent Login Activity */}
            <motion.div variants={itemVariants}>
              <LoginActivity />
            </motion.div>

            {/* Two-Factor Authentication */}
            <motion.div variants={itemVariants}>
              <TwoFactor />
            </motion.div>

            {/* Password & Email Security */}
            <motion.div variants={itemVariants}>
              <PasswordEmail />
            </motion.div>

            {/* Trusted Devices */}
            <motion.div variants={itemVariants}>
              <TrustedDevices />
            </motion.div>

            {/* Security Alerts */}
            <motion.div variants={itemVariants}>
              <SecurityAlerts />
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={itemVariants}>
              <DangerZone />
            </motion.div>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12 p-6 rounded-lg bg-muted/50 border"
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold">Your Security Matters</h3>
                <p className="text-sm text-muted-foreground">
                  We take your account security seriously. All security features are designed to 
                  protect your account from unauthorized access. If you notice any suspicious activity, 
                  please change your password immediately and contact our support team.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => navigate("/billing")}>
                    View Subscription
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Security;
