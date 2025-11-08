/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Verification.tsx
*/
// src/pages/Verification.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, MapPin } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext"; 
import { toast } from "sonner"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; 

const Verification = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false); 
  const [showWelcomeCard, setShowWelcomeCard] = useState(false); 
  
  const { profile, loading } = useAuth(); 

  // --- Read the address from local storage ---
  // This was saved in the Onboarding.tsx file
  const savedAddress = localStorage.getItem("mockAddress");
  // ------------------------------------------

  useEffect(() => {
    if (loading) {
      setIsVerifying(true); 
      return;
    }

    if (profile) {
      // Profile exists, simulate blockchain/verification delay
      const timer = setTimeout(() => {
        setIsVerifying(false); // Stop loader
        setShowAddressModal(true); // Show address modal
      }, 2500); // 2.5 seconds delay

      return () => clearTimeout(timer); // Cleanup timer on unmount

    } else {
        console.warn("Verification page: Profile not found in context.");
        toast.error("Profile not found. Please complete onboarding.");
        navigate("/onboarding");
    }
  }, [profile, loading, navigate]); 
  
  const handleConfirmAddress = () => {
    setShowAddressModal(false);
    setShowWelcomeCard(true);
  };
  
  const handleContinue = () => {
    localStorage.removeItem("mockAddress"); // <-- Good cleanup
    navigate("/dashboard");
  };
  
  const farmerName = profile?.name?.split(" ")[0] || "Farmer";

  // --- Use the address from localStorage ---
  const displayAddress = savedAddress || 
    (profile ? `123, Palm Tree Lane, ${profile.district}, ${profile.state}` : "Loading address...");
  // ----------------------------------------

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        
        {/* Step 1: Verification Loader */}
        {isVerifying && (
          <Card className="p-12 shadow-medium text-center space-y-6">
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Verifying Your Farm
              </h2>
              <p className="text-muted-foreground">
                Checking records and registering on Green Ledger...
              </p>
            </div>
          </Card>
        )}

        {/* Step 2: Address Confirmation Modal */}
        <AlertDialog open={showAddressModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Confirm Your Address
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-4 text-base text-foreground">
                Based on your location and district, we've fetched your approximate farm address. Please confirm if this is correct.
                <Card className="p-4 mt-4 bg-muted/50 shadow-inner">
                    <p className="font-semibold text-foreground">{profile?.name}</p>
                    {/* Display the address from state */}
                    <p>{displayAddress}</p>
                </Card>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                    toast.info("Continuing with this address for now.");
                    handleConfirmAddress();
                }}>
                Incorrect
              </Button>
              <AlertDialogAction onClick={handleConfirmAddress}>
                Confirm Address
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Step 3: Welcome Card (after modal) */}
        {showWelcomeCard && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="p-12 shadow-strong text-center space-y-6 bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success">
              <div className="mx-auto w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-strong animate-in zoom-in duration-500">
                <CheckCircle2 className="w-14 h-14 text-success-foreground" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-foreground">
                  Welcome, {farmerName}!
                </h2>
                <p className="text-lg text-foreground font-semibold">
                  ✅ Your Farm is Verified
                </p>
                <p className="text-muted-foreground">
                  Registered as Deforestation-Free on the Green Ledger
                </p>
              </div>
            </Card>

            <Button
              variant="success"
              size="lg"
              className="w-full h-14" 
              onClick={handleContinue}
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;