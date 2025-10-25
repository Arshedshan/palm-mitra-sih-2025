import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calculator, CreditCard, Shield, TrendingUp } from "lucide-react";

const calculators = [
  {
    id: "subsidy",
    icon: Calculator,
    title: "Subsidy Calculator",
    description: "NMEO-OP scheme benefits",
    path: "/money/subsidy",
    color: "text-success",
  },
  {
    id: "loan",
    icon: CreditCard,
    title: "Loan Calculator",
    description: "Microfinance EMI",
    path: "/money/loan",
    color: "text-accent",
  },
  {
    id: "insurance",
    icon: Shield,
    title: "Insurance",
    description: "Crop protection plans",
    path: "/money/insurance",
    color: "text-primary",
  },
  {
    id: "market",
    icon: TrendingUp,
    title: "Market Price",
    description: "Current & projected value",
    path: "/money/market",
    color: "text-success",
  },
];

const Money = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Money & Finance</h1>
              <p className="text-muted-foreground">Plan your finances smartly</p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-medium">
            <h2 className="text-xl font-bold mb-2">💡 Financial Planning Made Easy</h2>
            <p className="text-primary-foreground/90">
              Use these calculators to understand subsidies, loans, insurance, and market projections for your oil palm farm.
            </p>
          </Card>

          {/* Calculators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calculators.map((calc) => (
              <Card
                key={calc.id}
                className="p-6 hover:shadow-medium transition-all cursor-pointer group"
                onClick={() => navigate(calc.path)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-subtle flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <calc.icon className={`w-8 h-8 ${calc.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{calc.title}</h3>
                    <p className="text-sm text-muted-foreground">{calc.description}</p>
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

export default Money;
