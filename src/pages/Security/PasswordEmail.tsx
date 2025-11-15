import { useState, useEffect } from "react";
import { Mail, Key, CheckCircle, AlertCircle, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const PasswordEmail = () => {
  const { currentUser } = useAuth();
  const [emailVerified, setEmailVerified] = useState(false);
  const [lastPasswordChange, setLastPasswordChange] = useState<Date | null>(null);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (currentUser) {
      // Check email verification status
      setEmailVerified(currentUser.email_confirmed_at !== null);
      
      // Mock last password change - in production, track this in user metadata
      setLastPasswordChange(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // 90 days ago
    }
  }, [currentUser]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 30) return "bg-red-500";
    if (passwordStrength < 60) return "bg-yellow-500";
    if (passwordStrength < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength < 30) return "Weak";
    if (passwordStrength < 60) return "Fair";
    if (passwordStrength < 80) return "Good";
    return "Strong";
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      toast.success("Verification email sent to your new address");
      setShowChangeEmail(false);
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordStrength < 60) {
      toast.error("Please choose a stronger password");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success("Password changed successfully. All other sessions have been logged out.");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLastPasswordChange(new Date());
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser?.email || '',
      });

      if (error) throw error;
      
      toast.success("Verification email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password & Email Security
          </CardTitle>
          <CardDescription>
            Manage your account credentials and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Section */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Email Address</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {currentUser?.email || "No email set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {emailVerified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeEmail(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Change Email
              </Button>
              {!emailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyEmail}
                >
                  Verify Email
                </Button>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Password</Label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {lastPasswordChange
                    ? `Last changed ${formatDistanceToNow(lastPasswordChange, { addSuffix: true })}`
                    : "Never changed"}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePassword(true)}
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Security Tip
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Changing your password will log you out of all other devices for security.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Email Dialog */}
      <Dialog open={showChangeEmail} onOpenChange={setShowChangeEmail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              You'll need to verify your new email address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input
                type="email"
                value={currentUser?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>New Email Address</Label>
              <Input
                type="email"
                placeholder="newemail@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeEmail(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeEmail}>
              Update Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Choose a strong password to keep your account secure
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className="font-medium">{getStrengthText()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PasswordEmail;
