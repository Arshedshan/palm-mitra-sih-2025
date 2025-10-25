import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

const Verification = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [farmerName, setFarmerName] = useState("");

  useEffect(() => {
    const profile = localStorage.getItem("farmerProfile");
    if (profile) {
      const data = JSON.parse(profile);
      setFarmerName(data.name);
      
      // Simulate blockchain verification
      setTimeout(() => {
        setIsVerifying(false);
      }, 2500);
    }
  }, []);

  const handleContinue = () => {
    navigate("/dashboard");
  };

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
                Checking deforestation records and registering on Green Ledger...
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
                  Your farm has been registered as Deforestation-Free on the Green Ledger blockchain
                </p>
              </div>
            </Card>

            <Button
              variant="success"
              size="lg"
              className="w-full"
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
