import { useState, useEffect } from "react";
import { Bell, Smartphone, Shield, Key, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface AlertPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  key: string;
}

const SecurityAlerts = () => {
  const [preferences, setPreferences] = useState<AlertPreference[]>([
    {
      id: "1",
      label: "New Device Login",
      description: "Get notified when your account is accessed from a new device",
      icon: <Smartphone className="w-5 h-5" />,
      enabled: true,
      key: "new_device_login"
    },
    {
      id: "2",
      label: "Failed Login Attempts",
      description: "Alert me when there are multiple failed login attempts",
      icon: <Shield className="w-5 h-5" />,
      enabled: true,
      key: "failed_login_attempts"
    },
    {
      id: "3",
      label: "Password Changes",
      description: "Notify me immediately when my password is changed",
      icon: <Key className="w-5 h-5" />,
      enabled: true,
      key: "password_changes"
    },
    {
      id: "4",
      label: "Email Changes",
      description: "Get notified when your email address is updated",
      icon: <Mail className="w-5 h-5" />,
      enabled: true,
      key: "email_changes"
    },
    {
      id: "5",
      label: "Suspicious Activity",
      description: "Alert me about unusual account activity or login patterns",
      icon: <Shield className="w-5 h-5" />,
      enabled: true,
      key: "suspicious_activity"
    }
  ]);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // In production, load from Supabase user metadata or preferences table
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.security_alerts) {
        const savedPrefs = user.user_metadata.security_alerts;
        setPreferences(prev => prev.map(pref => ({
          ...pref,
          enabled: savedPrefs[pref.key] ?? pref.enabled
        })));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleTogglePreference = async (id: string) => {
    const updatedPreferences = preferences.map(pref =>
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    );
    
    setPreferences(updatedPreferences);

    try {
      // Save to Supabase user metadata
      const prefsObject = updatedPreferences.reduce((acc, pref) => ({
        ...acc,
        [pref.key]: pref.enabled
      }), {});

      const { error } = await supabase.auth.updateUser({
        data: { security_alerts: prefsObject }
      });

      if (error) throw error;

      const pref = updatedPreferences.find(p => p.id === id);
      toast.success(
        pref?.enabled 
          ? `${pref.label} alerts enabled`
          : `${pref.label} alerts disabled`
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to update preferences");
      // Revert on error
      setPreferences(preferences);
    }
  };

  const handleToggleEmailNotifications = async () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { email_notifications: newValue }
      });

      if (error) throw error;
      
      toast.success(
        newValue 
          ? "Email notifications enabled"
          : "Email notifications disabled"
      );
    } catch (error) {
      toast.error("Failed to update notification settings");
      setEmailNotifications(!newValue);
    }
  };

  const handleTogglePushNotifications = async () => {
    const newValue = !pushNotifications;
    
    if (newValue && "Notification" in window) {
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        toast.error("Push notifications permission denied");
        return;
      }
    }
    
    setPushNotifications(newValue);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { push_notifications: newValue }
      });

      if (error) throw error;
      
      toast.success(
        newValue 
          ? "Push notifications enabled"
          : "Push notifications disabled"
      );
    } catch (error) {
      toast.error("Failed to update notification settings");
      setPushNotifications(!newValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Security Alerts
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about security events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Methods */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Notification Methods</h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive security alerts via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={handleToggleEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <Label htmlFor="push-notifications" className="text-base font-medium cursor-pointer">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get instant browser notifications
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={handleTogglePushNotifications}
            />
          </div>
        </div>

        <Separator />

        {/* Alert Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Alert Preferences</h3>
          
          <div className="space-y-3">
            {preferences.map((pref) => (
              <div
                key={pref.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                  {pref.icon}
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <Label
                    htmlFor={`alert-${pref.id}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {pref.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {pref.description}
                  </p>
                </div>

                <Switch
                  id={`alert-${pref.id}`}
                  checked={pref.enabled}
                  onCheckedChange={() => handleTogglePreference(pref.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex gap-2">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Stay Protected
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                We recommend keeping all security alerts enabled to stay informed about 
                important account activity. You can always adjust these settings later.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityAlerts;
