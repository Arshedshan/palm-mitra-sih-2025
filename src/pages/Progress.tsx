// src/pages/Progress.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Send } from "lucide-react"; // Removed unused icons like Heart, MessageCircle, Share2
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const Progress = () => {
    const navigate = useNavigate();
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [farmerProfile, setFarmerProfile] = useState<any>({});

    // Fetch farmer profile on load to get name etc. for posting
    useEffect(() => {
        const storedProfile = localStorage.getItem("farmerProfile");
        if (storedProfile) {
            try {
                setFarmerProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error("Failed to parse profile for posting:", e);
                toast.error("Could not load your profile. Please try logging in again.");
                // navigate('/onboarding'); // Optionally redirect
            }
        } else {
            console.warn("Profile not found for progress page");
            toast.error("Profile not found. Please log in again.");
            // navigate('/onboarding'); // Optionally redirect
        }
    }, [navigate]); // Added navigate to dependency array

    // Handle New Post Submission (Same as before)
    const handlePostSubmit = async () => {
        if (!newPostContent.trim()) {
            toast.error("Post content cannot be empty.");
            return;
        }
        // Ensure profile is loaded before allowing post
        if (!farmerProfile.name) {
             toast.error("Could not identify user profile. Please wait or log in again.");
             return;
        }

        setIsPosting(true);
        const newPostData = {
            author_name: farmerProfile.name,
            location: farmerProfile.district || "Unknown Location",
            avatar: farmerProfile.name?.charAt(0).toUpperCase() || "🧑‍🌾", // Use first initial or default emoji
            content: newPostContent,
            time: "Just now", // Placeholder time, Supabase adds created_at
            // Add other fields if needed, like image_url
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
            setNewPostContent(""); // Clear input
            toast.success("Progress update posted successfully!");
            // Optionally navigate to the community feed after posting
            // navigate('/community');
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
                            {/* Changed Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold">Post Your Progress</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">Share an update with the community</p>
                        </div>
                    </div>

                    {/* New Post Card - ONLY this is shown */}
                    <Card className="p-4 sm:p-6 shadow-soft space-y-3">
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
                                 className="flex-1 min-h-[100px] sm:min-h-[120px]" // Make textarea slightly taller
                                 disabled={isPosting || !farmerProfile.name} // Disable if profile not loaded
                             />
                         </div>
                         <div className="flex justify-end items-center"> {/* Only show post button */}
                             <Button onClick={handlePostSubmit} disabled={isPosting || !newPostContent.trim() || !farmerProfile.name}>
                                 {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                 <span className="ml-2">{isPosting ? "Posting..." : "Post Update"}</span>
                             </Button>
                         </div>
                    </Card>

                     {/* Removed the section that displayed posts */}

                </div>
            </div>
        </div>
    );
};

export default Progress;