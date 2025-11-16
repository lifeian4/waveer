import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { sendFollowRequest, isFollowing } from "@/lib/notifications";
import { createDirectConversation, getStories, type Story } from "@/lib/chat";
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Lock, 
  Globe, 
  Users, 
  Settings,
  Edit3,
  Check,
  X,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  Send,
  CreditCard,
  Star,
  BadgeCheck,
  Heart,
  Eye,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import WaveBadge from "@/components/WaveBadge";
import AgeCounter from "@/components/AgeCounter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

// Define types
interface ProfileData {
  id: string;
  email: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  country_name: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
  is_private: boolean;
  created_at: string;
  date_of_birth?: string | null;
  subscription_status?: string;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
}

interface FollowerProfile {
  id: string;
  full_name: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

interface FollowerData {
  id: string;
  follower_id: string;
  following_id: string;
  status: string;
  created_at: string;
  follower_profile?: FollowerProfile | null;
}

interface FollowingProfile {
  id: string;
  full_name: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

interface FollowingData {
  id: string;
  follower_id: string;
  following_id: string;
  status: string;
  created_at: string;
  following_profile?: FollowingProfile | null;
}

interface Post {
  id: string;
  user_id: string;
  caption: string;
  media_url: string;
  media_type: "image" | "video";
  video_duration: number | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  is_liked: boolean;
}

const Profile = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Story state
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [hasStories, setHasStories] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followers, setFollowers] = useState<FollowerData[]>([]);
  const [following, setFollowing] = useState<FollowingData[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followStatus, setFollowStatus] = useState<string | null>(null);
  const [canViewProfile, setCanViewProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("followers");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userBadge, setUserBadge] = useState<any>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Helper function to format large numbers
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  };

  // Check if viewing own profile
  useEffect(() => {
    if (currentUser && userId) {
      setIsOwnProfile(currentUser.id === userId);
    } else if (currentUser && !userId) {
      setIsOwnProfile(true);
    }
  }, [currentUser, userId]);

  // Fetch profile data
  useEffect(() => {
    const loadUserStories = async () => {
      if (!currentUser) return;
      
      try {
        const profileUserId = userId || currentUser.id;
        const storiesData = await getStories(currentUser.id);
        const stories = storiesData.filter(s => s.user_id === profileUserId);
        setAllStories(storiesData); // Save all stories for checking followers/following
        setUserStories(stories);
        setHasStories(stories.length > 0);
      } catch (error) {
        console.error('Error loading user stories:', error);
      }
    };

    const loadProfile = async () => {
      if (!userId && !currentUser) return;
      
      const targetUserId = userId || currentUser?.id;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        setEditedProfile(data);
        setDateOfBirth(data.date_of_birth || null);
        
        // Fetch user badge
        const { data: badgeData, error: badgeError } = await supabase
          .from("wave_badges")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("badge_category", "follower_count")
          .eq("is_active", true)
          .maybeSingle();
        
        if (!badgeError && badgeData) {
          setUserBadge(badgeData);
        }
        
        // Check follow status and privacy if not own profile
        if (currentUser && currentUser.id !== targetUserId) {
          const followingStatus = await isFollowing(currentUser.id, targetUserId);
          setIsFollowingUser(followingStatus);
          
          // Check if profile is private and user is not following
          if (data.is_private && !followingStatus) {
            setCanViewProfile(false);
          } else {
            setCanViewProfile(true);
          }
          
          const { data: followData, error: followError } = await supabase
            .from("follows")
            .select("status")
            .eq("follower_id", currentUser.id)
            .eq("following_id", targetUserId)
            .maybeSingle();
          
          if (!followError && followData) {
            setFollowStatus(followData.status);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();

    // Set up real-time subscription for profile updates (especially subscription status)
    if (currentUser) {
      const targetUserId = userId || currentUser.id;
      const profileChannel = supabase
        .channel(`profile-updates-${targetUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${targetUserId}`,
          },
          (payload) => {
            console.log('Profile updated in real-time:', payload);
            setProfile(payload.new as ProfileData);
            setEditedProfile(payload.new as ProfileData);
            
            // Show toast if subscription was activated
            if (payload.new.subscription_status === 'active' && payload.old.subscription_status !== 'active') {
              toast.success("Subscription activated! You now have premium access.");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
      };
    }
    
    const fetchPosts = async () => {
      try {
        const profileUserId = userId || currentUser?.id;
        if (!profileUserId) return;

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", profileUserId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    loadProfile();
    loadUserStories();
    fetchPosts();
  }, [userId, currentUser]);

  // Fetch followers and following counts with real-time updates
  useEffect(() => {
    if (!profile) return;

    const fetchCounts = async () => {
      try {
        console.log("Fetching counts for profile:", profile.id);
        
        // Fetch followers count (people following this profile)
        // Check both pending and accepted to see what's actually in the database
        const { count: followersCount, error: followersError, data: followersData } = await supabase
          .from("follows")
          .select("*", { count: "exact" })
          .eq("following_id", profile.id);
        
        console.log("Followers query result:", { followersCount, followersError, followersData });
        
        // Fetch fake followers count
        const { count: fakeFollowersCount, error: fakeFollowersError } = await supabase
          .from("fake_followers")
          .select("*", { count: "exact" })
          .eq("target_user_id", profile.id)
          .eq("is_active", true);
        
        console.log("Fake followers query result:", { fakeFollowersCount, fakeFollowersError });
        
        if (!followersError && !fakeFollowersError) {
          const totalFollowers = (followersCount || 0) + (fakeFollowersCount || 0);
          setFollowerCount(totalFollowers);
          console.log("Total followers (real + fake):", totalFollowers);
        } else {
          console.error("Followers error:", followersError, fakeFollowersError);
        }
        
        // Fetch following count (people this profile is following)
        const { count: followingCount, error: followingError, data: followingData } = await supabase
          .from("follows")
          .select("*", { count: "exact" })
          .eq("follower_id", profile.id);
        
        console.log("Following query result:", { followingCount, followingError, followingData });
        
        if (!followingError) {
          setFollowingCount(followingCount || 0);
        } else {
          console.error("Following error:", followingError);
        }

        // Debug: Check all follows for this user
        const { data: allFollows, error: allFollowsError } = await supabase
          .from("follows")
          .select("*")
          .or(`following_id.eq.${profile.id},follower_id.eq.${profile.id}`);
        
        console.log("All follows for this user:", { allFollows, allFollowsError });
        
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    // Initial fetch
    fetchCounts();

    // Set up real-time subscription for follower changes
    const followersChannel = supabase
      .channel(`profile-followers-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log('Follower change detected:', payload);
          // Refetch counts when followers change
          await fetchCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events for following changes
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log('Following change detected:', payload);
          // Refetch counts when following changes
          await fetchCounts();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(followersChannel);
    };
  }, [profile]);

  // Fetch followers/following data when tab changes - SIMPLIFIED APPROACH
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      try {
        console.log(`Fetching ${activeTab} for profile:`, profile.id);
        
        if (activeTab === "followers") {
          // Step 1: Get follow relationships
          const { data: followsData, error: followsError } = await supabase
            .from("follows")
            .select("id, follower_id, following_id, status, created_at")
            .eq("following_id", profile.id);
          
          console.log("Follows data:", followsData, followsError);
          
          if (followsError || !followsData) {
            console.error("Error fetching follows:", followsError);
            setFollowers([]);
            return;
          }
          
          if (followsData.length === 0) {
            setFollowers([]);
            return;
          }
          
          // Step 2: Get profile data for each follower
          const followerIds = followsData.map(f => f.follower_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, display_name, username, avatar_url")
            .in("id", followerIds);
          
          console.log("Profiles data:", profilesData, profilesError);
          
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            setFollowers([]);
            return;
          }
          
          // Step 3: Combine the data
          const followersData: FollowerData[] = followsData.map(follow => ({
            id: follow.id,
            follower_id: follow.follower_id,
            following_id: follow.following_id,
            status: follow.status,
            created_at: follow.created_at,
            follower_profile: profilesData?.find(p => p.id === follow.follower_id) || null
          }));
          
          console.log("Final followers data:", followersData);
          setFollowers(followersData);
          
        } else {
          // Step 1: Get follow relationships for following
          const { data: followsData, error: followsError } = await supabase
            .from("follows")
            .select("id, follower_id, following_id, status, created_at")
            .eq("follower_id", profile.id);
          
          console.log("Following data:", followsData, followsError);
          
          if (followsError || !followsData) {
            console.error("Error fetching following:", followsError);
            setFollowing([]);
            return;
          }
          
          if (followsData.length === 0) {
            setFollowing([]);
            return;
          }
          
          // Step 2: Get profile data for each person being followed
          const followingIds = followsData.map(f => f.following_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, display_name, username, avatar_url")
            .in("id", followingIds);
          
          console.log("Following profiles data:", profilesData, profilesError);
          
          if (profilesError) {
            console.error("Error fetching following profiles:", profilesError);
            setFollowing([]);
            return;
          }
          
          // Step 3: Combine the data
          const followingData: FollowingData[] = followsData.map(follow => ({
            id: follow.id,
            follower_id: follow.follower_id,
            following_id: follow.following_id,
            status: follow.status,
            created_at: follow.created_at,
            following_profile: profilesData?.find(p => p.id === follow.following_id) || null
          }));
          
          console.log("Final following data:", followingData);
          setFollowing(followingData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFollowers([]);
        setFollowing([]);
      }
    };
    
    fetchData();
  }, [activeTab, profile, currentPage]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    
    try {
      await sendFollowRequest(currentUser.id, profile.id);
      setFollowStatus("pending");
      toast.success("Follow request sent");
    } catch (error) {
      console.error("Error sending follow request:", error);
      toast.error("Failed to send follow request");
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profile) return;
    
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id);
      
      if (error) throw error;
      
      setIsFollowingUser(false);
      setFollowStatus(null);
      setFollowerCount(prev => prev - 1);
      toast.success("Unfollowed user");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    navigate(`/chat/${profile.id}`);
  };

  const handleCancelRequest = async () => {
    if (!currentUser || !profile) return;
    
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id);
      
      if (error) throw error;
      
      setFollowStatus(null);
      toast.success("Follow request cancelled");
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser || !profile) return;
    
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel your subscription? You'll lose access to premium features immediately."
    );
    
    if (!confirmCancel) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'inactive',
          subscription_plan: null,
          subscription_expires_at: null
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        subscription_status: 'inactive',
        subscription_plan: null,
        subscription_expires_at: null
      } : null);
      
      toast.success("Subscription cancelled successfully");
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error("Failed to cancel subscription");
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !profile) return;
    
    try {
      // Only update specific fields that we know exist
      const updateData = {
        avatar_url: editedProfile.avatar_url || null,
        display_name: editedProfile.display_name || null,
        username: editedProfile.username || null,
        bio: editedProfile.bio || null,
        website: editedProfile.website || null,
        country_name: editedProfile.country_name || null,
        is_private: editedProfile.is_private || false
      };

      console.log("Updating profile with data:", updateData);

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", currentUser.id)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Profile updated successfully:", data);
      
      setProfile(prev => ({ ...prev, ...updateData } as ProfileData));
      setEditMode(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to update profile: ${errorMessage}`);
    }
  };

  const filteredFollowers = followers.filter(follower => {
    const profile = follower.follower_profile;
    return profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profile?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFollowing = following.filter(following => {
    const profile = following.following_profile;
    return profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profile?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleBack = () => {
    if (location.key) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested profile could not be found.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.full_name || "User";
  const totalPages = Math.ceil(
    (activeTab === "followers" ? followerCount : followingCount) / itemsPerPage
  );

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {/* Back Button - Visible on mobile */}
        {isMobile && (
          <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 mb-6 border shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with Story Ring */}
            <div 
              className={`relative ${
                hasStories ? 'cursor-pointer' : ''
              }`}
              onClick={() => {
                if (hasStories && userStories.length > 0) {
                  // Navigate to first story
                  navigate(`/story/${userStories[0].id}`);
                }
              }}
            >
              {hasStories && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                  <div className="absolute inset-[3px] rounded-full bg-background" />
                </div>
              )}
              <Avatar className={`w-24 h-24 relative z-10 ${
                hasStories ? 'ring-2 ring-background' : 'border-4 border-primary/20'
              }`}>
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{displayName}</h1>
                    {userBadge && (
                      <WaveBadge 
                        tier={userBadge.badge_tier} 
                        size="lg" 
                        animated={true}
                      />
                    )}
                  </div>
                  {profile.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                  {profile.full_name && profile.full_name !== displayName && (
                    <p className="text-muted-foreground">{profile.full_name}</p>
                  )}
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    editMode ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditMode(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveProfile}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )
                  ) : followStatus === "pending" ? (
                    <Button 
                      variant="outline" 
                      onClick={handleCancelRequest}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Cancel Request
                    </Button>
                  ) : isFollowingUser ? (
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
                  {!isOwnProfile && (
                    <Button variant="outline" onClick={handleMessage}>
                      <Send className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Profile Content */}
              {isOwnProfile && editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Avatar URL</label>
                    <input
                      type="url"
                      value={editedProfile.avatar_url || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <input
                      type="text"
                      value={editedProfile.display_name || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <input
                      type="text"
                      value={editedProfile.username || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      value={editedProfile.bio || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <input
                      type="url"
                      value={editedProfile.website || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Country</label>
                    <input
                      type="text"
                      value={editedProfile.country_name || ""}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, country_name: e.target.value }))}
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      placeholder="Your country"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Private Profile</label>
                    <input
                      type="checkbox"
                      checked={editedProfile.is_private || false}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, is_private: e.target.checked }))}
                      className="rounded"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-semibold">{formatCount(followerCount)}</span> followers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-semibold">{formatCount(followingCount)}</span> following
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.is_private ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {profile.is_private ? "Private" : "Public"} Profile
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                    {profile.country_name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.country_name}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Age Counter Section */}
        {isOwnProfile && dateOfBirth && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border shadow-sm"
          >
            <AgeCounter dateOfBirth={dateOfBirth} />
          </motion.div>
        )}

        {/* Subscription Status Section */}
        {isOwnProfile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl p-6 border shadow-sm"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription Status
            </h3>
            
            {profile.subscription_status === 'active' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">Active Subscription</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        {profile.subscription_plan || 'Premium Plan'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {profile.subscription_expires_at ? 
                        `Expires ${formatDistanceToNow(new Date(profile.subscription_expires_at), { addSuffix: true })}` :
                        'Active'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/billing')}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Plan
                  </Button>
                  <Button 
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Start Watching
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">No Active Subscription</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        Subscribe to unlock premium content
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/billing')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Choose Your Plan
                </Button>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Followers/Following Section - Only visible if profile is public or user is following */}
        {canViewProfile && (isOwnProfile || isFollowingUser) ? (
          <>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border shadow-sm"
          >
            <div className="flex border-b mb-6">
              <button
                className={`pb-3 px-4 font-medium ${activeTab === "followers" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => {
                  setActiveTab("followers");
                  setCurrentPage(1);
                }}
              >
                Followers ({formatCount(followerCount)})
              </button>
              <button
                className={`pb-3 px-4 font-medium ${activeTab === "following" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => {
                  setActiveTab("following");
                  setCurrentPage(1);
                }}
              >
                Following ({formatCount(followingCount)})
              </button>
            </div>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
            />
          </div>
          
          {/* List */}
          <div className="space-y-4">
            {(activeTab === "followers" ? filteredFollowers : filteredFollowing).map((item) => {
              const user = activeTab === "followers" 
                ? item.follower_profile
                : item.following_profile;
              
              // Check if this user has stories
              const userId = activeTab === "followers" ? item.follower_id : item.following_id;
              const userHasStories = allStories.filter(s => s.user_id === userId).length > 0;
              
              return (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    {/* Avatar with Story Ring */}
                    <div 
                      className={`relative ${userHasStories ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (userHasStories) {
                          const userStoryList = allStories.filter(s => s.user_id === userId);
                          if (userStoryList.length > 0) {
                            navigate(`/story/${userStoryList[0].id}`);
                          }
                        }
                      }}
                    >
                      {userHasStories && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                          <div className="absolute inset-[2px] rounded-full bg-background" />
                        </div>
                      )}
                      <Avatar className={`w-10 h-10 relative z-10 ${
                        userHasStories ? 'ring-1 ring-background' : ''
                      }`}>
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {user?.display_name?.charAt(0) || user?.full_name?.charAt(0) || user?.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user?.display_name || user?.full_name || "User"}
                        </p>
                        {item.status === "pending" && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Pending
                          </span>
                        )}
                        {item.status === "accepted" && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Following
                          </span>
                        )}
                      </div>
                      {user?.username && (
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/profile/${activeTab === "followers" ? item.follower_id : item.following_id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              );
            })}
            
            {filteredFollowers.length === 0 && activeTab === "followers" && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No followers yet</h3>
                <p className="text-muted-foreground">
                  When people follow this user, they'll appear here
                </p>
              </div>
            )}
            
            {filteredFollowing.length === 0 && activeTab === "following" && (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not following anyone</h3>
                <p className="text-muted-foreground">
                  This user isn't following anyone yet
                </p>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>

          {/* Posts Section - Only visible if profile is public or user is following */}
          {(isOwnProfile || isFollowingUser) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 border shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-6">Posts ({posts.length})</h3>
              
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted aspect-square"
                    >
                      {/* Media */}
                      {post.media_type === "image" ? (
                        <img
                          src={post.media_url}
                          alt={post.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <>
                          <video
                            src={post.media_url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </>
                      )}

                      {/* Overlay with stats */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <div className="flex gap-6 text-white text-sm">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            <span>{formatCount(post.likes_count)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{formatCount(post.comments_count)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{formatCount(post.views_count)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-8 border shadow-sm text-center"
          >
            <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">This Profile is Private</h3>
            <p className="text-muted-foreground mb-4">
              Follow {profile.display_name || profile.full_name || "this user"} to see their posts, followers, and following.
            </p>
            {!isFollowingUser && followStatus !== "pending" && (
              <Button onClick={handleFollow}>
                <UserPlus className="w-4 h-4 mr-2" />
                Follow
              </Button>
            )}
            {followStatus === "pending" && (
              <Button variant="outline" onClick={handleCancelRequest}>
                <UserX className="w-4 h-4 mr-2" />
                Cancel Request
              </Button>
            )}
          </motion.div>
        )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Profile;