import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  MessageCircle, 
  TrendingUp, 
  Award 
} from "lucide-react";

const modules = [
  { 
    id: "community", 
    icon: Users, 
    label: "Community", 
    description: "Success Stories",
    path: "/community",
    color: "text-primary"
  },
  { 
    id: "learn", 
    icon: BookOpen, 
    label: "Learn", 
    description: "Tips & Videos",
    path: "/learn",
    color: "text-accent"
  },
  { 
    id: "money", 
    icon: DollarSign, 
    label: "Money", 
    description: "Calculators & Finance",
    path: "/money",
    color: "text-success"
  },
  { 
    id: "expert", 
    icon: MessageCircle, 
    label: "Ask Expert", 
    description: "AI Assistant",
    path: "/chatbot",
    color: "text-primary"
  },
  { 
    id: "investors", 
    icon: TrendingUp, 
    label: "Find Investors", 
    description: "Fractional Farming",
    path: "/investors",
    color: "text-accent"
  },
  { 
    id: "progress", 
    icon: Award, 
    label: "My Progress", 
    description: "Track Growth",
    path: "/progress",
    color: "text-success"
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const profile = JSON.parse(localStorage.getItem("farmerProfile") || "{}");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <Card className="p-6 shadow-medium bg-gradient-primary">
            <div className="text-primary-foreground">
              <h1 className="text-3xl font-bold">
                Welcome, {profile.name}! 👋
              </h1>
              <p className="text-primary-foreground/90 mt-2">
                {profile.landSize} acres • {profile.district}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-success/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span className="text-sm font-semibold">Verified Farm</span>
              </div>
            </div>
          </Card>

          {/* Modules Grid */}
          <div className="grid grid-cols-2 gap-4">
            {modules.map((module) => (
              <Button
                key={module.id}
                variant="dashboard"
                className="h-40 p-6"
                onClick={() => navigate(module.path)}
              >
                <module.icon className={`w-12 h-12 ${module.color}`} />
                <div className="mt-3 space-y-1">
                  <p className="font-bold text-lg">{module.label}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {module.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
