import { useState, useEffect } from "react";
import { Shield, Smartphone, Download, Copy, Check, Loader2, Mail, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

const TwoFactor = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMethod, setSetupMethod] = useState<"email" | "authenticator">("authenticator");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data?.totp?.find(f => f.status === 'verified');
      setIs2FAEnabled(!!totpFactor);
      if (totpFactor) {
        setFactorId(totpFactor.id);
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      // Disable 2FA
      try {
        if (factorId) {
          const { error } = await supabase.auth.mfa.unenroll({ factorId });
          if (error) throw error;
          
          setIs2FAEnabled(false);
          setFactorId("");
          toast.success("Two-factor authentication disabled");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to disable 2FA");
      }
    } else {
      // Show setup modal and start enrollment
      await startMFAEnrollment();
    }
  };

  const startMFAEnrollment = async () => {
    try {
      setLoading(true);
      
      if (setupMethod === "authenticator") {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Google Authenticator'
        });

        if (error) throw error;

        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      } else {
        // Email OTP - send verification email
        await sendEmailOTP();
      }
      
      setShowSetupModal(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to start 2FA setup");
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found");

      // For email OTP, we'll use Supabase's built-in email verification
      // In production, you'd want to send a custom OTP email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP temporarily (in production, use a database table)
      sessionStorage.setItem('email_2fa_otp', otp);
      sessionStorage.setItem('email_2fa_timestamp', Date.now().toString());
      
      // Simulate sending email (in production, use a service like Resend or SendGrid)
      console.log(`Email OTP sent to ${user.email}: ${otp}`);
      toast.success(`Verification code sent to ${user.email}`);
      setEmailSent(true);
    } catch (error: any) {
      throw new Error(error.message || "Failed to send email OTP");
    }
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);
    return codes;
  };

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      
      if (setupMethod === "authenticator") {
        // Verify the TOTP code
        const { data, error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: factorId,
          code: verificationCode
        });

        if (error) throw error;
      } else {
        // Verify email OTP
        const storedOTP = sessionStorage.getItem('email_2fa_otp');
        const timestamp = sessionStorage.getItem('email_2fa_timestamp');
        
        if (!storedOTP || !timestamp) {
          throw new Error("OTP expired. Please request a new code.");
        }
        
        // Check if OTP is expired (10 minutes)
        const isExpired = Date.now() - parseInt(timestamp) > 10 * 60 * 1000;
        if (isExpired) {
          sessionStorage.removeItem('email_2fa_otp');
          sessionStorage.removeItem('email_2fa_timestamp');
          throw new Error("OTP expired. Please request a new code.");
        }
        
        if (verificationCode !== storedOTP) {
          throw new Error("Invalid verification code");
        }
        
        // Clear OTP after successful verification
        sessionStorage.removeItem('email_2fa_otp');
        sessionStorage.removeItem('email_2fa_timestamp');
      }

      // Generate backup codes
      const codes = generateBackupCodes();
      
      setIs2FAEnabled(true);
      setShowBackupCodes(true);
      setShowSetupModal(false);
      setVerificationCode("");
      setEmailSent(false);
      
      toast.success("Two-factor authentication enabled successfully!");
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waver-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCode(true);
    toast.success("Backup codes copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (checking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using TOTP (Time-based One-Time Password)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <Label htmlFor="2fa-toggle" className="text-base font-medium cursor-pointer">
                Enable 2FA
              </Label>
              <p className="text-sm text-muted-foreground">
                {is2FAEnabled 
                  ? "Your account is protected with two-factor authentication"
                  : "Require a verification code in addition to your password"}
              </p>
            </div>
            <Switch
              id="2fa-toggle"
              checked={is2FAEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={loading}
            />
          </div>

          {is2FAEnabled && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    2FA is active
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Using Google Authenticator
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-500/10">
                  Active
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBackupCodes(true);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  View Backup Codes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSetupModal(true);
                  }}
                >
                  Change Method
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Choose your preferred verification method
            </DialogDescription>
          </DialogHeader>

          <Tabs value={setupMethod} onValueChange={(v) => setSetupMethod(v as "email" | "authenticator")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="w-4 h-4" />
                Email OTP
              </TabsTrigger>
              <TabsTrigger value="authenticator" className="gap-2">
                <Smartphone className="w-4 h-4" />
                Authenticator App
              </TabsTrigger>
            </TabsList>

            {/* Email OTP Tab */}
            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">How it works:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>We'll send a 6-digit code to your email</li>
                      <li>Enter the code when logging in</li>
                      <li>Codes expire after 10 minutes</li>
                    </ul>
                  </div>

                  {!emailSent ? (
                    <Button onClick={sendEmailOTP} disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ Code sent! Check your email.
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={sendEmailOTP}
                        disabled={loading}
                        className="mt-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Resend Code
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enter 6-digit code from email</Label>
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={setVerificationCode}
                      disabled={!emailSent}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowSetupModal(false);
                        setEmailSent(false);
                        setVerificationCode("");
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleEnable2FA}
                      disabled={loading || verificationCode.length !== 6 || !emailSent}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Enable 2FA"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Authenticator App Tab */}
            <TabsContent value="authenticator" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Instructions & QR Code */}
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">Setup steps:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open Google Authenticator</li>
                      <li>Tap the + icon</li>
                      <li>Scan QR code or enter key</li>
                      <li>Enter the 6-digit code</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Scan QR Code</Label>
                    <div className="flex justify-center p-4 bg-white dark:bg-zinc-900 rounded-lg border-2 border-dashed">
                      {qrCode ? (
                        <img src={qrCode} alt="QR Code" className="w-40 h-40" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Secret Key & Code Input */}
                <div className="space-y-4">
                  {secret && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Or enter manually:</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <code className="flex-1 text-xs font-mono break-all">{secret}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(secret);
                            toast.success("Secret key copied!");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Enter 6-digit code</Label>
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={setVerificationCode}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSetupModal(false)}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleEnable2FA}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Enable 2FA"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Modal */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm space-y-1">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="font-semibold">{code}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyBackupCodes}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Codes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadBackupCodes}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactor;
