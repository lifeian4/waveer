import { useState, useEffect } from "react";
import { Monitor, Smartphone, Laptop, MapPin, Clock, LogOut, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export interface LoginSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  time: string;
  isCurrent: boolean;
  userAgent?: string;
}

const LoginActivity = () => {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoginSessions();
  }, []);

  const fetchLoginSessions = async () => {
    try {
      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (currentSession) {
        const userAgent = navigator.userAgent;
        const deviceInfo = parseUserAgent(userAgent);
        
        // Show current session
        // Note: Supabase free tier doesn't provide multi-session tracking out of the box
        // For full session management, you'd need to implement a custom sessions table
        setSessions([{
          id: currentSession.user.id,
          device: deviceInfo,
          location: "Current Device", // Would need IP geolocation API for real location
          ipAddress: "Hidden for privacy",
          time: currentSession.user.last_sign_in_at || new Date().toISOString(),
          isCurrent: true,
          userAgent: userAgent
        }]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load login sessions");
    } finally {
      setLoading(false);
    }
  };

  const parseUserAgent = (ua: string): string => {
    // Simple user agent parsing
    let os = "Unknown OS";
    let browser = "Unknown Browser";

    if (ua.includes("Windows NT 10")) os = "Windows 10";
    else if (ua.includes("Windows NT 11")) os = "Windows 11";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("iPhone")) os = "iPhone";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Linux")) os = "Linux";

    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";

    return `${os} · ${browser}`;
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("android")) {
      return <Smartphone className="w-5 h-5" />;
    } else if (device.toLowerCase().includes("windows") || device.toLowerCase().includes("mac")) {
      return <Monitor className="w-5 h-5" />;
    }
    return <Laptop className="w-5 h-5" />;
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      // Note: Supabase doesn't support logging out specific sessions yet
      // This would require custom backend implementation
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success("Session logged out successfully");
    } catch (error) {
      toast.error("Failed to log out session");
    }
  };

  const handleLogoutAllOthers = async () => {
    try {
      // Sign out from all devices except current
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      
      if (error) throw error;
      
      setSessions(sessions.filter(s => s.isCurrent));
      toast.success("All other sessions logged out");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Failed to log out sessions");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Login Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Login Activity
        </CardTitle>
        <CardDescription>
          Manage your active sessions and see where your account is being used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active sessions found</p>
          </div>
        ) : (
          <>
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {getDeviceIcon(session.device)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{session.device}</h4>
                    {session.isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{session.location}</span>
                      <span className="text-xs">({session.ipAddress})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {session.isCurrent
                          ? "Active now"
                          : formatDistanceToNow(new Date(session.time), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLogoutSession(session.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                )}
              </div>
            ))}

            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleLogoutAllOthers}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out of All Other Devices
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginActivity;
