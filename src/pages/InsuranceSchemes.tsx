// Create this new file at: src/pages/InsuranceSchemes.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label"; // <-- Import Label
import { ArrowLeft, Shield, Phone, Database, Zap, Clock } from "lucide-react";

// Mock data for insurance providers
const insuranceProviders = [
  {
    id: "aic",
    companyName: "Agriculture Insurance Co. of India (AIC)",
    schemeName: "PM Fasal Bima Yojana (PMFBY)",
    logoColor: "text-primary",
    icon: Database,
    premium: "2% (Kharif) / 1.5% (Rabi)",
    coverage: "Full coverage of sum insured against yield loss",
    features: [
      "Subsidized by Government.",
      "Covers natural calamities, pests, and diseases.",
      "Use of technology for faster claim settlement.",
    ],
    customerServiceNumber: "1800116515",
  },
  {
    id: "hdfc",
    companyName: "HDFC ERGO",
    schemeName: "Weather Based Crop Insurance",
    logoColor: "text-blue-600",
    icon: Zap,
    premium: "Varies (4% - 8%)",
    coverage: "Payout based on weather triggers (e.g., low rainfall)",
    features: [
      "No need to wait for crop-cutting experiments.",
      "Faster and transparent claim processing.",
      "Covers specific weather risks like drought, excess rain.",
    ],
    customerServiceNumber: "02262346234",
  },
  {
    id: "icici",
    companyName: "ICICI Lombard",
    schemeName: "PM Fasal Bima Yojana (PMFBY)",
    logoColor: "text-accent",
    icon: Shield,
    premium: "2% (Kharif) / 1.5% (Rabi)",
    coverage: "Indemnity-based coverage for yield loss",
    features: [
      "Designated by govt. for specific districts.",
      "Mobile app for easy enrollment and claim status.",
      "Strong rural presence and support network.",
    ],
    customerServiceNumber: "18002666",
  },
  {
    id: "iffco",
    companyName: "IFFCO-Tokio",
    schemeName: "Plantation/Horticulture Insurance",
    logoColor: "text-red-600",
    icon: Clock,
    premium: "Varies (3% - 7%)",
    coverage: "Covers the 'input cost' for plants up to maturity",
    features: [
      "Specifically designed for perennial crops like Oil Palm.",
      "Covers risks during the long gestation period.",
      "Protection against fire, flood, and cyclones.",
    ],
    customerServiceNumber: "18001035499",
  },
];

const InsuranceSchemes = () => {
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
              <h1 className="text-3xl font-bold">Insurance Plans</h1>
              <p className="text-muted-foreground">Protect your harvest</p>
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

          {/* Insurance Providers List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Available Insurance Providers</h2>
            {insuranceProviders.map((provider) => (
              <Card key={provider.id} className="p-6 shadow-medium overflow-hidden">
                <div className="space-y-4">
                  {/* Provider Header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${provider.logoColor} bg-muted`}>
                      <provider.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{provider.companyName}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{provider.schemeName}</p>
                    </div>
                  </div>

                  {/* Provider Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Premium Rate</Label>
                      <p className="font-semibold text-primary">{provider.premium}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Coverage</Label>
                      <p className="font-semibold">{provider.coverage}</p>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <div>
                    <h4 className="font-semibold mb-2">Key Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {provider.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Call to Action Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={() => handleCall(provider.customerServiceNumber)}
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

export default InsuranceSchemes;