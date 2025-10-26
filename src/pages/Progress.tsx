// src/pages/Progress.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  Send,
  Heart, // Added back for display
  MessageCircle, // Added back for display
  Share2, // Added back for display
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// Define interface for Post data (can be shared later)
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
}

const Progress = () => {
    const navigate = useNavigate();
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [farmerProfile, setFarmerProfile] = useState<any>({});
    const [myPosts, setMyPosts] = useState<Post[]>([]); // State to hold user's posts
    const [isLoadingPosts, setIsLoadingPosts] = useState(true); // Loading state for posts

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
        return date.toLocaleDateString(); // Older than a week, show date
    };


    // Fetch farmer profile and their posts
    useEffect(() => {
        const fetchProfileAndPosts = async () => {
             setIsLoadingPosts(true); // Start loading posts
             let currentFarmerName: string | null = null;

             // 1. Get farmer profile
             const storedProfile = localStorage.getItem("farmerProfile");
             if (storedProfile) {
                try {
                    const profileData = JSON.parse(storedProfile);
                    setFarmerProfile(profileData);
                    currentFarmerName = profileData.name;
                } catch (e) { console.error("Failed to parse profile"); }
             }

             if (!currentFarmerName) {
                 toast.error("Could not identify your profile. Please log in again.");
                 setIsLoadingPosts(false);
                 navigate('/onboarding'); // Redirect if profile essential data missing
                 return;
             }

             // 2. Fetch posts filtered by author_name
             const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('author_name', currentFarmerName) // Filter by the farmer's name
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
             setIsLoadingPosts(false); // Finish loading posts
        };
        fetchProfileAndPosts();
    }, [navigate]); // Add navigate dependency

    // Handle New Post Submission
    const handlePostSubmit = async () => {
        if (!newPostContent.trim()) { toast.error("Post content cannot be empty."); return; }
        if (!farmerProfile.name) { toast.error("User profile not loaded."); return; }

        setIsPosting(true);
        const newPostData = {
            author_name: farmerProfile.name,
            location: farmerProfile.district || "Unknown Location",
            avatar: farmerProfile.name?.charAt(0).toUpperCase() || "🧑‍🌾",
            content: newPostContent,
            // 'time' is generated from created_at, don't insert it
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

    return (
        <div className="min-h-screen bg-gradient-subtle">
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
                    <Card className="p-4 sm:p-6 shadow-soft space-y-3 sticky top-4 bg-card/90 backdrop-blur z-10"> {/* Added sticky positioning */}
                         <div className="flex items-start gap-3">
                             <Avatar>
                                 <AvatarFallback className="bg-primary text-primary-foreground">
                                    {farmerProfile.name?.charAt(0).toUpperCase() || '🧑‍🌾'}
                                 </AvatarFallback>
                             </Avatar>
                             <Textarea
                                 placeholder="Share your latest cultivation progress, challenges, or successes..."
                                 value={newPostContent}
                                 onChange={(e) => setNewPostContent(e.target.value)}
                                 className="flex-1 min-h-[80px] sm:min-h-[100px]" // Adjusted height
                                 disabled={isPosting || !farmerProfile.name}
                             />
                         </div>
                         <div className="flex justify-end items-center">
                             <Button onClick={handlePostSubmit} disabled={isPosting || !newPostContent.trim() || !farmerProfile.name}>
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
                           <Card className="p-6 text-center text-muted-foreground">
                             You haven't posted any updates yet. Use the box above to share your progress!
                           </Card>
                        ) : (
                          myPosts.map((post) => (
                            // --- Reusing Post Card Structure from Community.tsx ---
                            <Card key={post.id} className="p-4 sm:p-6 space-y-4 shadow-soft bg-card">
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
                              <p className="text-foreground leading-relaxed text-sm sm:text-base">{post.content}</p>

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
                                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500/80" /> {/* Slightly muted */}
                                  <span className="text-xs sm:text-sm font-medium">{post.likes}</span>
                                </span>
                                <span className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500/80" /> {/* Slightly muted */}
                                  <span className="text-xs sm:text-sm font-medium">{post.comments}</span>
                                </span>
                                <button className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary transition-colors ml-auto">
                                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span className="hidden sm:inline text-xs sm:text-sm font-medium">Share</span>
                                </button>
                                {/* Add Edit/Delete buttons specific to 'My Progress' if needed */}
                              </div>
                            </Card>
                            // --- End of Reused Post Card ---
                          ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Progress;
