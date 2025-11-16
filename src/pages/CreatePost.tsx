import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, 
  Video, 
  X, 
  Upload, 
  Loader2,
  FileVideo,
  FileImage,
  Type,
  Sparkles,
  Clock,
  CheckCircle2,
  Music,
  Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { uploadToSupabase } from "@/lib/supabaseStorage";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";

type PostType = "image" | "video" | null;

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
  preview_url: string | null;
}

const CreatePost = () => {
  const [postType, setPostType] = useState<PostType>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [musicId, setMusicId] = useState("");
  const [musicCoverUrl, setMusicCoverUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [spotifySearch, setSpotifySearch] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);
  const [showSpotifyResults, setShowSpotifyResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();


  const MAX_VIDEO_DURATION = 3600; // 1 hour in seconds
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

  const searchSpotify = async (query: string) => {
    if (!query.trim()) {
      setSpotifyResults([]);
      return;
    }

    setSearchingSpotify(true);
    try {
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        toast.error("Spotify credentials not configured");
        return;
      }

      // Get access token using Client Credentials flow
      const authResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!authResponse.ok) {
        throw new Error("Failed to authenticate with Spotify");
      }

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Search for tracks
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error("Failed to search Spotify");
      }

      const searchData = await searchResponse.json();
      setSpotifyResults(searchData.tracks?.items || []);
      setShowSpotifyResults(true);
    } catch (error) {
      console.error("Spotify search error:", error);
      toast.error("Failed to search Spotify. Please check your credentials.");
    } finally {
      setSearchingSpotify(false);
    }
  };

  const selectTrack = (track: SpotifyTrack) => {
    setMusicTitle(track.name);
    setMusicArtist(track.artists.map((a) => a.name).join(", "));
    setMusicUrl(track.external_urls.spotify);
    setMusicId(track.id);
    setMusicCoverUrl(track.album.images[0]?.url || "");
    setShowSpotifyResults(false);
    setSpotifySearch("");
    toast.success("Track selected!");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (postType === "image" && selectedFile.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    if (postType === "video" && selectedFile.size > MAX_VIDEO_SIZE) {
      toast.error("Video size must be less than 500MB");
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Check video duration
    if (postType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.floor(video.duration);
        setVideoDuration(duration);
        
        if (duration > MAX_VIDEO_DURATION) {
          toast.error("Video duration must be less than 1 hour");
          setFile(null);
          setPreview("");
        }
      };
      video.src = URL.createObjectURL(selectedFile);
    }
  };

  const uploadFileToCloud = async () => {
    if (!file || !currentUser) return null;

    try {
      toast.info(`Uploading ${postType}...`);
      
      // Upload file to Supabase Storage with progress tracking
      const result = await uploadToSupabase(
        file,
        'posts',
        'media',
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      console.log("File uploaded to Supabase Storage:", result);

      return {
        url: result.url,
        path: result.path,
        bucket: result.bucket,
        type: postType,
        duration: postType === "video" ? videoDuration : null,
      };
    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to create a post");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file
      const fileData = await uploadFileToCloud();
      if (!fileData) throw new Error("Failed to upload file");

      console.log("File uploaded successfully:", fileData);
      console.log("Creating post with user_id:", currentUser.id);

      // Create post in database
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          title: title.trim(),
          caption: caption.trim(),
          hashtags: hashtags.trim(),
          music_url: musicUrl.trim(),
          music_title: musicTitle.trim(),
          music_artist: musicArtist.trim(),
          music_id: musicId.trim(),
          music_cover_url: musicCoverUrl.trim(),
          media_url: fileData.url,
          media_type: fileData.type,
          video_duration: fileData.duration,
          storage_path: fileData.path,
          storage_bucket: fileData.bucket,
          likes_count: 0,
          comments_count: 0,
          views_count: 0,
        })
        .select()
        .single();

      if (postError) {
        console.error("Post creation error:", postError);
        throw postError;
      }

      console.log("Post created successfully:", postData);
      toast.success("Post uploaded successfully!");
      navigate("/shows");
    } catch (error: any) {
      console.error("Error creating post:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      toast.error(error.message || "Failed to create post");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setPostType(null);
    setTitle("");
    setCaption("");
    setHashtags("");
    setMusicUrl("");
    setMusicTitle("");
    setMusicArtist("");
    setMusicId("");
    setMusicCoverUrl("");
    setFile(null);
    setPreview("");
    setVideoDuration(0);
    setUploadProgress(0);
    setSpotifySearch("");
    setSpotifyResults([]);
    setShowSpotifyResults(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Navigation />
      <PageWrapper>
        <div className="min-h-screen bg-background py-8 px-4 pt-24 md:pt-28">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                <h1 className="text-4xl font-black">
                  <span className="text-primary">Create</span>{" "}
                  <span className="text-foreground">Post</span>
                </h1>
              </div>
              <p className="text-muted-foreground">
                Share your moments with images or videos
              </p>
            </motion.div>

            {/* Post Type Selection */}
            {!postType && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid md:grid-cols-2 gap-6"
              >
                <Card
                  className="p-8 cursor-pointer hover:border-primary transition-all group"
                  onClick={() => setPostType("image")}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <ImageIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Image Post</h3>
                    <p className="text-muted-foreground">
                      Share photos and images
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Max size: 10MB
                    </p>
                  </motion.div>
                </Card>

                <Card
                  className="p-8 cursor-pointer hover:border-primary transition-all group"
                  onClick={() => setPostType("video")}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Video className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Video Post</h3>
                    <p className="text-muted-foreground">
                      Share short videos
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Max duration: 1 hour | Max size: 500MB
                    </p>
                  </motion.div>
                </Card>
              </motion.div>
            )}

            {/* Create Post Form */}
            <AnimatePresence mode="wait">
              {postType && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-6 md:p-8">
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                        {postType === "image" ? (
                          <FileImage className="w-5 h-5 text-primary" />
                        ) : (
                          <FileVideo className="w-5 h-5 text-primary" />
                        )}
                        <span className="font-semibold text-primary capitalize">
                          {postType} Post
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetForm}
                        disabled={uploading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Change Type
                      </Button>
                    </div>

                    {/* File Upload */}
                    {!file ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors mb-6"
                      >
                        <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">
                          Upload {postType === "image" ? "Image" : "Video"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Click to browse or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {postType === "image"
                            ? "PNG, JPG, GIF up to 10MB"
                            : "MP4, MOV, AVI up to 500MB (max 1 hour)"}
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={
                            postType === "image"
                              ? "image/*"
                              : "video/*"
                          }
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="mb-6">
                        {/* Preview */}
                        <div className="relative rounded-xl overflow-hidden bg-muted mb-4">
                          {postType === "image" ? (
                            <img
                              src={preview}
                              alt="Preview"
                              className="w-full max-h-96 object-contain"
                            />
                          ) : (
                            <video
                              ref={videoRef}
                              src={preview}
                              controls
                              className="w-full max-h-96"
                            />
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-4 right-4"
                            onClick={() => {
                              setFile(null);
                              setPreview("");
                              setVideoDuration(0);
                            }}
                            disabled={uploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Video Duration */}
                        {postType === "video" && videoDuration > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Clock className="w-4 h-4" />
                            <span>Duration: {formatDuration(videoDuration)}</span>
                            {videoDuration <= MAX_VIDEO_DURATION && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />
                            )}
                          </div>
                        )}

                        {/* File Info */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {postType === "image" ? (
                            <FileImage className="w-4 h-4" />
                          ) : (
                            <FileVideo className="w-4 h-4" />
                          )}
                          <span>{file.name}</span>
                          <span className="ml-auto">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div className="mb-6">
                      <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                        <Type className="w-4 h-4" />
                        Title
                      </Label>
                      <Input
                        id="title"
                        placeholder="Give your post a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={uploading}
                        maxLength={100}
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-right">
                        {title.length}/100
                      </p>
                    </div>

                    {/* Caption */}
                    <div className="mb-6">
                      <Label htmlFor="caption" className="flex items-center gap-2 mb-2">
                        <Type className="w-4 h-4" />
                        Caption
                      </Label>
                      <Textarea
                        id="caption"
                        placeholder="Write a caption for your post..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        disabled={uploading}
                        className="min-h-32 resize-none"
                        maxLength={2000}
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-right">
                        {caption.length}/2000
                      </p>
                    </div>

                    {/* Hashtags */}
                    <div className="mb-6">
                      <Label htmlFor="hashtags" className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4" />
                        Hashtags
                      </Label>
                      <Input
                        id="hashtags"
                        placeholder="#music #viral #trending"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        disabled={uploading}
                        maxLength={500}
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-right">
                        {hashtags.length}/500
                      </p>
                    </div>

                    {/* Spotify Search */}
                    <div className="mb-6">
                      <Label htmlFor="spotifySearch" className="flex items-center gap-2 mb-2">
                        <Music className="w-4 h-4" />
                        Search Spotify Music
                      </Label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="spotifySearch"
                              placeholder="Search for songs, artists..."
                              value={spotifySearch}
                              onChange={(e) => {
                                setSpotifySearch(e.target.value);
                                if (e.target.value.trim()) {
                                  const timer = setTimeout(() => {
                                    searchSpotify(e.target.value);
                                  }, 500);
                                  return () => clearTimeout(timer);
                                }
                              }}
                              disabled={uploading || searchingSpotify}
                              className="pl-10"
                            />
                          </div>
                          {musicTitle && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMusicTitle("");
                                setMusicArtist("");
                                setMusicUrl("");
                                setMusicId("");
                                setMusicCoverUrl("");
                              }}
                              disabled={uploading}
                            >
                              Clear
                            </Button>
                          )}
                        </div>

                        {/* Spotify Results Dropdown */}
                        {showSpotifyResults && spotifyResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                          >
                            {spotifyResults.map((track) => (
                              <motion.div
                                key={track.id}
                                whileHover={{ backgroundColor: "var(--accent)" }}
                                onClick={() => selectTrack(track)}
                                className="p-3 cursor-pointer border-b last:border-b-0 flex items-center gap-3 hover:bg-accent transition-colors"
                              >
                                {track.album.images[0] && (
                                  <img
                                    src={track.album.images[0].url}
                                    alt={track.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{track.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {track.artists.map((a) => a.name).join(", ")}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Selected Music Info */}
                    {musicTitle && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20"
                      >
                        <div className="flex items-center gap-4">
                          {musicCoverUrl && (
                            <img
                              src={musicCoverUrl}
                              alt={musicTitle}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{musicTitle}</p>
                            {musicArtist && (
                              <p className="text-sm text-muted-foreground">{musicArtist}</p>
                            )}
                            <a
                              href={musicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 inline-block"
                            >
                              Open on Spotify →
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Uploading...</span>
                          <span className="text-sm text-muted-foreground">
                            {uploadProgress}%
                          </span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/shows")}
                        disabled={uploading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!file || !caption.trim() || uploading}
                        className="flex-1"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create Post
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </PageWrapper>
    </>
  );
};

export default CreatePost;
