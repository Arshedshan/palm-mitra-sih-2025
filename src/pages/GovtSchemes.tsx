// Create this new file at: src/pages/GovtSchemes.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label"; // <-- Import Label
import {
  ArrowLeft,
  Award,
  Phone,
  Sprout,
  Database,
  Banknote,
  Droplets,
} from "lucide-react";

// Mock data for Govt. Schemes
const govtSchemes = [
  {
    id: "nmeo-op",
    deptName: "Ministry of Agriculture & Farmers Welfare",
    schemeName: "National Mission on Edible Oils - Oil Palm (NMEO-OP)",
    logoColor: "text-green-600",
    icon: Sprout,
    subsidy: "₹29,000 / hectare",
    assistance: "For planting material (fresh planting)",
    features: [
      "Additional ₹70,000/ha for intercropping (gestation).",
      "Viability Price (VP) assurance from the govt.",
      "Special focus on North-Eastern States & A&N islands.",
    ],
    customerServiceNumber: "18001801551", // Kisan Call Centre
  },
  {
    id: "pm-kisan",
    deptName: "Govt. of India",
    schemeName: "PM-KISAN Samman Nidhi",
    logoColor: "text-primary",
    icon: Database,
    subsidy: "₹6,000 / year",
    assistance: "Direct income support in 3 installments",
    features: [
      "Direct Benefit Transfer (DBT) to your bank account.",
      "Available to all land-holding farmer families.",
      "e-KYC is mandatory to receive benefits.",
    ],
    customerServiceNumber: "155261", // PM-KISAN Helpline
  },
  {
    id: "kcc",
    deptName: "Dept. of Financial Services",
    schemeName: "Kisan Credit Card (KCC)",
    logoColor: "text-accent",
    icon: Banknote,
    subsidy: "Subsidized 4% interest",
    assistance: "Short-term credit for crop & maintenance",
    features: [
      "Provides affordable credit from banks.",
      "Covers costs of cultivation and post-harvest expenses.",
      "Simplified application and renewal process.",
    ],
    customerServiceNumber: "1800112211", // Example: SBI Agri
  },
  {
    id: "pmksy-mif",
    deptName: "NABARD",
    schemeName: "PMKSY - Micro Irrigation Fund (MIF)",
    logoColor: "text-blue-600",
    icon: Droplets,
    subsidy: "Up to 55% subsidy",
    assistance: "For installing drip & sprinkler systems",
    features: [
      "Promotes 'Per Drop, More Crop' to save water.",
      "Crucial for water-intensive crops like oil palm.",
      "Implemented via state agriculture departments.",
    ],
    customerServiceNumber: "02226539896", // Example: NABARD
  },
];

const GovtSchemes = () => {
  const navigate = useNavigate();

  // Get the user's saved language name
  const langName = localStorage.getItem("selectedLanguageName") || "your local";
  const languageNote = `(Helpline may be available in ${langName} language)`;

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
              <h1 className="text-3xl font-bold">Govt. Schemes</h1>
              <p className="text-muted-foreground">Subsidies & Benefits</p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 bg-gradient-accent text-accent-foreground shadow-medium">
            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">About Govt. Schemes</h3>
                <p className="text-sm text-accent-foreground/90">
                  Government schemes can reduce your setup costs, provide income support, and help you adopt modern technology like micro-irrigation.
                </p>
              </div>
            </div>
          </Card>

          {/* Govt. Schemes List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Available Schemes</h2>
            {govtSchemes.map((scheme) => (
              <Card key={scheme.id} className="p-6 shadow-medium overflow-hidden">
                <div className="space-y-4">
                  {/* Scheme Header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${scheme.logoColor} bg-muted`}>
                      <scheme.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{scheme.deptName}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{scheme.schemeName}</p>
                    </div>
                  </div>

                  {/* Scheme Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Assistance / Subsidy</Label>
                      <p className="font-semibold text-primary">{scheme.subsidy}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Benefit</Label>
                      <p className="font-semibold">{scheme.assistance}</p>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div>
                    <h4 className="font-semibold mb-2">Key Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {scheme.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Call to Action Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={() => handleCall(scheme.customerServiceNumber)}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call Helpline
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

export default GovtSchemes;