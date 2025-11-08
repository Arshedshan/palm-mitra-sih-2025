/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/MicroFinance.tsx
*/
// Create this new file at: src/pages/MicroFinance.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, Banknote, Landmark, Users } from "lucide-react";

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

const MicroFinance = () => {
  const navigate = useNavigate();

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Microfinance Partners</h1>
              <p className="text-muted-foreground">Find loan partners for your farm</p>
            </div>
          </div>
          
          {/* --- Microfinance Partners List --- */}
          <div className="space-y-6">
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

export default MicroFinance;