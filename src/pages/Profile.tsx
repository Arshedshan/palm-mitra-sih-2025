/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Profile.tsx
*/
// Create this new file at src/pages/Profile.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Home,
  MapPin,
  Sprout,
  ShieldCheck,
  CalendarDays,
  TrendingUp,
  DollarSign,
  PieChart,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// --- Helper Types ---
interface CultivationData {
  planting_date: string | null;
  status: string | null;
}
interface InvestmentStats {
  totalStakeAllocated: number;
  totalMoneyReceived: number;
  availableStake: number;
}
interface LinkedInvestor {
  investors: {
    offer_percent: number;
    amount: number;
  } | null;
}

// --- Helper Functions ---
const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return "N/A";
  return `₹${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount)}`;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const Profile = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  
  const [cultivation, setCultivation] = useState<CultivationData | null>(null);
  const [investmentStats, setInvestmentStats] = useState<InvestmentStats>({
    totalStakeAllocated: 0,
    totalMoneyReceived: 0,
    availableStake: 100,
  });
  const [isVerified, setIsVerified] = useState(false);
  const [daysToHarvest, setDaysToHarvest] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish
    if (!profile) {
      toast.error("Profile not found. Redirecting...");
      navigate("/onboarding");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [cultivationResult, investorResult, verificationResult] =
          await Promise.all([
            // 1. Get Cultivation Data
            supabase
              .from("cultivation")
              .select("planting_date, status")
              .eq("farmer_id", profile.id)
              .order("planting_date", { ascending: true })
              .limit(1)
              .single(),
            
            // 2. Get Investor Stats
            supabase
              .from("farmer_investor_links")
              .select(`investors ( offer_percent, amount )`)
              .eq("farmer_id", profile.id)
              .eq("status", "approved"),
            
            // 3. Get Verification Status
            supabase
              .from("Green_Ledger")
              .select("status")
              .eq("farm_id", profile.id)
              .eq("status", "Verified: Deforestation-Free")
              .limit(1)
              .single(),
          ]);

        // Process Cultivation Data
        if (cultivationResult.data) {
          const cultData = cultivationResult.data as CultivationData;
          setCultivation(cultData);
          
          if (cultData.status === 'Gestation' && cultData.planting_date) {
            const plantDate = new Date(cultData.planting_date);
            const today = new Date();
            const gestationPeriodDays = 3.5 * 365.25; // ~1278 days
            const firstHarvestDate = new Date(plantDate.getTime() + gestationPeriodDays * 24 * 60 * 60 * 1000);
            const timeToHarvest = firstHarvestDate.getTime() - today.getTime();
            setDaysToHarvest(Math.max(0, Math.ceil(timeToHarvest / (1000 * 60 * 60 * 24))));
          }
        }

        // Process Investor Stats
        if (investorResult.data) {
          const typedData = investorResult.data as unknown as LinkedInvestor[];
          const totalStake = typedData.reduce((sum, link) => sum + (link.investors?.offer_percent || 0), 0);
          const totalMoney = typedData.reduce((sum, link) => sum + (link.investors?.amount || 0), 0);
          setInvestmentStats({
            totalStakeAllocated: totalStake,
            totalMoneyReceived: totalMoney,
            availableStake: Math.max(0, 100 - totalStake),
          });
        }

        // Process Verification Status
        if (verificationResult.data) {
          setIsVerified(true);
        }

      } catch (error: any) {
        console.error("Error fetching profile details:", error);
        toast.error("Could not load all profile details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile, authLoading, navigate]);

  if (authLoading || isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Your complete farmer overview
              </p>
            </div>
          </div>

          {/* Personal Details Card */}
          <Card className="p-4 sm:p-6 shadow-medium rounded-2xl">
            <div className="flex items-center gap-4 sm:gap-6">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl">
                  {profile.name?.charAt(0).toUpperCase() || <User />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {profile.name}
                </h2>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone || "No phone number"}</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Home className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>{profile.address || "No address provided"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Farm Details Card */}
          <Card className="p-4 sm:p-6 shadow-soft rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Farm Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <div className="flex items-start gap-3">
                <Sprout className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Land Size
                  </p>
                  <p className="font-semibold text-foreground">
                    {profile.land_size} acres
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Verification
                  </p>
                  <p className={`font-semibold ${isVerified ? 'text-success' : 'text-destructive'}`}>
                    {isVerified ? 'Verified Deforestation-Free' : 'Not Verified'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    State
                  </p>
                  <p className="font-semibold text-foreground">
                    {profile.state || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    District
                  </p>
                  <p className="font-semibold text-foreground">
                    {profile.district}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cultivation Status Card */}
          <Card className="p-4 sm:p-6 shadow-soft rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Cultivation Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Planting Date
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatDate(cultivation?.planting_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Status
                  </p>
                  <p className="font-semibold text-foreground">
                    {cultivation?.status || "N/A"}
                  </p>
                </div>
              </div>
              {daysToHarvest !== null && daysToHarvest > 0 && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <Info className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Time to First Harvest
                    </p>
                    <p className="font-semibold text-accent">
                      Approximately {daysToHarvest} days remaining
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Investment Summary Card */}
          <Card className="p-4 sm:p-6 shadow-soft rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Investment Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-5">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Funds Received
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(investmentStats.totalMoneyReceived)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PieChart className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Stake Allocated
                  </p>
                  <p className="font-semibold text-foreground">
                    {investmentStats.totalStakeAllocated.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PieChart className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Available Stake
                  </p>
                  <p className="font-semibold text-success">
                    {investmentStats.availableStake.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Profile;