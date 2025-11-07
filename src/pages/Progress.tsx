// Replace this file: src/pages/Progress.tsx

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  Send,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext"; // <-- Import useAuth

// Define interface for Post data
interface Post {
    id: number;
    author_name: string;
    location: string | null;
    avatar: string | null;
    time?: string; // Relative time string
    content: string;
    likes: number;
    comments: number;
    image_url: string | null;
    created_at: string;
    farmer_id: string; // <-- Add farmer_id
}

const Progress = () => {
    const navigate = useNavigate();
    const { profile, loading: authLoading } = useAuth(); // <-- Get profile
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    // Helper function for relative time
    const formatRelativeTime = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const diffMinutes = Math.round(diffSeconds / 60);
        const diffHours = Math.round(diffMinutes / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };


    // Fetch farmer's posts
    useEffect(() => {
        if (!authLoading && profile) {
            const fetchMyPosts = async () => {
                 setIsLoadingPosts(true);
                 
                 const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    // Filter by the farmer's profile ID (PK of farmers table)
                    .eq('farmer_id', profile.id) 
                    .order('created_at', { ascending: false });

                 if (error) {
                    console.error("Error fetching user's posts:", error);
                    toast.error("Could not load your previous posts.");
                    setMyPosts([]);
                 } else {
                    const formattedPosts = data.map(post => ({
                        ...post,
                        time: formatRelativeTime(post.created_at)
                    }));
                    setMyPosts(formattedPosts);
                 }
                 setIsLoadingPosts(false);
            };
            fetchMyPosts();
        } else if (!authLoading && !profile) {
            toast.error("Profile not loaded. Redirecting...");
            navigate('/onboarding');
        }
    }, [authLoading, profile, navigate]); // Depend on auth context

    // Handle New Post Submission
    const handlePostSubmit = async () => {
        if (!newPostContent.trim()) { toast.error("Post content cannot be empty."); return; }
        if (!profile) { toast.error("User profile not loaded."); return; }

        setIsPosting(true);
        const newPostData = {
            farmer_id: profile.id, // <-- CRITICAL: Link post to farmer's profile ID
            author_name: profile.name,
            location: profile.district || "Unknown Location",
            avatar: profile.name?.charAt(0).toUpperCase() || "🧑‍🌾",
            content: newPostContent,
            likes: 0, // Set defaults
            comments: 0 // Set defaults
        };

        const { data, error } = await supabase
            .from('posts')
            .insert(newPostData)
            .select()
            .single();

        if (error) {
            console.error("Error creating post:", error);
            toast.error("Failed to create post. Please try again.");
        } else if (data) {
            // Add the new post to the *top* of the displayed list
            const formattedNewPost = { ...data, time: formatRelativeTime(data.created_at) };
            setMyPosts(prevPosts => [formattedNewPost, ...prevPosts]); // Prepend new post
            setNewPostContent(""); // Clear input
            toast.success("Progress update posted successfully!");
        }
        setIsPosting(false);
    };

    if (authLoading || !profile) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
           <Loader2 className="w-12 h-12 animate-spin text-primary" />
         </div>
       );
    }

    return (
        <div className="min-h-screen bg-gradient-subtle pb-6">
            <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Post Your Progress</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">Share an update with the community</p>
                        </div>
                    </div>

                    {/* New Post Card */}
                    <Card className="p-4 sm:p-6 shadow-soft space-y-3 sticky top-4 bg-card/90 backdrop-blur z-10">
                         <div className="flex items-start gap-3">
                             <Avatar>
                                 <AvatarFallback className="bg-primary text-primary-foreground">
                                    {profile.name?.charAt(0).toUpperCase() || '🧑‍🌾'}
                                 </AvatarFallback>
                             </Avatar>
                             <Textarea
                                 placeholder="Share your latest cultivation progress, challenges, or successes..."
                                 value={newPostContent}
                                 onChange={(e) => setNewPostContent(e.target.value)}
                                 className="flex-1 min-h-[80px] sm:min-h-[100px]"
                                 disabled={isPosting}
                             />
                         </div>
                         <div className="flex justify-end items-center">
                             <Button onClick={handlePostSubmit} disabled={isPosting || !newPostContent.trim()}>
                                 {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                 <span className="ml-2">{isPosting ? "Posting..." : "Post Update"}</span>
                             </Button>
                         </div>
                    </Card>

                    {/* Divider */}
                    <hr className="border-border/50" />

                    {/* Section for User's Previous Posts */}
                    <div className="space-y-4 pt-2">
                        <h2 className="text-xl font-bold text-foreground">Your Previous Updates</h2>
                         {isLoadingPosts ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : myPosts.length === 0 ? (
                           <Card className="p-6 text-center text-muted-foreground rounded-xl">
                             You haven't posted any updates yet. Use the box above to share your progress!
                           </Card>
                        ) : (
                          myPosts.map((post) => (
                            // --- Reusing Post Card Structure from Community.tsx ---
                            <Card key={post.id} className="p-4 sm:p-6 space-y-4 shadow-soft bg-card rounded-xl">
                              {/* Author Info */}
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                    {post.avatar || post.author_name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-bold">{post.author_name}</h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {post.location || 'Unknown Location'} • {post.time}
                                  </p>
                                </div>
                              </div>

                              {/* Content */}
                              <p className="text-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{post.content}</p>

                              {/* Image/Icon */}
                              {post.image_url && (
                                <div className="bg-gradient-subtle rounded-lg p-6 sm:p-8 text-center">
                                  {post.image_url.startsWith('http') ? (
                                    <img src={post.image_url} alt="Post image" className="max-w-full max-h-60 mx-auto rounded"/>
                                  ) : (
                                    <div className="text-5xl sm:text-6xl">{post.image_url}</div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-4 sm:gap-6 pt-2 border-t">
                                <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500/80" />
                                  <span className="text-xs sm:text-sm font-medium">{post.likes}</span>
                                </span>
                                <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500/80" />
                                  <span className="text-xs sm:text-sm font-medium">{post.comments}</span>
                                </span>
                                <button className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary transition-colors ml-auto">
                                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="hidden sm:inline text-xs sm:text-sm font-medium">Share</span>
                                </button>
                              </div>
                            </Card>
                          ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Progress;