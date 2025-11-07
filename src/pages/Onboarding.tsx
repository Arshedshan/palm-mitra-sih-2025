// Replace this file: src/pages/Onboarding.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext"; // <-- Import useAuth

// Define the questions, including the new 'plantingDate'
const questions = [
  { id: "name", label: "What is your name?", type: "text", placeholder: "Enter your name" },
  { id: "district", label: "What is your district?", type: "select", placeholder: "Select your district" },
  { id: "landSize", label: "How much land? (in acres)", type: "text", placeholder: "e.g., 2.5 or 5" },
  { id: "plantingDate", label: "When did you plant your oil palm? (Approx.)", type: "date" },
];

// ... (keep the districts array as is)
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
  const { user, profile } = useAuth(); // <-- Get the logged-in user and profile
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Redirect if user already has a profile
  useEffect(() => {
     if (profile) {
        toast.info("You already have a profile. Redirecting to dashboard.");
        navigate('/dashboard');
     }
  }, [profile, navigate]);

  // Use language from localStorage (assuming Language.tsx was visited after register)
  const language = localStorage.getItem("selectedLanguageName") || "English";
  const langCode = localStorage.getItem("selectedLanguage") || 'en';

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    const rawValue = formData[currentQuestion.id];

    // Check 1: Is the field empty or just whitespace?
    if (!rawValue || rawValue.trim() === "") {
        toast.error(`Please ${currentQuestion.type === 'select' ? 'select' : 'enter'} your ${currentQuestion.id === 'landSize' ? 'land size' : currentQuestion.id.toLowerCase()}`);
        return;
    }
    // Check 2: Specific validation for landSize (now type="text")
    if (currentQuestion.id === 'landSize') {
        const numericString = rawValue.replace(',', '.');
        const landValue = parseFloat(numericString);
        if (isNaN(landValue) || landValue <= 0) {
            toast.error("Please enter a valid land size greater than zero (e.g., 2.5).");
            return;
        }
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetLocation(); // Last step, proceed to location
    }
  };

  const handleGetLocation = () => {
    // Validation for all fields before getting location
    for (const question of questions) {
        if (!formData[question.id] || formData[question.id].trim() === "") {
           toast.error(`Please complete all fields. ${question.label} is missing.`);
           setCurrentStep(questions.findIndex(q => q.id === question.id));
           return;
        }
    }
    setIsLocating(true);

    const saveProfileAndVerify = async (location: { latitude: number; longitude: number; } | null) => {
      if (!user) {
        toast.error("Authentication session lost. Redirecting to login.");
        navigate('/');
        return;
      }
      setIsSaving(true);
      setIsLocating(false);

      const profileData = { ...formData }; // All form data
      const landSizeNum = parseFloat(profileData.landSize.replace(',', '.')) || 0;

      try {
        // 1. Insert into 'farmers' table, linking the user_id
        const { data: farmer, error: farmerError } = await supabase
          .from('farmers')
          .insert({
            user_id: user.id, // <-- CRITICAL: Link to auth.user.id
            name: profileData.name,
            district: profileData.district,
            land_size: landSizeNum,
            language: langCode,
            gps_coords: location
          })
          .select('id, name, district, land_size') // Select new profile data
          .single();

        if (farmerError) throw farmerError;

        // 2. Insert into new 'cultivation' table
        if (farmer && profileData.plantingDate) {
           await supabase.from('cultivation').insert({
              farmer_id: farmer.id, // <-- Link to farmers table PK (id)
              planting_date: profileData.plantingDate,
              status: 'Gestation' // Default status
           });
        }
        
        // 3. (SIMULATION) Insert into 'Green_Ledger'
        if (farmer && location) {
            await supabase.from('Green_Ledger').insert({
                farm_id: farmer.id,
                coordinates: location,
                status: 'Verified: Deforestation-Free'
            });
        }

        setIsSaving(false);
        // Save profile to localStorage (for Verification page)
        // The AuthContext will also pick this up, but this is faster
        localStorage.setItem("farmerProfile", JSON.stringify(farmer));
        localStorage.setItem("farmerId", farmer.id);
        
        navigate("/verification"); // Go to verification step

      } catch (error: any) {
        console.error("Supabase error during onboarding:", error);
        toast.error(`Failed to save profile: ${error.message}.`);
        setIsSaving(false);
      }
    };
    
    // Geolocation logic
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveProfileAndVerify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Location access denied. Saving profile without precise location.");
          saveProfileAndVerify(null); // Proceed without location
        },
        { timeout: 10000 }
      );
    } else {
      toast.error("Geolocation not supported. Saving profile without precise location.");
      saveProfileAndVerify(null);
    }
  };

  const currentQuestion = questions[currentStep];

  // Render null or loader if user is not set yet
  if (!user) {
     return (
         <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
         </div>
     );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">Logged in as: {user.email}</p>
          <div className="flex gap-2 justify-center pt-4">
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
            <div className="space-y-2 min-h-[120px]">
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
                  // Set type for "date" input
                  type={currentQuestion.type === 'date' ? 'date' : 'text'}
                  // Use inputMode for mobile keyboards
                  inputMode={currentQuestion.id === 'landSize' ? "decimal" : "text"}
                  placeholder={currentQuestion.placeholder}
                  value={formData[currentQuestion.id] || ""}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Filter input for landSize
                    if (currentQuestion.id === 'landSize') {
                      value = value.replace(/[^0-9.,]/g, '');
                      const separators = value.match(/[.,]/g) || [];
                      if (separators.length > 1) {
                         const firstSeparatorIndex = value.indexOf(separators[0]);
                         value = value.substring(0, firstSeparatorIndex + 1) + value.substring(firstSeparatorIndex + 1).replace(/[.,]/g, '');
                      }
                    }
                    setFormData({ ...formData, [currentQuestion.id]: value });
                  }}
                  className="text-lg h-14"
                  autoFocus={currentStep === 0}
                   onKeyPress={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
                   }}
                />
              )}
            </div>

            <Button
                size="lg"
                className="w-full h-14"
                onClick={handleNext}
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
      </div>
    </div>
  );
};

export default Onboarding;