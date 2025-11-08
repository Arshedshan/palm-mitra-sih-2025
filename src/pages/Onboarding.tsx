/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Onboarding.tsx
*/
// src/pages/Onboarding.tsx
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
import { useAuth, FarmerProfile } from "@/context/AuthContext"; 

// State and District Data
const stateDistrictMap: Record<string, string[]> = {
  "Andhra Pradesh": ["East Godavari", "West Godavari", "Krishna", "Chittoor"],
  "Telangana": ["Khammam", "Nalgonda", "Suryapet", "Bhadradri Kothagudem"],
  "Tamil Nadu": ["Tirunelveli", "Tenkasi", "Cuddalore", "Thanjavur"],
  "Karnataka": ["Davanagere", "Shimoga", "Mysore", "Mandya"]
};
const states = Object.keys(stateDistrictMap).sort();


// Questions array
const questions = [
  { id: "name", label: "What is your name?", type: "text", placeholder: "Enter your name" },
  { id: "phone", label: "What is your phone number?", type: "tel", placeholder: "e.g., 9876543210" }, 
  { id: "state", label: "What is your state?", type: "select", placeholder: "Select your state" },
  { id: "district", label: "What is your district?", type: "select", placeholder: "Select your district" },
  { id: "landSize", label: "How much land do you have? (in acres)", type: "text", placeholder: "e.g., 2.5 or 5" },
  { id: "plantingDate", label: "When did you plant your oil palm? (Approx.)", type: "date" },
];


const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuth(); 
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    phone: "", 
    state: "",
    district: "",
    landSize: "",
    plantingDate: ""
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
     if (profile) {
        toast.info("You already have a profile. Redirecting to dashboard.");
        navigate('/dashboard');
     }
  }, [profile, navigate]);

  const language = localStorage.getItem("selectedLanguageName") || "English";
  const langCode = localStorage.getItem("selectedLanguage") || 'en';

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    const rawValue = formData[currentQuestion.id];

    // Validation
    if (!rawValue || rawValue.trim() === "") {
        toast.error(`Please ${currentQuestion.type === 'select' ? 'select' : 'enter'} your ${currentQuestion.label.toLowerCase()}`);
        return;
    }
    if (currentQuestion.id === 'phone') {
        const phoneRegex = /^[6-9]\d{9}$/; 
        if (!phoneRegex.test(rawValue)) {
            toast.error("Please enter a valid 10-digit phone number.");
            return;
        }
    }
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
      handleGetLocation(); 
    }
  };

  const handleGetLocation = () => {
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

      const profileData = { ...formData }; 
      const landSizeNum = parseFloat(profileData.landSize.replace(',', '.')) || 0;

      // --- NEW: Generate and store mock address ---
      const mockAddress = `123, Palm Tree Lane, ${profileData.district}, ${profileData.state}`;
      // Save to local storage for Verification.tsx to read
      localStorage.setItem("mockAddress", mockAddress); 
      // ------------------------------------------

      try {
        // 1. Insert into 'farmers' table
        const { data: farmer, error: farmerError } = await supabase
          .from('farmers')
          .insert({
            user_id: user.id, 
            name: profileData.name,
            phone: profileData.phone, 
            state: profileData.state, 
            district: profileData.district,
            address: mockAddress, // <-- SAVE ADDRESS TO DB
            land_size: landSizeNum,
            language: langCode,
            gps_coords: location
          })
          .select('*') 
          .single();

        if (farmerError) throw farmerError;

        // 2. Insert into 'cultivation' table
        if (farmer && profileData.plantingDate) {
           await supabase.from('cultivation').insert({
              farmer_id: farmer.id, 
              planting_date: profileData.plantingDate,
              status: 'Gestation' 
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
        setProfile(farmer as FarmerProfile); 
        localStorage.setItem("farmerProfile", JSON.stringify(farmer));
        
        navigate("/verification"); 

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
          saveProfileAndVerify(null); 
        },
        { timeout: 10000 }
      );
    } else {
      toast.error("Geolocation not supported. Saving profile without precise location.");
      saveProfileAndVerify(null);
    }
  };

  const currentQuestion = questions[currentStep];
  const currentDistricts = stateDistrictMap[formData.state] || [];

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
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="space-y-2 min-h-[120px]">
              <Label htmlFor={currentQuestion.id} className="text-lg font-semibold">
                {currentQuestion.label}
              </Label>
              
              {currentQuestion.id === "state" ? (
                <Select
                  value={formData.state}
                  onValueChange={(value) =>
                    setFormData({ ...formData, state: value, district: "" })
                  }
                >
                  <SelectTrigger className="text-lg h-14">
                    <SelectValue placeholder={currentQuestion.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-background z-50">
                    {states.map((state) => (
                      <SelectItem key={state} value={state} className="text-base">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : currentQuestion.id === "district" ? (
                <Select
                  value={formData.district}
                  onValueChange={(value) =>
                    setFormData({ ...formData, district: value })
                  }
                  disabled={!formData.state} 
                >
                  <SelectTrigger className="text-lg h-14">
                    <SelectValue placeholder={!formData.state ? "Select a state first" : currentQuestion.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-background z-50">
                    {currentDistricts.map((district) => (
                      <SelectItem key={district} value={district} className="text-base">
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                 <Input
                  id={currentQuestion.id}
                  type={currentQuestion.type === 'date' ? 'date' : currentQuestion.type === 'tel' ? 'tel' : 'text'}
                  inputMode={currentQuestion.id === 'landSize' ? "decimal" : currentQuestion.id === 'phone' ? 'tel' : 'text'}
                  placeholder={currentQuestion.placeholder}
                  value={formData[currentQuestion.id] || ""}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (currentQuestion.id === 'landSize') {
                      value = value.replace(/[^0-9.,]/g, '');
                      const separators = value.match(/[.,]/g) || [];
                      if (separators.length > 1) {
                         const firstSeparatorIndex = value.indexOf(separators[0]);
                         value = value.substring(0, firstSeparatorIndex + 1) + value.substring(firstSeparatorIndex + 1).replace(/[.,]/g, '');
                      }
                    } else if (currentQuestion.id === 'phone') {
                      value = value.replace(/[^0-9]/g, '').substring(0, 10);
                    }
                    setFormData({ ...formData, [currentQuestion.id]: value });
                  }}
                  className="text-lg h-14"
                  autoFocus={currentStep === 0}
                />
              )}
            </div>

            <Button
                type="submit" 
                size="lg"
                className="w-full h-14"
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
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;