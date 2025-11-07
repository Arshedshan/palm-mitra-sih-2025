// src/pages/Verification.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // <-- Import useAuth
import { toast } from "sonner"; // <-- Import toast for error handling

const Verification = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  // --- MODIFICATION: Get profile from Auth context ---
  const { profile, loading } = useAuth(); 
  // --------------------------------------------------

  useEffect(() => {
    // Wait for auth loading to finish
    if (loading) {
      setIsVerifying(true); // Show loader while auth is loading
      return;
    }

    // --- MODIFICATION: Check profile from context, not localStorage ---
    if (profile) {
      // Profile exists, simulate blockchain/verification delay
      const timer = setTimeout(() => {
        setIsVerifying(false);
      }, 2500); // 2.5 seconds delay

      return () => clearTimeout(timer); // Cleanup timer on unmount

    } else {
        // Auth is done, but profile is still null
        // This means the user landed here directly without onboarding
        console.warn("Verification page: Profile not found in context.");
        toast.error("Profile not found. Please complete onboarding.");
        navigate("/onboarding");
    }
  }, [profile, loading, navigate]); // Depend on profile and loading from context
  // ------------------------------------------------------------

  const handleContinue = () => {
    navigate("/dashboard");
  };
  
  // Use profile name from context, fallback to "Farmer"
  const farmerName = profile?.name?.split(" ")[0] || "Farmer";

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {isVerifying ? (
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
        ) : (
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
              className="w-full h-14" // Match height
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