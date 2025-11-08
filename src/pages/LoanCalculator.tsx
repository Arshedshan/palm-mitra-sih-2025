/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/LoanCalculator.tsx
*/
// src/pages/LoanCalculator.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner"; // <-- IMPORT TOAST

const LoanCalculator = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("5");
  const [result, setResult] = useState<number | null>(null);

  const calculateEMI = () => {
    const principal = parseFloat(amount) || 0;
    const monthlyRate = (parseFloat(rate) / 100) / 12;
    const months = parseInt(years) * 12;
    
    // --- VALIDATION ADDED ---
    if (principal <= 0) {
      toast.error("Please enter a valid Loan Amount.");
      setResult(null); // Clear previous result
      return;
    }
    if (monthlyRate <= 0) {
      toast.error("Please enter a valid Interest Rate.");
      setResult(null); // Clear previous result
      return;
    }
    if (months <= 0) {
      toast.error("Please enter a valid Loan Duration.");
      setResult(null); // Clear previous result
      return;
    }
    // --- END VALIDATION ---
    
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    setResult(Math.round(emi));
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
              <h1 className="text-3xl font-bold">Loan Calculator</h1>
              <p className="text-muted-foreground">Calculate your EMI</p>
            </div>
          </div>

          {/* Calculator Form */}
          <Card className="p-8 shadow-medium">
            <h3 className="text-2xl font-bold text-center mb-6">EMI Calculator</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Interest Rate (% per year)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 12"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years">Loan Duration (years)</Label>
                <Input
                  id="years"
                  type="number"
                  placeholder="e.g., 5"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="text-lg h-14"
                />
              </div>

              <Button 
                variant="calculator" 
                size="lg" 
                className="w-full"
                onClick={calculateEMI}
              >
                Calculate EMI
              </Button>

              {result !== null && (
                <Card className="p-6 bg-accent/10 border-accent border-2 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Estimated Monthly EMI
                    </p>
                    <p className="text-4xl font-bold text-accent">
                      ₹{result.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Payment: ₹{(result * parseInt(years) * 12).toLocaleString("en-IN")}
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

export default LoanCalculator;