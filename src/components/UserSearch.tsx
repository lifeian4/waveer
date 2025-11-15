import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Search, User, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserProfile {
  id: string;
  full_name: string;
  display_name: string;
  username: string;
  avatar_url: string;
  bio: string;
}

const UserSearch = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // Added navigate
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !currentUser) return;
      
      setIsLoading(true);
      
      try {
        // Search by username, email, or full_name
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, display_name, username, avatar_url, bio")
          .or(`full_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .neq("id", currentUser.id) // Exclude current user
          .limit(10);
        
        if (error) throw error;
        
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const delayDebounce = setTimeout(() => {
      searchUsers();
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, currentUser]);

  // Removed UserDetails component and selectedUser state since we'll navigate to user profile page

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : searchResults.length > 0 ? (
        <div className={isMobile ? "space-y-3" : "space-y-2 max-h-96 overflow-y-auto"}>
          {searchResults.map((user) => (
            <div 
              key={user.id}
              className={`flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors ${isMobile ? "" : "max-w-2xl"}`}
              onClick={() => navigate(`/profile/${user.id}`)} // Changed to navigate to profile page
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {user.display_name?.charAt(0) || user.full_name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.display_name || user.full_name}
                </p>
                {user.username && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
                {user.bio && (
                  <p className="text-sm text-muted-foreground truncate">
                    {user.bio}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}
        </div>
      ) : searchQuery.trim() ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Search for users by username, name, or email</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;