import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield } from "lucide-react";

const plans = [
  { name: "Basic Cover", premium: "2%", coverage: "Up to ₹2 Lakh" },
  { name: "Standard Cover", premium: "3%", coverage: "Up to ₹5 Lakh" },
  { name: "Premium Cover", premium: "4%", coverage: "Up to ₹10 Lakh" },
];

const Insurance = () => {
  const navigate = useNavigate();
  const [cropValue, setCropValue] = useState("");
  const [premiumRate, setPremiumRate] = useState("2");
  const [result, setResult] = useState<number | null>(null);

  const calculatePremium = () => {
    const value = parseFloat(cropValue) || 0;
    const rate = parseFloat(premiumRate) / 100;
    const annual = value * rate;
    const monthly = annual / 12;
    setResult(Math.round(monthly));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/money")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Crop Insurance</h1>
              <p className="text-muted-foreground">Protect your investment</p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-medium">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Why Crop Insurance?</h3>
                <p className="text-sm text-primary-foreground/90">
                  Protect your oil palm plantation from natural calamities, pests, and diseases. Get compensation for crop loss.
                </p>
              </div>
            </div>
          </Card>

          {/* Plans */}
          <Card className="p-6 shadow-medium">
            <h3 className="font-bold mb-4">Available Insurance Plans</h3>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.name} className="bg-gradient-subtle p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.coverage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{plan.premium}</p>
                    <p className="text-xs text-muted-foreground">of crop value</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Calculator Form */}
          <Card className="p-8 shadow-medium">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cropValue">Expected Crop Value (₹)</Label>
                <Input
                  id="cropValue"
                  type="number"
                  placeholder="e.g., 500000"
                  value={cropValue}
                  onChange={(e) => setCropValue(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Premium Rate (% per year)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2"
                  value={premiumRate}
                  onChange={(e) => setPremiumRate(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <Button 
                variant="calculator" 
                size="lg" 
                className="w-full"
                onClick={calculatePremium}
              >
                Calculate Premium
              </Button>

              {result !== null && (
                <Card className="p-6 bg-primary/10 border-primary border-2 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Monthly Premium
                    </p>
                    <p className="text-4xl font-bold text-primary">
                      ₹{result.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Annual Premium: ₹{(result * 12).toLocaleString("en-IN")}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Insurance;
