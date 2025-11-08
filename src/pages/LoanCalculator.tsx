// src/pages/LoanCalculator.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, Banknote, Landmark, Users, Percent } from "lucide-react"; // <-- Added new icons

// Mock data for Finance Partners
const financePartners = [
  {
    id: "bandhan",
    companyName: "Bandhan Bank",
    schemeName: "Agri Loan - Crop Loan",
    logoColor: "text-red-600",
    icon: Landmark,
    premium: "Starts at 12% p.a.",
    coverage: "Up to ₹5 Lakh",
    features: [
      "Flexible repayment terms based on harvest cycle.",
      "Minimal documentation for existing customers.",
      "Option for Kisan Credit Card (KCC).",
    ],
    customerServiceNumber: "18002588181", // Example number
  },
  {
    id: "sks",
    companyName: "SKS Microfinance (Bharat Financial)",
    schemeName: "Joint Liability Group Loan",
    logoColor: "text-blue-600",
    icon: Users,
    premium: "Approx. 19.75% p.a.",
    coverage: "Up to ₹60,000 (group-based)",
    features: [
      "No-collateral loans for small groups.",
      "Weekly collection and support meetings.",
      "Ideal for small-scale cultivation expenses.",
    ],
    customerServiceNumber: "18002081110", // Example number
  },
  {
    id: "ujjivan",
    companyName: "Ujjivan Small Finance Bank",
    schemeName: "Agri Group Loan",
    logoColor: "text-purple-600",
    icon: Banknote,
    premium: "Starts at 13.5% p.a.",
    coverage: "Varies by group and purpose",
    features: [
      "Loans for agricultural and allied activities.",
      "Also provides individual agri loans (Bhoomi).",
      "Focus on serving unbanked rural areas.",
    ],
    customerServiceNumber: "18002082121", // Example number
  },
];

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
    
    if (principal > 0 && monthlyRate > 0 && months > 0) {
      const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      setResult(Math.round(emi));
    }
  };

  // Get the user's saved language name
  const langName = localStorage.getItem("selectedLanguageName") || "your local";
  const languageNote = `(Service may be available in ${langName} language)`;

  // Function to initiate a call
  const handleCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`);
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

          {/* This section has been removed from the top */}
          {/* <Card className="p-6 shadow-medium"> ... </Card> */}

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
          
          {/* --- NEW: Microfinance Partners List (at the bottom) --- */}
          <div className="space-y-6 pt-6 border-t">
            <h2 className="text-2xl font-bold text-foreground">Available Microfinance Partners</h2>
            {financePartners.map((partner) => (
              <Card key={partner.id} className="p-6 shadow-medium overflow-hidden">
                <div className="space-y-4">
                  {/* Partner Header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${partner.logoColor} bg-muted`}>
                      <partner.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{partner.companyName}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{partner.schemeName}</p>
                    </div>
                  </div>

                  {/* Partner Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Interest Rate (p.a.)</Label>
                      <p className="font-semibold text-primary">{partner.premium}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Loan Amount</Label>
                      <p className="font-semibold">{partner.coverage}</p>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div>
                    <h4 className="font-semibold mb-2">Key Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {partner.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Call to Action Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={() => handleCall(partner.customerServiceNumber)}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call Customer Service
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {languageNote}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;