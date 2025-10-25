// src/pages/Community.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; // <-- Added imports
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Share2, Loader2, Image as ImageIcon, Send } from "lucide-react"; // <-- Added imports
import { supabase } from "@/lib/supabaseClient"; // <-- Import supabase
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea"; // <-- Import Textarea
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
    const [newPostContent, setNewPostContent] = useState(""); // State for new post
    const [isPosting, setIsPosting] = useState(false); // State for posting loader
    const [farmerProfile, setFarmerProfile] = useState<any>({}); // Load profile state

    // Fetch farmer profile and posts
    useEffect(() => {
        const fetchProfileAndPosts = async () => {
             setIsLoading(true);
             // 1. Get farmer profile
             const storedProfile = localStorage.getItem("farmerProfile");
             if (storedProfile) {
                try {
                    setFarmerProfile(JSON.parse(storedProfile));
                } catch (e) { console.error("Failed to parse profile"); }
             } else {
                 // Handle missing profile - maybe redirect?
                 console.warn("Profile not found for community page");
             }

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


    // Handle New Post Submission
    const handlePostSubmit = async () => {
        if (!newPostContent.trim()) {
            toast.error("Post content cannot be empty.");
            return;
        }
        if (!farmerProfile.name) {
             toast.error("Could not identify user profile.");
             return;
        }

        setIsPosting(true);
        const newPostData = {
            author_name: farmerProfile.name,
            location: farmerProfile.district || "Unknown Location",
            avatar: farmerProfile.name?.charAt(0).toUpperCase() || "🧑‍🌾", // Use first initial or default emoji
            content: newPostContent,
            time: "Just now", // Placeholder time
            // Add other fields like image_url if you implement image uploads
        };

        const { data, error } = await supabase
            .from('posts')
            .insert(newPostData)
            .select()
            .single(); // Get the newly inserted post back

        if (error) {
            console.error("Error creating post:", error);
            toast.error("Failed to create post. Please try again.");
        } else if (data) {
            // Add new post to the top of the list (optimistic update)
             const formattedNewPost = {
                ...data,
                time: formatRelativeTime(data.created_at) // Format time correctly
             };
            setPosts([formattedNewPost, ...posts]);
            setNewPostContent(""); // Clear input
            toast.success("Post created successfully!");
        }
        setIsPosting(false);
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

                    {/* New Post Card */}
                     <Card className="p-4 sm:p-6 shadow-soft space-y-3">
                         <div className="flex items-start gap-3">
                             <Avatar>
                                 {/* <AvatarImage src="optional_user_avatar_url" /> */}
                                 <AvatarFallback className="bg-primary text-primary-foreground">
                                    {farmerProfile.name?.charAt(0).toUpperCase() || '🧑‍🌾'}
                                 </AvatarFallback>
                             </Avatar>
                             <Textarea
                                 placeholder="Share your progress or ask a question..."
                                 value={newPostContent}
                                 onChange={(e) => setNewPostContent(e.target.value)}
                                 className="flex-1 min-h-[60px]"
                                 disabled={isPosting}
                             />
                         </div>
                         <div className="flex justify-between items-center">
                             {/* Optional: Add image upload button */}
                             {/* <Button variant="ghost" size="icon" disabled={isPosting}>
                                <ImageIcon className="w-5 h-5 text-muted-foreground"/>
                             </Button> */}
                             <div></div> {/* Spacer */}
                             <Button onClick={handlePostSubmit} disabled={isPosting || !newPostContent.trim()}>
                                 {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                 <span className="ml-2">{isPosting ? "Posting..." : "Post"}</span>
                             </Button>
                         </div>
                     </Card>


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