import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getTrendingMovies, getTrendingTVShows } from '@/lib/tmdb';
import { Flame, TrendingUp, Clock, MessageSquare, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface TrendingMedia {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  views: number;
  comments: number;
  rating: number;
  trending_score: number;
}

interface TrendingUser {
  id: string;
  username: string;
  avatar_url: string;
  followers_count: number;
  content_count: number;
}

export default function Trending() {
  const navigate = useNavigate();
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingShows, setTrendingShows] = useState<any[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<TrendingUser[]>([]);
  const [mostCommented, setMostCommented] = useState<TrendingMedia[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<TrendingMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('week');

  useEffect(() => {
    fetchTrendingContent();
  }, [timeWindow]);

  const fetchTrendingContent = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTrendingMoviesShows(),
        fetchTrendingUsers(),
        fetchMostCommented(),
        fetchRecentlyWatched(),
      ]);
    } catch (error) {
      console.error('Error fetching trending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingMoviesShows = async () => {
    try {
      const [movies, shows] = await Promise.all([
        getTrendingMovies(timeWindow),
        getTrendingTVShows(timeWindow),
      ]);

      setTrendingMovies(movies.slice(0, 10));
      setTrendingShows(shows.slice(0, 10));
    } catch (error) {
      console.error('Error fetching trending movies/shows:', error);
    }
  };

  const fetchTrendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          followers:user_follows!following_id(count),
          content:creator_content(count)
        `)
        .order('followers', { ascending: false })
        .limit(10);

      if (error) throw error;

      const users = data?.map(user => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        followers_count: user.followers?.[0]?.count || 0,
        content_count: user.content?.[0]?.count || 0,
      })) || [];

      setTrendingUsers(users);
    } catch (error) {
      console.error('Error fetching trending users:', error);
    }
  };

  const fetchMostCommented = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('media_id, media_type, count')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      if (error) throw error;

      // Group by media_id and count
      const commentCounts = data?.reduce((acc: any, curr) => {
        const key = `${curr.media_id}_${curr.media_type}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort
      const sorted = Object.entries(commentCounts || {})
        .map(([key, count]) => {
          const [media_id, media_type] = key.split('_');
          return { media_id, media_type, count: count as number };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setMostCommented(sorted as any);
    } catch (error) {
      console.error('Error fetching most commented:', error);
    }
  };

  const fetchRecentlyWatched = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('media_id, media_type, media_title, media_poster')
        .eq('activity_type', 'watched')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get unique media
      const uniqueMedia = Array.from(
        new Map(data?.map(item => [`${item.media_id}_${item.media_type}`, item])).values()
      ).slice(0, 10);

      setRecentlyWatched(uniqueMedia as any);
    } catch (error) {
      console.error('Error fetching recently watched:', error);
    }
  };

  const handleMediaClick = (id: string | number, type: 'movie' | 'series') => {
    const path = type === 'movie' ? `/movies/${id}` : `/series/${id}`;
    navigate(path);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-secondary rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-secondary rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-500" />
          <h1 className="text-4xl font-bold">Trending</h1>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={timeWindow === 'day' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeWindow('day')}
          >
            Today
          </Badge>
          <Badge
            variant={timeWindow === 'week' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeWindow('week')}
          >
            This Week
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="movies" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="shows">TV Shows</TabsTrigger>
          <TabsTrigger value="users">Creators</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Movies Tab */}
        <TabsContent value="movies" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingMovies.map((movie, index) => (
              <Card
                key={movie.id}
                className="cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                onClick={() => handleMediaClick(movie.id, 'movie')}
              >
                <div className="relative">
                  <img
                    src={movie.poster_path || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-orange-500 text-white">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-white/80">
                        {movie.vote_average?.toFixed(1)} ⭐
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TV Shows Tab */}
        <TabsContent value="shows" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingShows.map((show, index) => (
              <Card
                key={show.id}
                className="cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                onClick={() => handleMediaClick(show.id, 'series')}
              >
                <div className="relative">
                  <img
                    src={show.poster_path || '/placeholder-movie.jpg'}
                    alt={show.name}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-orange-500 text-white">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {show.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-white/80">
                        {show.vote_average?.toFixed(1)} ⭐
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingUsers.map((user, index) => (
              <Card
                key={user.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleUserClick(user.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={user.avatar_url || '/default-avatar.png'}
                        alt={user.username}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.username}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{user.followers_count} followers</span>
                        <span>{user.content_count} videos</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Most Commented */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Most Discussed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mostCommented.map((item: any, index) => (
                  <div
                    key={`${item.media_id}_${item.media_type}`}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => handleMediaClick(item.media_id, item.media_type)}
                  >
                    <Badge variant="outline">#{index + 1}</Badge>
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{item.media_id}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} comments
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recently Watched */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recently Watched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {recentlyWatched.map((item: any) => (
                  <div
                    key={`${item.media_id}_${item.media_type}`}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleMediaClick(item.media_id, item.media_type)}
                  >
                    <img
                      src={item.media_poster || '/placeholder-movie.jpg'}
                      alt={item.media_title}
                      className="w-full aspect-[2/3] object-cover rounded-lg"
                    />
                    <p className="text-sm font-medium mt-2 truncate">
                      {item.media_title}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
