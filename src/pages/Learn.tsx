// src/pages/Learn.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, ScrollText } from "lucide-react"; // Import ScrollText
import { AspectRatio } from "@/components/ui/aspect-ratio"; // Import AspectRatio for video

// --- UPDATE VIDEO IDs and optionally thumbnails ---
const videos = [
  {
    id: 1,
    title: "Oil Palm Basics (NMEO-OP)",
    videoId: "YOUR_YOUTUBE_VIDEO_ID_1", // <-- REPLACE
    thumbnail: "https://img.youtube.com/vi/YOUR_YOUTUBE_VIDEO_ID_1/hqdefault.jpg", // Optional: Update thumbnail URL
    duration: "10:15",
  },
  {
    id: 2,
    title: "Effective Intercropping",
    videoId: "YOUR_YOUTUBE_VIDEO_ID_2", // <-- REPLACE
    thumbnail: "https://img.youtube.com/vi/YOUR_YOUTUBE_VIDEO_ID_2/hqdefault.jpg", // Optional: Update thumbnail URL
    duration: "07:30",
  },
];

const intercrops = [
  { name: "Banana", icon: "🍌", benefit: "Quick returns in 12-18 months" },
  { name: "Turmeric", icon: "🌿", benefit: "Good shade tolerance" }, // Using generic plant icon
  { name: "Pineapple", icon: "🍍", benefit: "Low maintenance crop" },
  { name: "Ginger", icon: "🌱", benefit: "High value crop" }, // Using seedling icon
];

// Add Government Schemes data
const schemes = [
  { name: "NMEO-OP", description: "Financial assistance & support specifically for oil palm cultivation.", link: "https://nmeo.dacnet.nic.in/" }, // Example Link
  { name: "PM-Kisan Samman Nidhi", description: "Direct income support of ₹6,000/year to eligible farmer families.", link: "https://pmkisan.gov.in/" },
  { name: "Kisan Credit Card (KCC)", description: "Provides timely credit access to farmers for agricultural needs.", link: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11836&Mode=0" }, // Example RBI link
  // Add more relevant schemes
];


const Learn = () => {
  const navigate = useNavigate();

  // Function to open YouTube link (replace with actual video player later if needed)
  const playVideo = (videoId: string) => {
     window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl"> {/* Adjusted padding */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4"> {/* Adjusted gap */}
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
               {/* Responsive text */}
              <h1 className="text-2xl sm:text-3xl font-bold">Learn & Grow</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Knowledge for better farming</p>
            </div>
          </div>

          {/* Videos Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Educational Videos</h2>
            <div className="grid gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-medium transition-shadow cursor-pointer" onClick={() => playVideo(video.videoId)}>
                  <div className="flex gap-4 p-4 items-center">
                    {/* Use AspectRatio for consistent video thumbnail size */}
                    <div className="w-32 sm:w-40 flex-shrink-0">
                       <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden relative group">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                          </div>
                          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/80 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs text-white">
                            {video.duration}
                          </div>
                       </AspectRatio>
                    </div>
                    <div className="flex-1">
                      {/* Responsive text */}
                      <h3 className="font-semibold text-base sm:text-lg leading-tight">{video.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Tap to watch expert guidance
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Intercropping Ideas */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Intercropping Ideas</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Maximize income during the oil palm gestation period
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4"> {/* Adjusted gap */}
              {intercrops.map((crop) => (
                <Card key={crop.name} className="p-4 sm:p-6 text-center hover:shadow-medium transition-shadow">
                   {/* Responsive icon */}
                  <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{crop.icon}</div>
                   {/* Responsive text */}
                  <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{crop.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{crop.benefit}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Government Schemes Section */}
          <div className="space-y-4">
              <h2 className="text-xl font-bold">Government Schemes</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Explore schemes that can benefit your farming
              </p>
              <div className="grid gap-4">
                {schemes.map((scheme) => (
                  <Card key={scheme.name} className="p-4 sm:p-6 hover:shadow-medium transition-shadow">
                     <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-subtle flex items-center justify-center flex-shrink-0">
                           <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          {/* Responsive text */}
                          <h3 className="font-bold text-base sm:text-lg mb-1">{scheme.name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{scheme.description}</p>
                          {scheme.link && scheme.link !== "#" && ( // Only show button if link is valid
                              <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto mt-2 text-primary text-xs sm:text-sm"
                                  onClick={() => window.open(scheme.link, '_blank')}
                                >
                                Learn More
                              </Button>
                           )}
                        </div>
                     </div>
                  </Card>
                ))}
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Learn;