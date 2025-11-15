import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  User, 
  Users, 
  MapPin, 
  Link as LinkIcon, 
  Calendar,
  Lock,
  Globe,
  UserPlus,
  UserCheck,
  UserX,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfile {
  id: string;
  full_name: string;
  display_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  country_name: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
  is_private: boolean;
  created_at: string;
}

interface FollowData {
  id: string;
  status: string;
}

const UserDetails = ({ userId, onClose }: { userId: string; onClose: () => void }) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        // Fetch follow counts
        const { count: followersCount } = await supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId)
          .eq("status", "accepted");
        
        const { count: followingCount } = await supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId)
          .eq("status", "accepted");
        
        setFollowerCount(followersCount || 0);
        setFollowingCount(followingCount || 0);
        
        // Check follow status if not own profile
        if (currentUser && currentUser.id !== userId) {
          const { data: followData, error: followError } = await supabase
            .from("followers")
            .select("status")
            .eq("follower_id", currentUser.id)
            .eq("following_id", userId)
            .maybeSingle();
          
          if (!followError && followData) {
            setIsFollowing(followData.status === "accepted");
            setFollowStatus(followData.status);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from("followers")
        .insert([
          {
            follower_id: currentUser.id,
            following_id: profile.id,
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update UI based on follow status
      if (data.status === "accepted") {
        setIsFollowing(true);
        setFollowStatus("accepted");
        setFollowerCount(prev => prev + 1);
      } else {
        setFollowStatus("pending");
        // Show notification for pending request
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: profile.id,
              from_user_id: currentUser.id,
              type: "follow_request",
              message: "You have a new follow request"
            }
          ]);
        if (notificationError) console.error("Error creating notification:", notificationError);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profile) return;
    
    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id);
      
      if (error) throw error;
      
      setIsFollowing(false);
      setFollowStatus(null);
      setFollowerCount(prev => prev - 1);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUser || !profile) return;
    
    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id)
        .eq("status", "pending");
      
      if (error) throw error;
      
      setFollowStatus(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const displayName = profile.display_name || profile.full_name || "User";

  return (
    <div className={isMobile ? "h-full flex flex-col" : "p-6"}>
      {/* Mobile header with close button */}
      {isMobile && (
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">User Profile</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className={isMobile ? "flex-1 overflow-y-auto p-4" : ""}>
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-20 h-20 border-4 border-primary/20 mb-4">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold">{displayName}</h2>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
          {profile.full_name && profile.full_name !== displayName && (
            <p className="text-muted-foreground">{profile.full_name}</p>
          )}
          
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="font-semibold">{followerCount}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">{followingCount}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            {profile.is_private ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {profile.is_private ? "Private" : "Public"} Profile
            </span>
          </div>
          
          <div className="mt-4">
            {currentUser?.id === profile.id ? (
              <Button variant="outline" disabled>
                This is you
              </Button>
            ) : followStatus === "pending" ? (
              <Button 
                variant="outline" 
                onClick={handleCancelRequest}
              >
                <UserX className="h-4 w-4 mr-2" />
                Cancel Request
              </Button>
            ) : isFollowing ? (
              <Button 
                variant="outline" 
                onClick={handleUnfollow}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Unfollow
              </Button>
            ) : (
              <Button onClick={handleFollow}>
                <UserPlus className="h-4 w-4 mr-2" />
                Follow
              </Button>
            )}
          </div>
        </div>
        
        {profile.bio && (
          <div className="mb-6">
            <p className="text-muted-foreground">{profile.bio}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {profile.country_name && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile.country_name}</span>
            </div>
          )}
          
          {profile.website && (
            <div className="flex items-center gap-3">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Website
              </a>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;