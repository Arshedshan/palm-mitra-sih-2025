// Create this new file: src/pages/InvestorDashboard.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Loader2, MapPin, Sprout, ShieldCheck, User, CalendarDays, BarChart, 
  DollarSign, Info, CheckCircle, Clock, TrendingUp, Building, LogOut, Store
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { FarmerProfile } from "@/context/AuthContext"; // Re-use FarmerProfile interface

// Interface for investor data (from 'investors' table)
interface InvestorData {
  investor_id: string;
  investor_name: string;
  location: string | null;
  amount: number | null;
  offer_percent: number;
  duration: string | null;
}

// Interface for cultivation data
interface CultivationData {
  planting_date: string | null;
  status: string | null;
}

// Combined interface for an approved investment
interface ApprovedInvestment {
    link_id: string;
    approved_at: string | null;
    status: 'approved';
    farmers: FarmerProfile | null;     // Joined Farmer details
    investors: InvestorData | null;  // Joined Investor details
    cultivation: CultivationData | null; // Manually fetched cultivation data
}

// Helper
const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    // Use 'en-IN' for Indian Rupee formatting
    return `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`;
};

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<ApprovedInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Auth Check
    const investorSession = localStorage.getItem("investor_session");
    if (!investorSession) {
        toast.error("Please log in as an investor.");
        navigate("/investor-login");
        return;
    }

    // 2. Fetch all approved links for this investor
    // Since login is mock, we fetch *all* approved links.
    // In a real app, you'd filter by investor_id.
    const fetchApprovedInvestments = async () => {
        setIsLoading(true);
        const { data: linksData, error: linksError } = await supabase
            .from('farmer_investor_links')
            .select(`
                link_id,
                approved_at,
                status,
                farmers ( * ),
                investors ( * )
            `)
            .eq('status', 'approved'); // Only get approved investments

        if (linksError) {
            toast.error("Failed to fetch your investments.");
            console.error(linksError);
            setIsLoading(false);
            return;
        }

        if (!linksData) {
            setInvestments([]);
            setIsLoading(false);
            return;
        }

        // 3. For each link, fetch the farmer's cultivation data
        const investmentsWithCultivation: ApprovedInvestment[] = await Promise.all(
            linksData.map(async (link) => {
                const farmer = link.farmers as FarmerProfile | null;
                let cultivationData: CultivationData | null = null;

                if (farmer) {
                    const { data: cultData, error: cultError } = await supabase
                        .from('cultivation')
                        .select('planting_date, status')
                        .eq('farmer_id', farmer.id)
                        .order('planting_date', { ascending: true })
                        .limit(1)
                        .single();
                    
                    if (!cultError) {
                        cultivationData = cultData;
                    }
                }
                
                return {
                    ...link,
                    farmers: farmer,
                    investors: link.investors as InvestorData | null,
                    cultivation: cultivationData,
                    status: 'approved' // Ensure correct type
                };
            })
        );
        
        setInvestments(investmentsWithCultivation.filter(inv => inv.farmers && inv.investors));
        setIsLoading(false);
    };

    fetchApprovedInvestments();

  }, [navigate]);

  const handleLogout = () => {
      localStorage.removeItem("investor_session");
      navigate("/investor-login");
  };

  // --- Calculation Functions ---
  const getCalculations = (farmer: FarmerProfile, investor: InvestorData, cultivation: CultivationData | null) => {
      const landSize = farmer.land_size || 0;
      const stake = investor.offer_percent || 0;
      
      const currentMarketValue = landSize * 150000;
      const projectedMarketValue = landSize * 400000;
      
      const yourStakeValue = (currentMarketValue * stake) / 100;
      const yourProjectedValue = (projectedMarketValue * stake) / 100;
      const yourProfit = yourProjectedValue - (investor.amount || 0);

      let daysToHarvest: number | null = null;
      if (cultivation?.status === 'Gestation' && cultivation?.planting_date) {
            const plantDate = new Date(cultivation.planting_date);
            const gestationPeriodDays = 3.5 * 365.25; // ~1278 days
            const firstHarvestDate = new Date(plantDate.getTime() + gestationPeriodDays * 24 * 60 * 60 * 1000);
            const timeToHarvest = firstHarvestDate.getTime() - new Date().getTime();
            daysToHarvest = Math.max(0, Math.ceil(timeToHarvest / (1000 * 60 * 60 * 24)));
      }
      
      return { currentMarketValue, projectedMarketValue, yourStakeValue, yourProjectedValue, yourProfit, daysToHarvest, status: cultivation?.status || 'N/A' };
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-4">
                 <Building className="w-8 h-8 text-primary" />
                 <div>
                     <h1 className="text-2xl sm:text-3xl font-bold">My Investments</h1>
                     <p className="text-muted-foreground text-sm sm:text-base">Track your active farmer partnerships</p>
                 </div>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/investor-marketplace")}>
                    <Store className="w-4 h-4 mr-2" /> Browse Marketplace
                </Button>
                <Button variant="ghost" onClick={handleLogout}>Logout <LogOut className="w-4 h-4 ml-2"/></Button>
             </div>
          </div>
          
          {/* Investment List */}
          <div className="space-y-4">
             {isLoading ? (
                 <Card className="p-10 flex justify-center items-center rounded-xl"> <Loader2 className="w-8 h-8 animate-spin text-primary" /> </Card>
             ) : investments.length === 0 ? (
                 <Card className="p-10 text-center text-muted-foreground rounded-xl"> 
                    You have no active investments. Visit the marketplace to find farmers.
                 </Card>
             ) : (
                investments.map((inv) => {
                  if (!inv.farmers || !inv.investors) return null;
                  
                  const farmer = inv.farmers;
                  const investor = inv.investors;
                  const calcs = getCalculations(farmer, investor, inv.cultivation);
                  
                  return (
                      <Card key={inv.link_id} className="p-4 sm:p-6 shadow-soft rounded-2xl border-l-4 border-success">
                        <div className="space-y-4">
                            {/* Farmer Info */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <Avatar className="w-12 h-12 text-lg">
                                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                            {farmer.name?.charAt(0).toUpperCase() || <User />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-base sm:text-lg">{farmer.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span>{farmer.district || "Unknown Location"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-success px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-success/10 self-start">
                                    <CheckCircle className="w-3 h-3" />
                                    Approved
                                </div>
                            </div>

                            {/* Investment Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 sm:py-4 border-t border-b text-center sm:text-left">
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Investment</p>
                                    <p className="font-bold text-sm sm:text-lg text-accent">{formatCurrency(investor.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Stake</p>
                                    <p className="font-bold text-sm sm:text-lg text-primary">{investor.offer_percent.toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your Land Share</p>
                                    <p className="font-bold text-sm sm:text-lg text-success">{(farmer.land_size * (investor.offer_percent / 100)).toFixed(2)} acres</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Farm Status</p>
                                    <p className="font-bold text-sm sm:text-lg">{calcs.status}</p>
                                </div>
                            </div>
                            
                            {/* Financials Card */}
                            <Card className="p-4 bg-muted/50 shadow-inner">
                                <h4 className="font-semibold mb-3 text-center">Your Stake Financials</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                    <div className="text-center sm:text-left">
                                        <p className="text-xs text-muted-foreground">Current Value</p>
                                        <p className="font-bold text-base text-primary">{formatCurrency(calcs.yourStakeValue)}</p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-xs text-muted-foreground">Est. 5-Yr Value</p>
                                        <p className="font-bold text-base text-success">{formatCurrency(calcs.yourProjectedValue)}</p>
                                    </div>
                                    <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                                        <p className="text-xs text-muted-foreground">Est. 5-Yr Profit</p>
                                        <p className="font-bold text-base text-success">{formatCurrency(calcs.yourProfit)}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Harvest Countdown */}
                            {calcs.daysToHarvest !== null && calcs.daysToHarvest > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 border-blue-200 border rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-blue-800">~{calcs.daysToHarvest} days remaining</p>
                                        <p className="text-xs text-blue-700">until this farm's first harvest</p>
                                    </div>
                                </div>
                            )}

                        </div>
                      </Card>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;