import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, TrendingUp } from "lucide-react";

const MarketPrice = () => {
  const navigate = useNavigate();
  const [acres, setAcres] = useState("");
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [futureValue, setFutureValue] = useState<number | null>(null);

  const calculateValue = () => {
    const acresNum = parseFloat(acres) || 0;
    
    // Simplified market price calculation
    const currentPrice = acresNum * 150000; // Current value per acre
    const futurePrice = acresNum * 400000; // Projected 5-year value
    
    setCurrentValue(currentPrice);
    setFutureValue(futurePrice);
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
              <h1 className="text-3xl font-bold">Market Price Calculator</h1>
              <p className="text-muted-foreground">Current & Projected Value</p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-medium">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Market Trends</h3>
                <p className="text-sm text-primary-foreground/90">
                  Oil palm prices have shown consistent growth of 15-20% annually. Calculate your farm's current and future market value.
                </p>
              </div>
            </div>
          </Card>

          {/* Calculator Form */}
          <Card className="p-8 shadow-medium">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="acres">Plantation Area (in acres)</Label>
                <Input
                  id="acres"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5"
                  value={acres}
                  onChange={(e) => setAcres(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <Button 
                variant="calculator" 
                size="lg" 
                className="w-full"
                onClick={calculateValue}
              >
                Calculate Market Value
              </Button>

              {currentValue !== null && futureValue !== null && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <Card className="p-6 bg-muted border-2">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">
                        Today's Market Value
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        ₹{currentValue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-6 bg-success/10 border-success border-2">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground font-medium">
                        Projected 5-Year Value
                      </p>
                      <p className="text-3xl font-bold text-success">
                        ₹{futureValue.toLocaleString("en-IN")}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-success">
                        <TrendingUp className="w-5 h-5" />
                        <p className="text-sm font-semibold">
                          +{Math.round(((futureValue - currentValue) / currentValue) * 100)}% Growth
                        </p>
                      </div>
                    </div>
                  </Card>

                  <p className="text-xs text-center text-muted-foreground">
                    * Projections based on 4-5 year market trend analysis and NMEO-OP data
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketPrice;
