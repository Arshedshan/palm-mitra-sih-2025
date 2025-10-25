import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const partners = [
  { name: "Bandhan Bank", rate: "12%" },
  { name: "SKS Microfinance", rate: "14%" },
  { name: "Ujjivan Small Finance", rate: "13%" },
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

          {/* Partners */}
          <Card className="p-6 shadow-medium">
            <h3 className="font-bold mb-4">Microfinance Partners</h3>
            <div className="grid grid-cols-3 gap-3">
              {partners.map((partner) => (
                <div key={partner.name} className="bg-gradient-subtle p-3 rounded-lg text-center">
                  <p className="font-semibold text-sm">{partner.name}</p>
                  <p className="text-xs text-primary font-bold mt-1">{partner.rate}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Calculator Form */}
          <Card className="p-8 shadow-medium">
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
                      Monthly EMI
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
