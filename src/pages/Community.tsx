/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Community.tsx
*/
// src/pages/Community.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; // <-- Added imports
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Share2, Loader2 } from "lucide-react"; // <-- Removed Image, Send
import { supabase } from "@/lib/supabaseClient"; // <-- Import supabase
import { toast } from "sonner";
// import { Textarea } from "@/components/ui/textarea"; // <-- Removed Textarea
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // <-- Import Avatar

// Define interface for Post data
interface Post {
    id: number;
    author_name: string;
    location: string;
    avatar: string; // Emoji or initial
    time: string; // Relative time string
    content: string;
    likes: number;
    comments: number;
    image_url: string | null; // Icon/emoji representation
    created_at: string; // Full timestamp
}

// Remove the hardcoded posts array

const Community = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // --- REMOVED STATES ---
    // const [newPostContent, setNewPostContent] = useState(""); 
    // const [isPosting, setIsPosting] = useState(false); 
    // const [farmerProfile, setFarmerProfile] = useState<any>({}); 
    // ---------------------


    // Fetch posts
    useEffect(() => {
        const fetchPosts = async () => { // Renamed function
             setIsLoading(true);
             // --- REMOVED PROFILE FETCH ---

             // 2. Fetch posts
             const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false }); // Fetch newest first

             if (error) {
                console.error("Error fetching posts:", error);
                toast.error("Could not load community posts.");
                setPosts([]);
             } else {
                 // Map Supabase data slightly if needed (e.g., time formatting)
                 const formattedPosts = data.map(post => ({
                     ...post,
                     // You could format the 'created_at' timestamp into a relative time string here
                     // For simplicity, we'll use the 'time' field if it exists, or a default
                     time: post.time || formatRelativeTime(post.created_at)
                 }));
                 setPosts(formattedPosts);
             }
             setIsLoading(false);
        };
        fetchPosts(); // Call renamed function
    }, []); // Run once on mount

    // Helper function for relative time (Simple version)
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
        return `${diffDays}d ago`;
    };


    // --- REMOVED handlePostSubmit function ---


    return (
        <div className="min-h-screen bg-gradient-subtle">
            <div className="container mx-auto p-4 sm:p-6 max-w-2xl"> {/* Adjusted padding */}
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-2 sm:gap-4"> {/* Adjusted gap */}
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            {/* Responsive text */}
                            <h1 className="text-2xl sm:text-3xl font-bold">Community Feed</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">Share and learn</p>
                        </div>
                    </div>

                    {/* --- REMOVED New Post Card --- */}


                    {/* Posts */}
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : posts.length === 0 ? (
                           <Card className="p-6 text-center text-muted-foreground">
                             No posts yet. Be the first to share!
                           </Card>
                        ) : (
                            posts.map((post) => (
                                <Card key={post.id} className="p-4 sm:p-6 space-y-4 shadow-soft hover:shadow-medium transition-shadow">
                                    {/* Author Info */}
                                    <div className="flex items-center gap-3">
                                        {/* Use Avatar component */}
                                        <Avatar>
                                             {/* <AvatarImage src={post.avatar_url} /> */}
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
                                            {/* If image_url is an actual URL, use <img>, otherwise treat as emoji */}
                                            {post.image_url.startsWith('http') ? (
                                                <img src={post.image_url} alt="Post image" className="max-w-full max-h-60 mx-auto rounded"/>
                                            ) : (
                                                 <div className="text-5xl sm:text-6xl">{post.image_url}</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 sm:gap-6 pt-2 border-t">
                                        <button className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-pink-500 transition-colors">
                                            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="text-xs sm:text-sm font-medium">{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-blue-500 transition-colors">
                                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="text-xs sm:text-sm font-medium">{post.comments}</span>
                                        </button>
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

export default Community;