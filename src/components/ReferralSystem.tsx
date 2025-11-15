import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Copy, Check, Users, Award, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Referral {
  id: string;
  referred_id: string | null;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_type: string | null;
  reward_value: number | null;
  created_at: string;
  completed_at: string | null;
  referred_user?: {
    username: string;
    avatar_url: string;
  };
}

export default function ReferralSystem() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalRewards: 0,
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrCreateReferralCode();
      fetchReferrals();
    }
  }, [user]);

  const fetchOrCreateReferralCode = async () => {
    if (!user) return;

    try {
      // Check if user already has a referral code
      const { data: existing, error: fetchError } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .limit(1)
        .single();

      if (existing) {
        setReferralCode(existing.referral_code);
      } else {
        // Generate new referral code
        const code = generateReferralCode();
        
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: user.id,
            referral_code: code,
            status: 'pending',
          });

        if (!insertError) {
          setReferralCode(code);
        }
      }
    } catch (error) {
      console.error('Error fetching/creating referral code:', error);
    }
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const fetchReferrals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:profiles!referred_id(username, avatar_url)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const completed = data?.filter(r => r.status === 'completed' || r.status === 'rewarded').length || 0;
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const totalRewards = data?.reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0;

      setStats({ total, completed, pending, totalRewards });
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    const text = `Join me on Waveer! Use my referral code ${referralCode} and get 1 week of premium free! 🎬`;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'outline', label: 'Pending' },
      completed: { variant: 'default', label: 'Completed' },
      rewarded: { variant: 'default', label: 'Rewarded' },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-secondary rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share your code and earn rewards when friends sign up!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/signup?ref=${referralCode}`}
              readOnly
              className="flex-1 font-mono"
            />
            <Button onClick={copyReferralLink} variant="outline">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => shareReferral('twitter')}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={() => shareReferral('facebook')}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button
              onClick={() => shareReferral('whatsapp')}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <div className="bg-card/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Rewards
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Your friend gets 1 week of premium free</li>
              <li>• You get 1 week of premium when they sign up</li>
              <li>• Earn 100 coins for each successful referral</li>
              <li>• Unlock exclusive badges at 5, 10, and 25 referrals</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold">{stats.totalRewards}</p>
              <p className="text-sm text-muted-foreground">Coins Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>
            Track your referrals and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No referrals yet. Start sharing your code!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {referral.referred_user ? (
                      <>
                        <img
                          src={referral.referred_user.avatar_url || '/default-avatar.png'}
                          alt={referral.referred_user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">
                            {referral.referred_user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(referral.completed_at || referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="font-semibold">Pending Sign-up</p>
                        <p className="text-xs text-muted-foreground">
                          Invited {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {referral.reward_value && (
                      <Badge variant="outline" className="gap-1">
                        <Award className="w-3 h-3" />
                        {referral.reward_value} coins
                      </Badge>
                    )}
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
