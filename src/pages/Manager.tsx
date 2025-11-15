import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, CheckCircle, XCircle, Users, LogOut, Search, Copy, ExternalLink, Calendar, Mail, Phone, Globe, Twitter, Linkedin, Github, Lock, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PaymentVerification {
  id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  sender_name: string;
  sender_phone: string;
  screenshot_url: string;
  plan_name: string;
  user_email: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  country_name: string;
  country_code: string;
  phone: string;
  phone_number: string;
  website: string;
  twitter: string;
  linkedin: string;
  github: string;
  is_private: boolean;
  onboarding_completed: boolean;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires_at: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string;
}

const Manager = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<PaymentVerification[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedTab, setSelectedTab] = useState("badge-verification");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  // Auto-refresh every 30 seconds when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetchPendingVerifications();
      fetchVerificationRequests();
      fetchUsers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = async () => {
    if (username !== "manager2008" || password !== "harroonn2008") {
      toast.error("Invalid credentials");
      return;
    }
    setIsLoggedIn(true);
    toast.success("Welcome to Manager Dashboard");
    fetchPendingVerifications();
    fetchVerificationRequests();
    fetchUsers();
  };

  const fetchPendingVerifications = async () => {
    try {
      setIsRefreshing(true);
      console.log('Fetching pending verifications...');
      
      // First, get all pending verifications
      const { data: verifications, error: verificationsError } = await supabase
        .from('payment_verifications')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (verificationsError) {
        console.error('Error fetching verifications:', verificationsError);
        throw verificationsError;
      }

      console.log('Found verifications:', verifications);

      if (!verifications || verifications.length === 0) {
        setPendingVerifications([]);
        return;
      }

      // Get transaction details for each verification
      const transactionIds = verifications.map(v => v.transaction_id);
      const { data: transactions, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('*')
        .in('id', transactionIds);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        throw transactionsError;
      }

      console.log('Found transactions:', transactions);

      // Get user profiles for email information
      const userIds = verifications.map(v => v.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Found profiles:', profiles);

      // Combine all data
      const formattedData: PaymentVerification[] = verifications.map(verification => {
        const transaction = transactions?.find(t => t.id === verification.transaction_id);
        const profile = profiles?.find(p => p.id === verification.user_id);
        
        return {
          id: verification.id,
          transaction_id: verification.transaction_id,
          user_id: verification.user_id,
          amount: transaction?.amount || 0,
          sender_name: transaction?.sender_name || '',
          sender_phone: transaction?.sender_phone || '',
          screenshot_url: transaction?.screenshot_url || '',
          plan_name: transaction?.plan_id || 'Unknown Plan',
          user_email: profile?.email || `user_${verification.user_id.slice(0, 8)}@example.com`
        };
      });

      console.log('Formatted verifications:', formattedData);
      setPendingVerifications(formattedData);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setPendingVerifications([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      
      // Fetch all user data from Supabase profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Found profiles:', profiles);

      const users: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        country_name: profile.country_name || '',
        country_code: profile.country_code || '',
        phone: profile.phone || '',
        phone_number: profile.phone_number || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        is_private: profile.is_private || false,
        onboarding_completed: profile.onboarding_completed || false,
        subscription_status: profile.subscription_status || 'inactive',
        subscription_plan: profile.subscription_plan || 'none',
        subscription_expires_at: profile.subscription_expires_at || '',
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || '',
        last_sign_in_at: profile.last_sign_in_at || ''
      })) || [];
      
      console.log('Formatted users:', users);
      setUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleApprovePayment = async (verificationId: string) => {
    try {
      console.log('Starting payment approval for verification:', verificationId);
      
      // Get verification details
      const verification = pendingVerifications.find(v => v.id === verificationId);
      if (!verification) {
        console.error('Verification not found:', verificationId);
        toast.error("Verification not found");
        return;
      }

      console.log('Verification details:', verification);

      // Update verification status
      console.log('Updating verification status...');
      const { error: verificationError } = await supabase
        .from('payment_verifications')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      if (verificationError) {
        console.error('Verification update error:', verificationError);
        throw new Error(`Verification update failed: ${verificationError.message}`);
      }

      // Update transaction status
      console.log('Updating transaction status...');
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .update({ status: 'approved' })
        .eq('id', verification.transaction_id);

      if (transactionError) {
        console.error('Transaction update error:', transactionError);
        throw new Error(`Transaction update failed: ${transactionError.message}`);
      }

      // Calculate correct subscription duration based on plan
      const planDurations = {
        'starter': 2,
        'pro': 5,
        'weekly': 7,
        'monthly': 30,
        '3-month': 90,
        '6-month': 180,
        'yearly-vip': 365
      };
      
      const durationDays = planDurations[verification.plan_name] || 30;
      const expirationDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      console.log('Activating user subscription for user:', verification.user_id);
      console.log('Plan:', verification.plan_name, 'Duration:', durationDays, 'days');
      
      // Activate user subscription
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: verification.plan_name,
          subscription_expires_at: expirationDate.toISOString()
        })
        .eq('id', verification.user_id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      console.log('Payment approved successfully!');
      toast.success("Payment approved and subscription activated");
      fetchPendingVerifications();
      fetchUsers();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast.error(error.message || "Failed to approve payment");
    }
  };

  const handleRejectPayment = async (verificationId: string) => {
    try {
      toast.success("Payment rejected");
      fetchPendingVerifications();
    } catch (error) {
      toast.error("Failed to reject payment");
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      console.log('Fetching badge verification requests...');
      
      // First check if table exists by trying a simple count
      const { count, error: countError } = await supabase
        .from('badge_verification_requests')
        .select('*', { count: 'exact', head: true });
      
      console.log('Table exists check - Count:', count, 'Error:', countError);
      
      if (countError) {
        console.error('Table does not exist or access denied:', countError);
        setVerificationRequests([]);
        return;
      }
      
      // Try without the profiles join first to see if that's the issue
      const { data, error } = await supabase
        .from('badge_verification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      console.log('Raw badge verification data:', data);
      
      // If we get data, then fetch profile info separately
      if (data && data.length > 0) {
        const enrichedData = await Promise.all(
          data.map(async (request) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, username, full_name, display_name, avatar_url')
              .eq('id', request.user_id)
              .single();
            
            return {
              ...request,
              profiles: profile
            };
          })
        );
        
        console.log('Enriched badge verification data:', enrichedData);
        setVerificationRequests(enrichedData);
        console.log('Updated verificationRequests state:', enrichedData.length);
        return;
      }
      
      console.log('Badge verification requests data:', data);
      console.log('Badge verification requests error:', error);

      if (error) throw error;
      setVerificationRequests(data || []);
    } catch (error) {
      console.error('Error fetching badge verification requests:', error);
      setVerificationRequests([]);
    }
  };

  const handleApproveVerification = async (requestId: string) => {
    try {
      console.log('Approving badge verification request:', requestId);
      
      const request = verificationRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Request not found:', requestId);
        toast.error('Request not found');
        return;
      }

      console.log('Found request:', request);

      // 1. Update badge verification request status
      const { error: requestError } = await supabase
        .from('badge_verification_requests')
        .update({
          status: 'approved',
          admin_notes: 'Approved by manager2008'
        })
        .eq('id', requestId);

      if (requestError) {
        console.error('Error updating request status:', requestError);
        throw requestError;
      }

      // 2. Create the badge in wave_badges table
      const badgeTiers = [
        { id: 'rising_wave', name: 'Rising Wave', minFollowers: 100 },
        { id: 'flow_creator', name: 'Flow Creator', minFollowers: 1000 },
        { id: 'trending_wave', name: 'Trending Wave', minFollowers: 10000 },
        { id: 'elite_wave', name: 'Elite Wave', minFollowers: 100000 },
        { id: 'wave_king', name: 'Wave King/Queen', minFollowers: 1000000 }
      ];

      const selectedTier = badgeTiers.find(tier => tier.id === request.requested_badge_tier);
      
      const { error: badgeError } = await supabase
        .from('wave_badges')
        .upsert({
          user_id: request.user_id,
          badge_category: 'follower_count',
          badge_tier: request.requested_badge_tier,
          badge_name: selectedTier?.name || 'Wave Badge',
          follower_count: request.follower_count,
          is_active: true
        }, {
          onConflict: 'user_id,badge_category'
        });

      if (badgeError) {
        console.error('Error creating badge:', badgeError);
        throw badgeError;
      }

      // 3. Update user profile to verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verification_approved_at: new Date().toISOString()
        })
        .eq('id', request.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      toast.success(`Badge approved! User now has ${selectedTier?.name} badge.`);
      fetchVerificationRequests();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error(`Failed to approve verification: ${error.message}`);
    }
  };

  const handleRejectVerification = async (requestId: string, reason?: string) => {
    try {
      console.log('Rejecting badge verification request:', requestId);
      
      const { error } = await supabase
        .from('badge_verification_requests')
        .update({
          status: 'rejected',
          admin_notes: reason || 'Request rejected by manager2008'
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        throw error;
      }

      toast.success('Badge request rejected');
      fetchVerificationRequests();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error(`Failed to reject verification: ${error.message}`);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Manager Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager2008"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Manager Dashboard</h1>
          <Button onClick={() => setIsLoggedIn(false)} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="verifications">Payment Verifications ({pendingVerifications.length})</TabsTrigger>
            <TabsTrigger value="badge-verification">Badge Verification ({verificationRequests.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Pending Verifications</h2>
              <Button 
                onClick={fetchPendingVerifications} 
                variant="outline"
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {pendingVerifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending verifications</p>
                </CardContent>
              </Card>
            ) : (
              pendingVerifications.map((verification) => (
                <Card key={verification.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{verification.sender_name}</h3>
                            <p className="text-sm text-muted-foreground">{verification.user_email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Plan:</span>
                            <p>{verification.plan_name}</p>
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span>
                            <p>{verification.amount.toLocaleString()} RWF</p>
                          </div>
                          <div>
                            <span className="font-medium">Sender Phone:</span>
                            <p>{verification.sender_phone}</p>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                        </div>

                        {verification.screenshot_url && (
                          <div>
                            <span className="font-medium text-sm">Payment Screenshot:</span>
                            <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-blue-600 font-medium">IMG</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Screenshot uploaded</p>
                                  <p className="text-xs text-muted-foreground">Payment proof image</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleApprovePayment(verification.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectPayment(verification.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="badge-verification" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Badge Verification Requests</h2>
              <Button 
                onClick={fetchVerificationRequests} 
                variant="outline"
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {verificationRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending verification requests</p>
                </CardContent>
              </Card>
            ) : (
              verificationRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.profiles?.avatar_url} />
                            <AvatarFallback>
                              {request.profiles?.display_name?.charAt(0) || request.profiles?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {request.profiles?.display_name || request.profiles?.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{request.profiles?.username}</p>
                            <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Instagram:</span>
                            <p>@{request.instagram_username}</p>
                          </div>
                          <div>
                            <span className="font-medium">Followers:</span>
                            <p>{formatCount(request.follower_count || 0)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Requested Badge:</span>
                            <p className="capitalize">{request.requested_badge_tier?.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <span className="font-medium">Request Date:</span>
                            <p>{new Date(request.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">Request Type:</span>
                            <p>Badge Verification</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleApproveVerification(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectVerification(request.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Users: {users.length} | Showing: {filteredUsers.length}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={fetchUsers} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>User Details</CardTitle>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedUser(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-start gap-4">
                    {selectedUser.avatar_url ? (
                      <img 
                        src={selectedUser.avatar_url} 
                        alt={selectedUser.display_name || selectedUser.full_name}
                        className="w-24 h-24 rounded-full object-cover border-2"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-xl font-bold">{selectedUser.display_name || selectedUser.full_name || 'No Name'}</h3>
                        <p className="text-sm text-muted-foreground">@{selectedUser.username || 'no-username'}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={selectedUser.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {selectedUser.subscription_status}
                        </Badge>
                        {selectedUser.subscription_plan && selectedUser.subscription_plan !== 'none' && (
                          <Badge variant="outline">{selectedUser.subscription_plan}</Badge>
                        )}
                        {selectedUser.is_private && (
                          <Badge variant="outline">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                        <Badge variant={selectedUser.onboarding_completed ? 'default' : 'secondary'}>
                          {selectedUser.onboarding_completed ? 'Onboarded' : 'Pending Onboarding'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <Label className="text-xs text-muted-foreground">BIO</Label>
                      <p className="mt-1">{selectedUser.bio}</p>
                    </div>
                  )}

                  {/* Contact & Social Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground">EMAIL</Label>
                          <p className="text-sm truncate">{selectedUser.email}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedUser.email);
                            toast.success("Email copied!");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {selectedUser.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground">PHONE</Label>
                          <p className="text-sm truncate">{selectedUser.phone}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedUser.phone);
                            toast.success("Phone copied!");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {selectedUser.country_name && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">COUNTRY</Label>
                          <p className="text-sm">
                            {selectedUser.country_name}
                            {selectedUser.country_code && (
                              <span className="ml-2 text-xs font-mono text-muted-foreground">({selectedUser.country_code})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedUser.website && (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-muted-foreground">WEBSITE</Label>
                          <a 
                            href={selectedUser.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline truncate block"
                          >
                            {selectedUser.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedUser.twitter && (
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">TWITTER</Label>
                          <p className="text-sm">{selectedUser.twitter}</p>
                        </div>
                      </div>
                    )}

                    {selectedUser.linkedin && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">LINKEDIN</Label>
                          <p className="text-sm">{selectedUser.linkedin}</p>
                        </div>
                      </div>
                    )}

                    {selectedUser.github && (
                      <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">GITHUB</Label>
                          <p className="text-sm">{selectedUser.github}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subscription Info */}
                  {selectedUser.subscription_expires_at && (
                    <div>
                      <Label className="text-xs text-muted-foreground">SUBSCRIPTION EXPIRES</Label>
                      <p className="text-sm mt-1">
                        {new Date(selectedUser.subscription_expires_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* System Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-xs text-muted-foreground">USER ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                          {selectedUser.id}
                        </code>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedUser.id);
                            toast.success("ID copied!");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">CREATED AT</Label>
                      <p className="text-sm mt-1">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>

                    {selectedUser.last_sign_in_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground">LAST SIGN IN</Label>
                        <p className="text-sm mt-1">
                          {new Date(selectedUser.last_sign_in_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}

                    {selectedUser.updated_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground">UPDATED AT</Label>
                        <p className="text-sm mt-1">
                          {new Date(selectedUser.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Database-Style Table */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-10">
                        id
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        username
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        full_name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        display_name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        avatar_url
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        bio
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        country_name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        country_code
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        phone
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        phone_number
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        website
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        twitter
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        linkedin
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        github
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        is_private
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        onboarding_completed
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        subscription_status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        subscription_plan
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        subscription_expires_at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        created_at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        updated_at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        last_sign_in_at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap sticky right-0 bg-muted/50">
                        actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={24} className="px-3 py-12 text-center text-muted-foreground">
                          {searchQuery ? 'No users found matching your search' : 'No users found'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 text-xs font-mono text-muted-foreground sticky left-0 bg-card hover:bg-muted/30 z-10">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground/50">{index + 1}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(user.id);
                                  toast.success("ID copied!");
                                }}
                                className="hover:text-foreground truncate max-w-[150px]"
                                title={user.id}
                              >
                                {user.id.slice(0, 8)}...
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs max-w-[200px]">
                            {user.email ? (
                              <span className="truncate block" title={user.email}>{user.email}</span>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.username || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.full_name || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.display_name || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.avatar_url ? (
                              <div className="flex items-center gap-2">
                                <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={user.avatar_url}>
                                  {user.avatar_url}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs max-w-[200px]">
                            {user.bio ? (
                              <span className="truncate block" title={user.bio}>{user.bio}</span>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.country_name || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {user.country_code || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.phone || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.phone_number || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs max-w-[150px]">
                            {user.website ? (
                              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block" title={user.website}>
                                {user.website}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.twitter || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.linkedin || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.github || <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {user.is_private ? 'TRUE' : 'FALSE'}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            <span className={user.onboarding_completed ? 'text-green-600 font-medium' : 'text-orange-600'}>
                              {user.onboarding_completed ? 'TRUE' : 'FALSE'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <span className={user.subscription_status === 'active' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              {user.subscription_status || 'inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {user.subscription_plan && user.subscription_plan !== 'none' ? user.subscription_plan : <span className="text-muted-foreground">NULL</span>}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {user.subscription_expires_at ? (
                              <span title={user.subscription_expires_at}>
                                {new Date(user.subscription_expires_at).toISOString().split('T')[0]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {user.created_at ? (
                              <span title={user.created_at}>
                                {new Date(user.created_at).toISOString().replace('T', ' ').split('.')[0]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {user.updated_at ? (
                              <span title={user.updated_at}>
                                {new Date(user.updated_at).toISOString().split('T')[0]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-mono">
                            {user.last_sign_in_at ? (
                              <span title={user.last_sign_in_at}>
                                {new Date(user.last_sign_in_at).toISOString().replace('T', ' ').split('.')[0]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">NULL</span>
                            )}
                          </td>
                          <td className="px-3 py-2 sticky right-0 bg-card hover:bg-muted/30">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setSelectedUser(user)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Page 1 of 1 • {filteredUsers.length} rows • {filteredUsers.length} records
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-6 text-xs" disabled>Data</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" disabled>Definition</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Manager;
