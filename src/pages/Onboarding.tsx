// src/pages/Onboarding.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ArrowRight, Loader2 } from "lucide-react"; // Import Loader2
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient"; // <-- Import supabase

const questions = [
  { id: "name", label: "What is your name?", type: "text", placeholder: "Enter your name" },
  { id: "district", label: "What is your district?", type: "select", placeholder: "Select your district" },
  { id: "landSize", label: "How much land do you have? (in acres)", type: "number", placeholder: "Enter land size" },
];

// Major Indian districts for palm oil cultivation (Keep your list)
const districts = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
    "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur",
    "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris",
    "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
    "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
    "Viluppuram", "Virudhunagar",
    // Other states
    "Andaman and Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
    "Karnataka", "Kerala", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan",
    "Sikkim", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
].sort();

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  const language = localStorage.getItem("selectedLanguageName") || "English";
  const langCode = localStorage.getItem("selectedLanguage") || 'en';

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    if (!formData[currentQuestion.id] || formData[currentQuestion.id].trim() === "") {
        toast.error(`Please ${currentQuestion.type === 'select' ? 'select' : 'enter'} your ${currentQuestion.id === 'landSize' ? 'land size' : currentQuestion.id}`);
        return;
    }
     // Simple validation for land size
     if (currentQuestion.id === 'landSize' && parseFloat(formData.landSize) <= 0) {
        toast.error("Land size must be greater than zero.");
        return;
      }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step before location
       handleGetLocation(); // Directly proceed to location on last question's next
    }
  };

  const handleGetLocation = () => {
    // Ensure all previous data is filled
     for (const question of questions) {
        if (!formData[question.id] || formData[question.id].trim() === "") {
          toast.error(`Please complete all steps first.`);
          setCurrentStep(questions.findIndex(q => q.id === question.id)); // Go back to the empty field
          return;
        }
      }
      if (parseFloat(formData.landSize) <= 0) {
          toast.error("Land size must be greater than zero.");
          setCurrentStep(questions.findIndex(q => q.id === 'landSize'));
          return;
      }

    setIsLocating(true);

    const saveProfileAndVerify = async (location: { latitude: number; longitude: number; } | null) => {
      setIsSaving(true); // Indicate saving process starts
      setIsLocating(false); // Location attempt finished

      const profileData = {
        ...formData,
        language: langCode,
        location: location,
        registeredAt: new Date().toISOString(),
      };

      // Save basic profile to localStorage
      localStorage.setItem("farmerProfile", JSON.stringify(profileData));
      localStorage.removeItem("farmerId"); // Clear old ID if any

      try {
        // --- Supabase Integration ---
        const { data: farmer, error: farmerError } = await supabase
          .from('farmers')
          .insert({
            name: profileData.name,
            district: profileData.district,
            land_size: parseFloat(profileData.landSize) || 0,
            language: profileData.language,
            gps_coords: profileData.location // Supabase handles JSON directly if column type is JSONB
          })
          .select('id') // Select only the ID
          .single();

        if (farmerError) {
          // Attempt to fetch existing farmer if insert fails (e.g., due to unique constraint if you add auth later)
          console.warn("Insert failed, trying to fetch existing:", farmerError.message);
          const { data: existingFarmer, error: fetchError } = await supabase
             .from('farmers')
             .select('id')
             .eq('name', profileData.name) // Be careful, name might not be unique! Use a unique identifier.
             .single();

          if (fetchError || !existingFarmer) {
              throw farmerError; // Re-throw original error if fetch also fails
          } else {
              console.log("Found existing farmer:", existingFarmer.id);
              localStorage.setItem("farmerId", existingFarmer.id); // Store existing ID
              // Optionally update existing record here if needed
              // await supabase.from('farmers').update({...}).eq('id', existingFarmer.id);
          }

        } else if (farmer) {
          console.log("New farmer created:", farmer.id);
          localStorage.setItem("farmerId", farmer.id); // Store new ID

          // (SIMULATION) Insert into 'Green_Ledger' only if new farmer was created and location exists
          if (profileData.location) {
            const { error: ledgerError } = await supabase
              .from('Green_Ledger')
              .insert({
                farm_id: farmer.id,
                coordinates: profileData.location,
                status: 'Verified: Deforestation-Free'
              });
            if (ledgerError) console.warn("Ledger insert failed:", ledgerError.message);
          }
        }
        // --- End Supabase Integration ---

        setIsSaving(false);
        navigate("/verification");

      } catch (error: any) {
        console.error("Supabase error during onboarding:", error);
        toast.error(`Failed to save profile: ${error.message}. Please try again.`);
        setIsSaving(false);
        localStorage.removeItem("farmerProfile"); // Clear potentially incomplete profile
        localStorage.removeItem("farmerId");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          saveProfileAndVerify(location);
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Location access denied. Using approximate location.");
          saveProfileAndVerify(null); // Proceed without precise location
        },
        { timeout: 10000 } // Add a timeout
      );
    } else {
      toast.error("Geolocation not supported. Using approximate location.");
      saveProfileAndVerify(null); // Proceed without precise location
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Let's Get Started
          </h1>
          <p className="text-muted-foreground">Language: {language}</p>
          {/* Progress Indicator */}
          <div className="flex gap-2 justify-center pt-4">
             {/* Step indicators + Location step */}
            {[...questions, { id: "location" }].map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  idx <= currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="p-8 shadow-medium">
          <div className="space-y-6">
            <div className="space-y-2 min-h-[120px]"> {/* Added min-height */}
              <Label htmlFor={currentQuestion.id} className="text-lg font-semibold">
                {currentQuestion.label}
              </Label>
              {currentQuestion.type === "select" ? (
                <Select
                  value={formData[currentQuestion.id] || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, [currentQuestion.id]: value })
                  }
                >
                  <SelectTrigger className="text-lg h-14">
                    <SelectValue placeholder={currentQuestion.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-background z-50">
                    {districts.map((district) => (
                      <SelectItem key={district} value={district} className="text-base">
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={currentQuestion.id}
                  type={currentQuestion.type}
                  placeholder={currentQuestion.placeholder}
                  value={formData[currentQuestion.id] || ""}
                  min={currentQuestion.type === 'number' ? "0.1" : undefined} // Ensure positive number for land
                  step={currentQuestion.type === 'number' ? "0.1" : undefined}
                  onChange={(e) =>
                    setFormData({ ...formData, [currentQuestion.id]: e.target.value })
                  }
                  className="text-lg h-14"
                  // Only autoFocus on the first step for better mobile experience
                  autoFocus={currentStep === 0}
                   onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                          handleNext(); // Trigger next on Enter key
                      }
                   }}
                />
              )}
            </div>

            {/* Combined Button Logic */}
            <Button
                size="lg"
                className="w-full h-14" // Consistent button height
                onClick={handleNext} // Always call handleNext
                disabled={isLocating || isSaving}
              >
                {isLocating ? (
                  <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Getting Location... </>
                ) : isSaving ? (
                  <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Profile... </>
                ) : currentStep === questions.length - 1 ? (
                   <> <MapPin className="w-5 h-5 mr-2" /> Find My Farm & Finish </>
                ) : (
                   <> Next <ArrowRight className="w-5 h-5 ml-2" /> </>
                )}
              </Button>

          </div>
        </Card>

        {/* Removed redundant step counter */}
      </div>
    </div>
  );
};

export default Onboarding;