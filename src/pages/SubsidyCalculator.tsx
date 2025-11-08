/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/SubsidyCalculator.tsx
*/
// src/pages/SubsidyCalculator.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator } from "lucide-react";
import { toast } from "sonner"; // <-- IMPORT TOAST

const SubsidyCalculator = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState("");
  const [land, setLand] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculateSubsidy = () => {
    const plantsNum = parseInt(plants) || 0;
    const landNum = parseFloat(land) || 0;
    
    // --- VALIDATION ADDED ---
    // Check if both are 0 (or empty)
    if (plantsNum <= 0 && landNum <= 0) {
      toast.error("Please enter a valid number of plants or land area.");
      setResult(null); // Clear previous result
      return;
    }
    // --- END VALIDATION ---
    
    // NMEO-OP scheme calculation (simplified)
    const subsidyPerPlant = 30;
    const subsidyPerAcre = 12000;
    const total = (plantsNum * subsidyPerPlant) + (landNum * subsidyPerAcre);
    
    setResult(total);
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
              <h1 className="text-3xl font-bold">Subsidy Calculator</h1>
              <p className="text-muted-foreground">NMEO-OP Scheme Benefits</p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 bg-gradient-accent text-accent-foreground shadow-medium">
            <div className="flex items-start gap-4">
              <Calculator className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">About NMEO-OP</h3>
                <p className="text-sm text-accent-foreground/90">
                  The National Mission on Edible Oils - Oil Palm (NMEO-OP) provides financial assistance to farmers for oil palm cultivation.
                </p>
              </div>
            </div>
          </Card>

          {/* Calculator Form */}
          <Card className="p-8 shadow-medium">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="plants">Number of Oil Palm Plants</Label>
                <Input
                  id="plants"
                  type="number"
                  placeholder="e.g., 500"
                  value={plants}
                  onChange={(e) => setPlants(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="land">Land Area (in acres)</Label>
                <Input
                  id="land"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  value={land}
                  onChange={(e) => setLand(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <Button 
                variant="calculator" 
                size="lg" 
                className="w-full"
                onClick={calculateSubsidy}
              >
                Calculate Subsidy
              </Button>

              {result !== null && (
                <Card className="p-6 bg-success/10 border-success border-2 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Estimated Subsidy Amount
                    </p>
                    <p className="text-4xl font-bold text-success">
                      ₹{result.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This is an estimated calculation based on NMEO-OP guidelines
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

export default SubsidyCalculator;