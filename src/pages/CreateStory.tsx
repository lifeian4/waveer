import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  Music,
  Type,
  Clock,
  ArrowLeft,
  Search,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  album: {
    images: { url: string }[];
  };
}

const CreateStory = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [duration, setDuration] = useState(5);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
  // Music search
  const [musicSearch, setMusicSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [searching, setSearching] = useState(false);
  
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Check file type
    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('video/') ? 'video' : null;
    
    if (!type) {
      toast.error("Please upload an image or video file");
      return;
    }

    // For videos, check duration
    if (type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 300) { // 5 minutes = 300 seconds
          toast.error("Video duration must be less than 5 minutes");
          return;
        }
        setDuration(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    }

    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
  };

  const searchSpotifyTracks = async () => {
    if (!musicSearch.trim()) return;

    setSearching(true);
    try {
      // Get Spotify access token
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(
            `${import.meta.env.VITE_SPOTIFY_CLIENT_ID}:${import.meta.env.VITE_SPOTIFY_CLIENT_SECRET}`
          ),
        },
        body: 'grant_type=client_credentials',
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Search for tracks
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(musicSearch)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const searchData = await searchResponse.json();
      setSearchResults(searchData.tracks?.items || []);
    } catch (error) {
      console.error('Error searching Spotify:', error);
      toast.error('Failed to search music');
    } finally {
      setSearching(false);
    }
  };

  const uploadToSupabase = async (file: File): Promise<{ path: string; url: string }> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase storage (using 'posts' bucket)
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('Failed to upload file');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl
    };
  };

  const handleCreateStory = async () => {
    if (!currentUser) {
      toast.error("You must be logged in");
      return;
    }

    if (!mediaFile) {
      toast.error("Please upload an image or video");
      return;
    }

    setUploading(true);
    try {
      // Upload media to Supabase storage
      const { path, url } = await uploadToSupabase(mediaFile);

      // Prepare story data
      const storyData = {
        user_id: currentUser.id,
        storage_path: path,
        storage_url: url,
        title: title || null,
        text_content: textContent || null,
        duration: duration,
        music_track_id: selectedTrack?.id || null,
        music_track_name: selectedTrack?.name || null,
        music_artist_name: selectedTrack?.artists[0]?.name || null,
        music_preview_url: selectedTrack?.preview_url || null,
      };

      // Insert into appropriate table based on media type
      const tableName = mediaType === 'image' ? 'user_stories_images' : 'user_stories_videos';
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(storyData);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      toast.success("Story created successfully!");
      navigate('/chat');
    } catch (error) {
      console.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-20 pb-8 px-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Create Story</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Preview */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Preview</h2>
              <div className="relative aspect-[9/16] bg-muted rounded-xl overflow-hidden">
                {mediaPreview ? (
                  <>
                    {mediaType === 'image' ? (
                      <img
                        src={mediaPreview}
                        alt="Story preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Overlay content */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 p-6 flex flex-col justify-between">
                      {/* Top: User info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white">
                          <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {currentUser?.user_metadata?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-white">
                          <p className="font-semibold">
                            {currentUser?.user_metadata?.display_name || currentUser?.user_metadata?.full_name}
                          </p>
                          <p className="text-xs opacity-80">Just now</p>
                        </div>
                      </div>

                      {/* Bottom: Title and text */}
                      <div className="text-white space-y-2">
                        {title && <h3 className="text-2xl font-bold">{title}</h3>}
                        {textContent && <p className="text-sm">{textContent}</p>}
                        {selectedTrack && (
                          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2 w-fit">
                            <Music className="w-4 h-4" />
                            <span className="text-xs">
                              {selectedTrack.name} - {selectedTrack.artists[0]?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Upload className="w-16 h-16 mx-auto mb-4" />
                      <p>Upload media to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-6">
              {/* Media Upload */}
              <div className="space-y-2">
                <Label htmlFor="media">Media (Image or Video) *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    id="media"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="media" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload image or video
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max 50MB • Videos max 5 minutes
                    </p>
                  </label>
                  {mediaFile && (
                    <p className="mt-2 text-sm font-medium">{mediaFile.name}</p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  <Type className="w-4 h-4 inline mr-2" />
                  Title (Optional)
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a title to your story"
                  maxLength={100}
                />
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <Label htmlFor="text">Text Content (Optional)</Label>
                <Textarea
                  id="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Add text to your story"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Duration (for images only) */}
              {mediaType === 'image' && (
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Duration (seconds)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={30}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                  />
                </div>
              )}

              {/* Music Search */}
              <div className="space-y-2">
                <Label>
                  <Music className="w-4 h-4 inline mr-2" />
                  Add Music (Optional)
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={musicSearch}
                      onChange={(e) => setMusicSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchSpotifyTracks()}
                      placeholder="Search for music..."
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={searchSpotifyTracks}
                    disabled={searching || !musicSearch.trim()}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Selected Track */}
                {selectedTrack && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <img
                      src={selectedTrack.album.images[0]?.url}
                      alt={selectedTrack.name}
                      className="w-12 h-12 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedTrack.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {selectedTrack.artists[0]?.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTrack(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && !selectedTrack && (
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => {
                          setSelectedTrack(track);
                          setSearchResults([]);
                          setMusicSearch("");
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                      >
                        <img
                          src={track.album.images[2]?.url || track.album.images[0]?.url}
                          alt={track.name}
                          className="w-10 h-10 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artists.map(a => a.name).join(', ')}
                          </p>
                        </div>
                        {track.preview_url && (
                          <Play className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateStory}
                disabled={!mediaFile || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? 'Creating Story...' : 'Create Story'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CreateStory;
