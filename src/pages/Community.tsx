/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Community.tsx
*/
// src/pages/Community.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; 
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Share2, Loader2, Send, BarChart } from "lucide-react"; // <-- Added BarChart
import { supabase } from "@/lib/supabaseClient"; 
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; 

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

const Community = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all posts
    useEffect(() => {
        const fetchProfileAndPosts = async () => {
             setIsLoading(true);
             
             // Fetch all posts
             const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false }); // Fetch newest first

             if (error) {
                console.error("Error fetching posts:", error);
                toast.error("Could not load community posts.");
                setPosts([]);
             } else {
                 const formattedPosts = data.map(post => ({
                     ...post,
                     time: post.time || formatRelativeTime(post.created_at)
                 }));
                 setPosts(formattedPosts);
             }
             setIsLoading(false);
        };
        fetchProfileAndPosts();
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

                    {/* --- "My Progress" Link Card --- */}
                     <Card 
                        className="p-4 sm:p-6 shadow-soft space-y-3 hover:shadow-medium transition-shadow cursor-pointer"
                        onClick={() => navigate("/progress")}
                    >
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <BarChart className="w-5 h-5"/>
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">My Progress</h3>
                                    <p className="text-muted-foreground text-sm">Post your own updates and track your farm's progress.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon">
                                <Send className="w-5 h-5 text-primary" />
                            </Button>
                         </div>
                     </Card>


                    {/* Posts */}
                    <div className="space-y-4 pt-4 border-t">
                        <h2 className="text-xl font-bold text-foreground">All Posts</h2>
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
                                <Card key={post.id} className="p-4 sm:p-6 space-y-4 shadow-soft">
                                    {/* Author Info */}
                                    <div className="flex items-center gap-3">
                                        <Avatar>
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