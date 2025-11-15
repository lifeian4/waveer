import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Film, Tv, MessageSquare, Star, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface UserStatsCardProps {
  userId: string;
}

interface UserStats {
  total_watch_time: number;
  movies_watched: number;
  series_watched: number;
  comments_posted: number;
  reviews_posted: number;
  parties_hosted: number;
  parties_joined: number;
  xp_points: number;
  level: number;
}

interface UserBadge {
  id: string;
  badge: {
    name: string;
    description: string;
    icon: string;
    category: string;
  };
  earned_at: string;
}

export default function UserStatsCard({ userId }: UserStatsCardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    fetchUserStats();
    fetchUserBadges();
    fetchFollowCounts();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setStats(data || {
        total_watch_time: 0,
        movies_watched: 0,
        series_watched: 0,
        comments_posted: 0,
        reviews_posted: 0,
        parties_hosted: 0,
        parties_joined: 0,
        xp_points: 0,
        level: 1,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge:badges(name, description, icon, category)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);

      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const getLevelProgress = () => {
    if (!stats) return 0;
    const xpForNextLevel = stats.level * 1000;
    const xpInCurrentLevel = stats.xp_points % 1000;
    return (xpInCurrentLevel / xpForNextLevel) * 100;
  };

  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Level {stats.level}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.xp_points} XP</span>
              <span>{stats.level * 1000} XP</span>
            </div>
            <Progress value={getLevelProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats.level * 1000 - (stats.xp_points % 1000)} XP to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Film className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.movies_watched}</p>
              <p className="text-sm text-muted-foreground">Movies</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Tv className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.series_watched}</p>
              <p className="text-sm text-muted-foreground">Series</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.comments_posted}</p>
              <p className="text-sm text-muted-foreground">Comments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.reviews_posted}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.parties_hosted}</p>
              <p className="text-sm text-muted-foreground">Parties Hosted</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{formatWatchTime(stats.total_watch_time)}</p>
              <p className="text-sm text-muted-foreground">Watch Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Social
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{followerCount}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{followingCount}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badges ({badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex flex-col items-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                  title={userBadge.badge.description}
                >
                  <span className="text-4xl mb-2">{userBadge.badge.icon}</span>
                  <p className="text-xs text-center font-medium">{userBadge.badge.name}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {userBadge.badge.category}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
