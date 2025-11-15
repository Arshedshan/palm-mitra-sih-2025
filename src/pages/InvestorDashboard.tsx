/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/InvestorDashboard.tsx
*/
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2, LogOut, User, BarChart, DollarSign, Sprout, MapPin, Search
} from "lucide-react";
import { useInvestorAuth } from "@/context/InvestorAuthContext"; 
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// --- Types ---
interface LinkedFarm {
  farmer_id: string; 
  name: string;
  district: string;
  land_size: number;
  amount: number;
  offer_percent: number;
}

const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`;
};

const InvestorDashboard = () => {
  const navigate = useNavigate(); 
  const { profile, loading: authLoading, logout } = useInvestorAuth();
  
  const [stats, setStats] = useState({
      totalInvested: 0,
      totalStake: 0,
      projectedReturn: 0,
      farmsLinked: 0,
  });
  const [linkedFarms, setLinkedFarms] = useState<LinkedFarm[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (authLoading) return; 
    if (!profile) {
      navigate('/investor-login');
      return;
    }
    
    setLoadingStats(true);
    
    const fetchDashboardData = async () => {
        try {
            const { data: links, error: linksError } = await supabase
                .from('farmer_investor_links')
                .select(`
                    status,
                    farmers ( id, name, district, land_size ),
                    investors ( amount, offer_percent )
                `)
                .eq('investors.user_id', profile.user_id) 
                .eq('status', 'approved');

            if (linksError) throw linksError;

            let totalInvested = 0;
            let totalStake = 0;
            const farms: LinkedFarm[] = [];

            if (links) {
                 links.forEach(link => {
                    const farm = link.farmers as any; 
                    const investment = link.investors as any; 

                    if (farm && investment) {
                        const investedAmount = investment.amount || 0;
                        const stake = investment.offer_percent || 0;

                        totalInvested += investedAmount;
                        totalStake += stake;
                        
                        farms.push({
                            farmer_id: farm.id,
                            name: farm.name,
                            district: farm.district,
                            land_size: farm.land_size,
                            amount: investedAmount,
                            offer_percent: stake
                        });
                    }
                });
            }
            
            const projectedReturn = totalInvested * 2.5; 

            setStats({
                totalInvested: totalInvested,
                totalStake: totalStake,
                projectedReturn: projectedReturn,
                farmsLinked: farms.length,
            });
            setLinkedFarms(farms);

        } catch (error: any) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data.", { description: error.message });
        } finally {
            setLoadingStats(false);
        }
    };
    
    fetchDashboardData();

  }, [profile, authLoading, navigate]);

  const handleLogout = async () => {
    toast.info("Logging out...");
    await logout();
    navigate('/investor-login');
  };

  if (authLoading || loadingStats || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const investorName = profile.name?.split(" ")[0] || "Investor";

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      {/* --- Investor Stats Card (Green Banner) --- */}
      <div className="bg-gradient-primary rounded-b-[24px] shadow-strong pt-6 pb-8 px-4 sm:px-6 relative z-10">
        <div className="container mx-auto max-w-4xl text-primary-foreground space-y-4">
          {/* Header Row with Logout */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-primary-foreground/50">
                <AvatarFallback className="bg-white/20 text-xl">
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold leading-tight">Welcome, {investorName}!</h1>
                <p className="text-lg font-semibold leading-tight -mt-0.5">Investor Dashboard</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-white/20 rounded-full">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Stats Grid */}
          <div className="pt-4 grid grid-cols-2 gap-3 sm:gap-4">
              <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Total Invested</p></div>
                <p className="text-lg sm:text-2xl font-bold leading-tight">{formatCurrency(stats.totalInvested)}</p>
              </Card>
              <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1"><BarChart className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Total Stake Acquired</p></div>
                <p className="text-lg sm:text-2xl font-bold leading-tight">{stats.totalStake.toFixed(2)}%</p>
              </Card>
              <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Projected 5-Yr Return</p></div>
                {/* --- THIS IS THE FIX --- */}
                <p className="text-lg sm:text-2xl font-bold leading-tight"> 
                  {formatCurrency(stats.projectedReturn)}
                </p>
                {/* --- END OF FIX --- */}
              </Card>
              <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1"><Sprout className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Farms Linked</p></div>
                <p className="text-lg sm:text-2xl font-bold leading-tight">{stats.farmsLinked}</p>
              </Card>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="container mx-auto max-w-4xl mt-6 px-4 sm:px-0">
         
         {/* --- Marketplace Button --- */}
         <Card 
            className="p-4 sm:p-6 shadow-medium bg-card mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/investor-marketplace")}
         >
             <div className="flex items-center gap-3">
                 <Search className="w-6 h-6 text-primary" />
                 <div>
                     <h2 className="text-base font-semibold">Browse Farmer Marketplace</h2>
                     <p className="text-sm text-muted-foreground">Find new deforestation-free farms to invest in.</p>
                 </div>
             </div>
             <Button>Find Farms</Button>
         </Card>
         
         {/* --- Approved Investments Section --- */}
         <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Your Approved Investments</h2>
            {linkedFarms.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground rounded-xl">
                   You have no approved investments yet.
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linkedFarms.map((farm) => (
                    <Card 
                      key={farm.farmer_id} 
                      className="p-4 space-y-3 shadow-soft rounded-xl cursor-pointer hover:shadow-medium transition-shadow"
                      onClick={() => navigate(`/farmer/${farm.farmer_id}`)}
                    >
                      <div className="flex items-center gap-3">
                         <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                              {farm.name?.charAt(0) || 'F'}
                            </AvatarFallback>
                         </Avatar>
                         <div>
                           <h3 className="font-bold">{farm.name}</h3>
                           <p className="text-xs text-muted-foreground flex items-center gap-1">
                             <MapPin className="w-3 h-3" /> {farm.district}
                           </p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">You Invested</p>
                            <p className="font-semibold">{formatCurrency(farm.amount)}</p>
                          </div>
                           <div>
                            <p className="text-xs text-muted-foreground">Your Stake</p>
                            <p className="font-semibold">{farm.offer_percent.toFixed(2)}%</p>
                          </div>
                      </div>
                    </Card>
                  ))}
                </div>
            )}
         </div>

      </div>
    </div>
  );
};

export default InvestorDashboard;