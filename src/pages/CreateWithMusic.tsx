import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Music,
  Search,
  X,
  Image as ImageIcon,
  Video,
  Plus,
  Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { musicAPI } from "@/lib/musicAPI";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import PageWrapper from "@/components/PageWrapper";

interface SelectedMusic {
  id: string;
  name: string;
  artist: string;
  artwork_url?: string;
  spotify_id?: string;
}

const CreateWithMusic = () => {
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusic | null>(null);
  const [musicSearch, setMusicSearch] = useState("");
  const [musicSearchResults, setMusicSearchResults] = useState<any[]>([]);
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [searchingMusic, setSearchingMusic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video");
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? "image" : "video");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMusicSearch = async (query: string) => {
    if (!query.trim()) {
      setMusicSearchResults([]);
      return;
    }

    setSearchingMusic(true);
    try {
      const results = await musicAPI.searchTracks(query, 10);
      setMusicSearchResults(results);
    } catch (error) {
      console.error("Error searching music:", error);
      toast.error("Failed to search music");
    } finally {
      setSearchingMusic(false);
    }
  };

  const selectMusic = (track: any) => {
    setSelectedMusic({
      id: track.id,
      name: track.name,
      artist: track.artist,
      artwork_url: track.artwork_url,
      spotify_id: track.spotify_id
    });
    setShowMusicSearch(false);
    setMusicSearch("");
    toast.success("Music added!");
  };

  const handleCreatePost = async () => {
    if (!mediaFile || !mediaType) {
      toast.error("Please select an image or video");
      return;
    }

    if (!caption.trim()) {
      toast.error("Please add a caption");
      return;
    }

    if (!currentUser) {
      toast.error("Please log in first");
      return;
    }

    setUploading(true);
    try {
      // Upload media to Supabase Storage
      const fileName = `${Date.now()}-${mediaFile.name}`;
      const filePath = `posts/${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, mediaFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      // Create post record
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: currentUser.id,
          caption: caption,
          title: title,
          media_url: publicUrl,
          media_type: mediaType,
          music_title: selectedMusic?.name,
          music_artist: selectedMusic?.artist,
          music_spotify_id: selectedMusic?.spotify_id,
          hashtags: hashtags,
          likes_count: 0,
          comments_count: 0,
          views_count: 0
        });

      if (postError) throw postError;

      toast.success("Post created successfully!");
      
      // Reset form
      setMediaFile(null);
      setMediaPreview("");
      setCaption("");
      setTitle("");
      setHashtags("");
      setSelectedMusic(null);
      setMediaType(null);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Create Post</h1>
            <p className="text-gray-400">
              Create content for YouTube Shorts, Instagram Reels, and TikTok
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Media Upload Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {!mediaPreview ? (
                  <Card className="border-2 border-dashed border-gray-600 hover:border-primary transition-colors p-12 text-center cursor-pointer bg-gray-900/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Upload Image or Video
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Drag and drop or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Recommended: 9:16 aspect ratio for vertical videos
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </Card>
                ) : (
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video lg:aspect-[9/16] flex items-center justify-center">
                    {mediaType === "image" ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-4 right-4"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview("");
                        setMediaType(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Title
                </label>
                <Input
                  placeholder="Post title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Caption
                </label>
                <Textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white min-h-24 resize-none"
                  maxLength={2200}
                />
                <p className="text-xs text-gray-500 mt-1">{caption.length}/2200</p>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Hashtags
                </label>
                <Input
                  placeholder="#music #viral #trending"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              {/* Music Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Add Music
                </label>

                {selectedMusic ? (
                  <Card className="bg-gray-800 border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selectedMusic.artwork_url && (
                          <img
                            src={selectedMusic.artwork_url}
                            alt={selectedMusic.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">
                            {selectedMusic.name}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {selectedMusic.artist}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedMusic(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => setShowMusicSearch(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Search Spotify Music
                  </Button>
                )}
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreatePost}
                disabled={!mediaFile || !caption.trim() || uploading}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </motion.div>
          </div>

          {/* Music Search Modal */}
          {showMusicSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowMusicSearch(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 rounded-lg max-w-md w-full max-h-96 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Header */}
                <div className="p-4 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search Spotify music..."
                      value={musicSearch}
                      onChange={(e) => {
                        setMusicSearch(e.target.value);
                        handleMusicSearch(e.target.value);
                      }}
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Search Results */}
                <div className="overflow-y-auto max-h-80">
                  {searchingMusic ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : musicSearchResults.length > 0 ? (
                    <div className="divide-y divide-gray-800">
                      {musicSearchResults.map((track) => (
                        <motion.button
                          key={track.id}
                          whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                          onClick={() => selectMusic(track)}
                          className="w-full p-4 text-left hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {track.artwork_url && (
                              <img
                                src={track.artwork_url}
                                alt={track.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">
                                {track.name}
                              </p>
                              <p className="text-gray-400 text-sm truncate">
                                {track.artist}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : musicSearch ? (
                    <div className="flex items-center justify-center p-8 text-gray-400">
                      No music found
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8 text-gray-400">
                      Search for music to get started
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        <Navigation />
      </div>
    </PageWrapper>
  );
};

export default CreateWithMusic;
