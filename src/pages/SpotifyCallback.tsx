import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const SpotifyCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Spotify...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage("Authorization failed. Please try again.");
      toast.error("Failed to connect to Spotify");
      return;
    }

    if (code) {
      handleSpotifyCallback(code);
    } else {
      setStatus("error");
      setMessage("No authorization code received");
    }
  }, [searchParams]);

  const handleSpotifyCallback = async (code: string) => {
    try {
      setMessage("Exchanging authorization code...");

      // Exchange code for access token
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: window.location.origin + "/spotify-callback",
          client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
          client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const data = await response.json();
      const tokenExpiry = Date.now() + data.expires_in * 1000;
      
      // Store tokens in localStorage
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
      localStorage.setItem("spotify_token_expiry", String(tokenExpiry));

      // Get Spotify user profile
      setMessage("Fetching Spotify profile...");
      const profileResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          "Authorization": `Bearer ${data.access_token}`
        }
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch Spotify profile");
      }

      const profileData = await profileResponse.json();

      // Save to database if user is logged in
      if (currentUser) {
        setMessage("Saving connection...");
        const { error: dbError } = await supabase.rpc('upsert_spotify_connection', {
          p_user_id: currentUser.id,
          p_spotify_user_id: profileData.id,
          p_access_token: data.access_token,
          p_refresh_token: data.refresh_token,
          p_token_expiry: tokenExpiry,
          p_display_name: profileData.display_name || null,
          p_email: profileData.email || null,
          p_profile_image_url: profileData.images?.[0]?.url || null,
          p_is_premium: profileData.product === 'premium'
        });

        if (dbError) {
          console.error("Error saving to database:", dbError);
          // Continue anyway - localStorage is backup
        }
      }

      setStatus("success");
      setMessage("Successfully connected to Spotify!");
      toast.success("Connected to Spotify!");

      // Redirect to music page after 2 seconds
      setTimeout(() => {
        navigate("/music");
      }, 2000);
    } catch (error) {
      console.error("Spotify callback error:", error);
      setStatus("error");
      setMessage("Failed to connect to Spotify. Please try again.");
      toast.error("Failed to connect to Spotify");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {status === "loading" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <Loader2 className="w-16 h-16 text-primary" />
                </motion.div>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                </motion.div>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {status === "loading" && "Connecting..."}
              {status === "success" && "Success!"}
              {status === "error" && "Connection Failed"}
            </h2>

            <p className="text-muted-foreground mb-6">{message}</p>

            {status === "success" && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Music className="w-4 h-4" />
                <span>Redirecting to music page...</span>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/music")}
                  className="w-full"
                >
                  Back to Music
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SpotifyCallback;
