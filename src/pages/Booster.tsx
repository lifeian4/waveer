import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Trash2, Users, Zap, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  display_name: string;
  full_name: string;
  avatar_url: string;
  follower_count: number;
}

interface FakeFollower {
  id: string;
  fake_username: string;
  fake_display_name: string;
  fake_avatar_url: string;
  fake_bio: string;
  is_active: boolean;
  created_at: string;
}

const Booster = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fakeFollowers, setFakeFollowers] = useState<FakeFollower[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFollower, setAddingFollower] = useState(false);
  
  // Fake follower form
  const [fakeUsername, setFakeUsername] = useState("");
  const [fakeDisplayName, setFakeDisplayName] = useState("");
  const [fakeBio, setFakeBio] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Bulk follower addition
  const [bulkFollowerCount, setBulkFollowerCount] = useState("");
  const [addingBulk, setAddingBulk] = useState(false);

  // Generate random fake data
  const generateRandomFollower = () => {
    const firstNames = ["Alex", "Jordan", "Casey", "Taylor", "Morgan", "Riley", "Avery", "Quinn", "Sage", "River"];
    const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Moore", "Taylor", "Anderson", "Thomas"];
    const adjectives = ["Cool", "Epic", "Super", "Mega", "Ultra", "Pro", "Elite", "Prime", "Max", "Ace"];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    const randomNum = Math.floor(Math.random() * 9999);
    
    setFakeUsername(`${adjective.toLowerCase()}${firstName.toLowerCase()}${randomNum}`);
    setFakeDisplayName(`${adjective} ${firstName}`);
    setFakeBio(`${firstName} ${lastName} | Content Creator | Living my best life ✨`);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Get follower counts for each user
      const usersWithCounts = await Promise.all(
        (data || []).map(async (user) => {
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', user.id)
            .eq('status', 'accepted');
          
          const { count: fakeCount } = await supabase
            .from('fake_followers')
            .select('*', { count: 'exact' })
            .eq('target_user_id', user.id)
            .eq('is_active', true);

          return {
            ...user,
            follower_count: (count || 0) + (fakeCount || 0)
          };
        })
      );

      setSearchResults(usersWithCounts);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const loadFakeFollowers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('fake_followers')
        .select('*')
        .eq('target_user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFakeFollowers(data || []);
    } catch (error) {
      console.error('Error loading fake followers:', error);
    }
  };

  const addFakeFollower = async () => {
    if (!selectedUser || !fakeUsername.trim()) {
      toast.error('Please fill in the username');
      return;
    }

    setAddingFollower(true);
    try {
      const { error } = await supabase
        .from('fake_followers')
        .insert({
          target_user_id: selectedUser.id,
          fake_username: fakeUsername,
          fake_display_name: fakeDisplayName || fakeUsername,
          fake_bio: fakeBio,
          created_by: currentUser?.id
        });

      if (error) throw error;

      toast.success('Fake follower added successfully!');
      setFakeUsername("");
      setFakeDisplayName("");
      setFakeBio("");
      setShowAddForm(false);
      
      // Reload fake followers and update user count
      await loadFakeFollowers(selectedUser.id);
      await updateUserFollowerCount();

    } catch (error) {
      console.error('Error adding fake follower:', error);
      toast.error('Failed to add fake follower');
    } finally {
      setAddingFollower(false);
    }
  };

  const addBulkFollowers = async () => {
    if (!selectedUser || !bulkFollowerCount.trim()) {
      toast.error('Please enter the number of followers');
      return;
    }

    const count = parseInt(bulkFollowerCount);
    if (isNaN(count) || count <= 0) {
      toast.error('Please enter a valid number');
      return;
    }

    if (count > 10000000) {
      toast.error('Maximum 10 million followers allowed');
      return;
    }

    setAddingBulk(true);
    try {
      // Generate bulk fake followers in batches
      const batchSize = 1000;
      const batches = Math.ceil(count / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const currentBatchSize = Math.min(batchSize, count - (i * batchSize));
        const fakeFollowersData = [];
        
        for (let j = 0; j < currentBatchSize; j++) {
          const randomNum = Math.floor(Math.random() * 999999);
          fakeFollowersData.push({
            target_user_id: selectedUser.id,
            fake_username: `user${randomNum}_${i}_${j}`,
            fake_display_name: `User ${randomNum}`,
            fake_bio: `Auto-generated follower #${i * batchSize + j + 1}`,
            created_by: currentUser?.id
          });
        }

        const { error } = await supabase
          .from('fake_followers')
          .insert(fakeFollowersData);

        if (error) throw error;
        
        // Show progress
        toast.success(`Added batch ${i + 1}/${batches} (${(i + 1) * batchSize} followers)`);
      }

      toast.success(`Successfully added ${count.toLocaleString()} fake followers!`);
      setBulkFollowerCount("");
      
      // Reload fake followers and update user count
      await loadFakeFollowers(selectedUser.id);
      await updateUserFollowerCount();

    } catch (error) {
      console.error('Error adding bulk followers:', error);
      toast.error('Failed to add bulk followers');
    } finally {
      setAddingBulk(false);
    }
  };

  const updateUserFollowerCount = async () => {
    if (!selectedUser) return;
    
    // Update selected user's follower count
    const { count: realCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact' })
      .eq('following_id', selectedUser.id)
      .eq('status', 'accepted');
    
    const { count: fakeCount } = await supabase
      .from('fake_followers')
      .select('*', { count: 'exact' })
      .eq('target_user_id', selectedUser.id)
      .eq('is_active', true);

    setSelectedUser({
      ...selectedUser,
      follower_count: (realCount || 0) + (fakeCount || 0)
    });
  };

  const removeFakeFollower = async (followerId: string) => {
    try {
      const { error } = await supabase
        .from('fake_followers')
        .update({ is_active: false })
        .eq('id', followerId);

      if (error) throw error;

      toast.success('Fake follower removed');
      
      if (selectedUser) {
        await loadFakeFollowers(selectedUser.id);
        await updateUserFollowerCount();
      }
    } catch (error) {
      console.error('Error removing fake follower:', error);
      toast.error('Failed to remove fake follower');
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    loadFakeFollowers(user.id);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-7xl mx-auto p-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-8 h-8 text-yellow-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  Follower Booster
                </h1>
              </div>
              <p className="text-muted-foreground">
                Search for users and add fake followers to boost their count
              </p>
            </div>

            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Users
                </CardTitle>
                <CardDescription>
                  Search by username, display name, or full name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  />
                  <Button onClick={searchUsers} disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Search Results:</h3>
                    <div className="grid gap-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedUser?.id === user.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => selectUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{user.display_name || user.full_name}</p>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                            <Badge variant="secondary">
                              <Users className="w-3 h-3 mr-1" />
                              {user.follower_count}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected User Management */}
            {selectedUser && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Add Fake Followers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Add Fake Followers
                    </CardTitle>
                    <CardDescription>
                      Add fake followers to @{selectedUser.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Current followers: <span className="font-medium">{selectedUser.follower_count.toLocaleString()}</span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddForm(!showAddForm)}
                      >
                        {showAddForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showAddForm ? 'Hide' : 'Show'} Individual Form
                      </Button>
                    </div>

                    {/* Bulk Follower Addition */}
                    <div className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        Bulk Add Followers
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter number (e.g., 100, 10000, 1000000)"
                          value={bulkFollowerCount}
                          onChange={(e) => setBulkFollowerCount(e.target.value)}
                          type="number"
                          min="1"
                          max="10000000"
                        />
                        <Button
                          onClick={addBulkFollowers}
                          disabled={addingBulk || !bulkFollowerCount.trim()}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          {addingBulk ? "Adding..." : "Add Bulk"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Add up to 10 million followers instantly! Perfect for reaching badge tiers.
                      </p>
                    </div>

                    {showAddForm && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="fake-username">Username *</Label>
                          <Input
                            id="fake-username"
                            placeholder="cooluser123"
                            value={fakeUsername}
                            onChange={(e) => setFakeUsername(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="fake-display-name">Display Name</Label>
                          <Input
                            id="fake-display-name"
                            placeholder="Cool User"
                            value={fakeDisplayName}
                            onChange={(e) => setFakeDisplayName(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="fake-bio">Bio</Label>
                          <Input
                            id="fake-bio"
                            placeholder="Living my best life ✨"
                            value={fakeBio}
                            onChange={(e) => setFakeBio(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={generateRandomFollower}
                            variant="outline"
                            className="flex-1"
                          >
                            Generate Random
                          </Button>
                          <Button
                            onClick={addFakeFollower}
                            disabled={addingFollower || !fakeUsername.trim()}
                            className="flex-1"
                          >
                            {addingFollower ? "Adding..." : "Add Follower"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Fake Followers List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Fake Followers ({fakeFollowers.length})
                    </CardTitle>
                    <CardDescription>
                      Manage fake followers for @{selectedUser.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fakeFollowers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No fake followers added yet
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {fakeFollowers.map((follower) => (
                          <div
                            key={follower.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div>
                              <p className="font-medium">@{follower.fake_username}</p>
                              <p className="text-sm text-muted-foreground">
                                {follower.fake_display_name}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFakeFollower(follower.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Booster;
