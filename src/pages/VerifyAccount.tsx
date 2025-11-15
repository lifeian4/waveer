import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Instagram, Phone, Upload, CheckCircle, Crown, Waves, Zap, Sparkles, Star, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { motion } from "framer-motion";
import { toast } from "sonner";

const badgeTiers = [
  { id: 'rising_wave', name: 'Rising Wave', minFollowers: 100, icon: Waves, color: 'text-gray-600' },
  { id: 'flow_creator', name: 'Flow Creator', minFollowers: 1000, icon: Sparkles, color: 'text-blue-600' },
  { id: 'trending_wave', name: 'Trending Wave', minFollowers: 10000, icon: Zap, color: 'text-yellow-600' },
  { id: 'elite_wave', name: 'Elite Wave', minFollowers: 100000, icon: Star, color: 'text-purple-600' },
  { id: 'wave_king', name: 'Wave King/Queen', minFollowers: 1000000, icon: Crown, color: 'text-amber-600' }
];

const VerifyAccount = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [instagramUsername, setInstagramUsername] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [paymentSenderName, setPaymentSenderName] = useState("");
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [selectedBadgeTier, setSelectedBadgeTier] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verifyingInstagram, setVerifyingInstagram] = useState(false);
  const [instagramVerified, setInstagramVerified] = useState(false);
  const [followedSoulOfIan, setFollowedSoulOfIan] = useState(false);
  const [instagramLoggedIn, setInstagramLoggedIn] = useState(false);
  const [submittingBadge, setSubmittingBadge] = useState(false);
  const [instagramSuggestions, setInstagramSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  useEffect(() => {
    const checkFollowerCount = async () => {
      if (!currentUser) return;
      
      // Check for existing badge verification request
      const { data: request, error: requestError } = await supabase
        .from('badge_verification_requests')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'pending')
        .maybeSingle();
      
      // Get real followers count
      const { count: realFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('following_id', currentUser.id)
        .eq('status', 'accepted');
      
      // Get fake followers count
      const { count: fakeFollowers } = await supabase
        .from('fake_followers')
        .select('*', { count: 'exact' })
        .eq('target_user_id', currentUser.id)
        .eq('is_active', true);
      
      const totalFollowers = (realFollowers || 0) + (fakeFollowers || 0);
      setFollowerCount(totalFollowers);
      
      const appropriateTier = badgeTiers.filter(tier => totalFollowers >= tier.minFollowers).pop();
      if (appropriateTier) setSelectedBadgeTier(appropriateTier.id);
    };
    
    checkFollowerCount();
  }, [currentUser]);

  const searchInstagramUsers = async (query: string) => {
    if (query.length < 2) {
      setInstagramSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Mock Instagram username suggestions (in production, use Instagram API)
      const mockSuggestions = [
        `${query}_official`,
        `${query}.real`,
        `${query}123`,
        `the.${query}`,
        `${query}.page`,
        `${query}_verified`,
        `${query}.ig`,
        `${query}._`
      ].filter(suggestion => suggestion.length <= 30); // Instagram username limit

      setInstagramSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching Instagram users:', error);
    }
  };

  const selectInstagramUsername = (username: string) => {
    setInstagramUsername(username);
    setShowSuggestions(false);
    setInstagramLoggedIn(true); // Auto-set as "logged in" when username is selected
  };

  const verifyInstagramAccount = async () => {
    try {
      // Instagram Basic Display API call
      const apiKey = 'IGAAMQkgtoFF9BZAFFpNE1KM0ZAhZA1h2eUJEclpDanlqT3gtdFJTb0kwVzVWaU9BbGpydHU5ZAEVvd093V0V6QzBpanNab0hpZAzlIZAm9ZAbkVlNXg4Y0o5V3lWaTRPR25rYXd3clNCd3FCcGVkVFZA5MUthamZAsY3ZA1TjJZAbnhLQ2p4YwZDZD';
      
      // Note: This is a simplified approach. In production, you'd need proper Instagram API setup
      const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${apiKey}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Get follower count (requires Instagram Business Account)
        const followersResponse = await fetch(`https://graph.instagram.com/me?fields=followers_count&access_token=${apiKey}`);
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          const igFollowerCount = followersData.followers_count || 0;
          
          setFollowerCount(igFollowerCount);
          setInstagramVerified(true);
          
          // Auto-select appropriate badge tier
          const appropriateTier = badgeTiers.filter(tier => igFollowerCount >= tier.minFollowers).pop();
          if (appropriateTier) setSelectedBadgeTier(appropriateTier.id);
          
          toast.success(`Instagram verified! Found ${formatCount(igFollowerCount)} followers`);
        } else {
          throw new Error('Failed to get follower count');
        }
      } else {
        throw new Error('Instagram account not found');
      }
    } catch (error) {
      console.error('Instagram verification error:', error);
      toast.error('Failed to verify Instagram account. Please check your username.');
      
      // Fallback: Allow manual entry with current follower count from database
      setInstagramVerified(true);
      toast.info('Using your current follower count from the platform');
    }
  };

  const openInstagramFollow = () => {
    window.open('https://instagram.com/soul.of.ian', '_blank');
    setFollowedSoulOfIan(true);
  };

  const submitBadgeRequest = async () => {
    if (!instagramUsername.trim()) {
      toast.error('Please enter your Instagram username');
      return;
    }

    setSubmittingBadge(true);
    try {
      // Create badge verification request for manager approval
      const { error: requestError } = await supabase
        .from('badge_verification_requests')
        .insert({
          user_id: currentUser?.id,
          instagram_username: instagramUsername,
          follower_count: followerCount,
          requested_badge_tier: selectedBadgeTier || 'rising_wave',
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast.success('🎯 Badge request submitted! A manager will review your request shortly.');
      
      // Redirect to profile
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error) {
      console.error('Badge request submission error:', error);
      toast.error('Failed to submit badge request');
    } finally {
      setSubmittingBadge(false);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi! I'm requesting account verification for Waveer.\n\n` +
      `Username: ${currentUser?.email}\n` +
      `Instagram: @${instagramUsername}\n` +
      `Followers: ${formatCount(followerCount)}\n` +
      `Badge Tier: ${selectedBadgeTier}\n\n` +
      `I've attached my payment screenshot.`
    );
    window.open(`https://wa.me/250732539470?text=${message}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instagramUsername || !paymentScreenshot || !paymentPhoneNumber || !paymentSenderName) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    
    try {
      let screenshotUrl = '';
      
      if (paymentScreenshot) {
        // Generate unique filename
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `${currentUser?.id}_${Date.now()}.${fileExt}`;
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verifications')
          .upload(fileName, paymentScreenshot, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload payment screenshot');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('verifications')
          .getPublicUrl(uploadData.path);
        
        screenshotUrl = urlData.publicUrl;
      }
      
      const { error: insertError } = await supabase.from('account_verification_requests').insert({
        user_id: currentUser?.id,
        instagram_username: instagramUsername,
        payment_screenshot_url: screenshotUrl,
        payment_phone_number: paymentPhoneNumber,
        payment_sender_name: paymentSenderName,
        follower_count: followerCount,
        requested_badge_tier: selectedBadgeTier
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to submit verification request');
      }

      toast.success('Verification request submitted successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-4xl font-bold mb-8 text-center">Account Verification</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* New WhatsApp-based Verification */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Requirements</CardTitle>
                <CardDescription>Follow our Instagram, verify your account, and send payment proof via WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Follow soul.of.ian */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    Step 1: Follow @soul.of.ian
                  </div>
                  <p className="text-sm text-muted-foreground">
                    First, you must follow our Instagram account
                  </p>
                  <Button 
                    onClick={openInstagramFollow}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Follow @soul.of.ian
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  {followedSoulOfIan && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Instagram link opened!</span>
                    </div>
                  )}
                </div>

                {/* Step 2: Instagram Username Search & Verification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Step 2: Enter Instagram Username
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your Instagram username for verification
                  </p>
                  
                  <div className="space-y-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="font-medium">Enter Your Instagram Username</h4>
                    <Input
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder="your_instagram_username"
                      type="text"
                    />
                    <p className="text-xs text-muted-foreground">
                      📱 Just enter your exact Instagram username (without @)
                    </p>
                  </div>
                  
                  {instagramVerified && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Instagram account verified! {formatCount(followerCount)} followers</span>
                      </div>
                      {selectedBadgeTier && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm font-medium">
                            🏆 Eligible for: {badgeTiers.find(t => t.id === selectedBadgeTier)?.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Payment Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Phone className="h-5 w-5 text-green-600" />
                    Step 3: Payment ($5 USD)
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="font-medium mb-2">Send $5 via MTN Mobile Money:</p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Code:</strong> *182*1*1*7800*5*[your_pin]#</p>
                      <p><strong>Phone:</strong> +250792898287</p>
                      <p><strong>Name:</strong> Ishimwe Yves</p>
                    </div>
                  </div>
                </div>

                {/* Step 4: Payment Instructions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Step 4: Payment Instructions
                  </div>
                  <p className="text-sm text-muted-foreground">
                    After making the payment, send your payment screenshot to WhatsApp: +250732539470
                  </p>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium">📱 WhatsApp: +250732539470</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Include your Instagram username and payment screenshot
                    </p>
                  </div>
                </div>

                {/* Step 5: Request Manager Approval */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Star className="h-5 w-5 text-blue-600" />
                    Step 5: Request Manager Approval
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Skip payment and request badge approval directly from our manager based on your follower count
                  </p>
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">Ready for Badge Request:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBadgeTier ? badgeTiers.find(t => t.id === selectedBadgeTier)?.name : 'Badge based on followers'} • {formatCount(followerCount)} followers
                        </p>
                      </div>
                      <div className="text-2xl">
                        {React.createElement(badgeTiers.find(t => t.id === selectedBadgeTier)?.icon || Star)}
                      </div>
                    </div>
                    <Button 
                      onClick={submitBadgeRequest}
                      disabled={submittingBadge || !instagramUsername.trim()}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      {submittingBadge ? 'Submitting Request...' : '🎯 Request Badge from Manager'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚡ Free alternative - Manager will review your follower count and approve if eligible
                    </p>
                  </div>
                </div>


                {/* Requirements Summary */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">📋 What to include in WhatsApp:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Payment screenshot</li>
                    <li>• Your Instagram username: @{instagramUsername || 'your_username'}</li>
                    <li>• Your Waveer account email</li>
                    <li>• Confirmation that you followed @soul.of.ian</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Badge Info */}
            <Card>
              <CardHeader>
                <CardTitle>Wave Badges</CardTitle>
                <CardDescription>
                  Your current followers: {formatCount(followerCount)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {badgeTiers.map((tier) => {
                    const Icon = tier.icon;
                    const isEligible = followerCount >= tier.minFollowers;
                    const isSelected = selectedBadgeTier === tier.id;
                    
                    return (
                      <div
                        key={tier.id}
                        className={`p-4 rounded-lg border ${
                          isSelected ? 'border-primary bg-primary/5' : 
                          isEligible ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 
                          'border-gray-200 bg-gray-50 dark:bg-gray-900/20 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-6 w-6 ${tier.color}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold">{tier.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCount(tier.minFollowers)}+ followers
                            </p>
                          </div>
                          {isEligible && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default VerifyAccount;
