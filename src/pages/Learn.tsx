/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Learn.tsx
*/
// src/pages/Learn.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Sprout, Clock, Sun } from "lucide-react"; // <-- Removed ScrollText
import { AspectRatio } from "@/components/ui/aspect-ratio"; 
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer"; 

const videos = [
  {
    id: 1,
    title: "Oil Palm Basics (NMEO-OP)",
    videoId: "0qLwATBWTCg?si=hKjDCOBYKSMKmTGS", // <-- REPLACE
    duration: "10:15",
  },
  {
    id: 2,
    title: "Effective Intercropping",
    videoId: "0qLwATBWTCg?si=hKjDCOBYKSMKmTGS", // <-- REPLACE
    duration: "07:30",
  },
];

interface CropDetails {
  name: string;
  icon: string;
  benefit: string;
  howToPlant: string;
  harvestTime: string;
  tips: string[];
}

const intercrops: CropDetails[] = [
  { 
    name: "Pineapple", 
    icon: "🍍", 
    benefit: "Low maintenance crop",
    howToPlant: "Plant suckers or slips in double rows with a spacing of 30x60x90 cm. Ensure well-drained, acidic soil.",
    harvestTime: "18-24 months for the first harvest.",
    tips: [
        "Prefers partial shade, making it ideal for planting between palm rows.",
        "Requires minimal water once established.",
        "Mulching with organic matter helps retain moisture and control weeds."
    ]
  },
  { 
    name: "Banana", 
    icon: "🍌", 
    benefit: "Quick returns in 12-18 months",
    howToPlant: "Plant suckers from high-yielding plants in pits of 45x45x45 cm. Spacing should be at least 3m x 3m.",
    harvestTime: "12-18 months, depending on the variety.",
    tips: [
        "Requires significant water and nutrients (high potash demand).",
        "Choose dwarf varieties to avoid interference with palm fronds.",
        "Regularly remove old leaves and suckers to maintain plant health."
    ]
  },
  { 
    name: "Turmeric", 
    icon: "🌱", 
    benefit: "Good shade tolerance",
    howToPlant: "Plant rhizome 'fingers' in raised beds, 15-20 cm apart. It thrives in well-drained, loamy soil.",
    harvestTime: "7-9 months, when the leaves turn yellow and dry.",
    tips: [
        "Excellent shade tolerance, perfect for growing under mature palms.",
        "Needs heavy mulching to conserve moisture and add organic matter.",
        "Stop watering about one month before harvesting."
    ]
  },
  { 
    name: "Ginger", 
    icon: "🌿", 
    benefit: "High value crop",
    howToPlant: "Plant small rhizome pieces (with at least one eye) in raised beds with rich, loamy soil. Space them 20-25 cm apart.",
    harvestTime: "8-10 months, when the leaves start to wilt and turn yellow.",
    tips: [
        "Also shade-tolerant and prefers high humidity.",
        "Ensure excellent drainage; ginger is very susceptible to root rot.",
        "Like turmeric, heavy mulching is highly beneficial."
    ]
  },
];

// --- REMOVED 'schemes' array ---

const Learn = () => {
  const navigate = useNavigate();
  const [selectedCrop, setSelectedCrop] = useState<CropDetails | null>(null);

  // Function to open YouTube link
  const playVideo = (videoId: string) => {
     window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <Drawer>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto p-4 sm:p-6 max-w-4xl"> 
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-4"> 
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
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
                      <div className="w-32 sm:w-40 flex-shrink-0">
                         <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden relative group">
                            <img
                              src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4"> 
                {intercrops.map((crop) => (
                  <DrawerTrigger asChild key={crop.name} onClick={() => setSelectedCrop(crop)}>
                    <Card className="p-4 sm:p-6 text-center hover:shadow-medium transition-shadow cursor-pointer">
                      <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{crop.icon}</div>
                      <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{crop.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{crop.benefit}</p>
                    </Card>
                  </DrawerTrigger>
                ))}
              </div>
            </div>

            {/* --- REMOVED Government Schemes Section --- */}

          </div>
        </div>
      </div>

      {/* Drawer Content */}
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{selectedCrop?.icon}</span>
              <div>
                <DrawerTitle className="text-3xl font-bold">{selectedCrop?.name}</DrawerTitle>
                <DrawerDescription className="text-lg">{selectedCrop?.benefit}</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          
          <div className="p-4 space-y-6">
            {/* How to Plant */}
            <div className="space-y-2">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary" />
                How to Plant
              </h3>
              <p className="text-muted-foreground">{selectedCrop?.howToPlant}</p>
            </div>
            
            {/* Harvest Time */}
            <div className="space-y-2">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Harvest Time
              </h3>
              <p className="text-muted-foreground">{selectedCrop?.harvestTime}</p>
            </div>
            
            {/* Tips & Tricks */}
            <div className="space-y-2">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Tips & Tricks
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-2 text-muted-foreground">
                {selectedCrop?.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DrawerContent>

    </Drawer>
  );
};

export default Learn;