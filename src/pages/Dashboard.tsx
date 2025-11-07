// Replace this file: src/pages/Dashboard.tsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, BookOpen, DollarSign, MessageCircle, TrendingUp, Award,
  MapPin, Sprout, CheckCircle2, User, Loader2, LogOut, CalendarDays
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Define module structure with specific colors and bg colors for the icons
const modules = [
  {
    id: "community", icon: Users, label: "Community", description: "Success Stories",
    path: "/community", iconBgColor: "bg-[#4285F4]/20", iconColor: "text-[#4285F4]",
  },
  {
    id: "learn", icon: BookOpen, label: "Learn", description: "Tips & Videos",
    path: "/learn", iconBgColor: "bg-[#9C27B0]/20", iconColor: "text-[#9C27B0]",
  },
  {
    id: "money", icon: DollarSign, label: "Money", description: "Calculators & Finance",
    path: "/money", iconBgColor: "bg-[#4CAF50]/20", iconColor: "text-[#4CAF50]",
  },
  {
    id: "expert", icon: MessageCircle, label: "Ask Expert", description: "AI Assistant",
    path: "/chatbot", iconBgColor: "bg-[#FF9800]/20", iconColor: "text-[#FF9800]",
  },
  {
    id: "investors", icon: TrendingUp, label: "Find Investors", description: "Fractional Farming",
    path: "/investors", iconBgColor: "bg-[#E91E63]/20", iconColor: "text-[#E91E63]",
  },
  {
    id: "progress", icon: Award, label: "My Progress", description: "Track Growth",
    path: "/progress", iconBgColor: "bg-[#00BCD4]/20", iconColor: "text-[#00BCD4]",
  },
];

// Interface for Linked Investor data (simplified)
interface LinkedInvestor {
  investors: {
    offer_percent: number;
    amount: number;
  } | null; // Handle potential null join
}
// Interface for Cultivation data
interface Cultivation {
    planting_date: string;
    status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  // Get profile, auth loading status, and logout function from AuthContext
  const { profile, loading: authLoading, logout } = useAuth();
  
  // State for all farmer's stats
  const [stats, setStats] = useState({
      totalLand: 0,
      totalStakeAllocated: 0,
      totalMoneyReceived: 0,
      totalLandAllocated: 0,
      remainingLand: 0,
      availableStake: 0,
      currentMarketValue: 0,
      predictedMarketValue: 0,
      plantingDate: null as string | null,
      cultivationStatus: null as string | null,
      daysToHarvest: null as number | null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // --- Effect to Fetch All Farmer Stats ---
  useEffect(() => {
    // Only run if the profile is loaded
    if (profile) {
      setLoadingStats(true);
      const totalLand = profile.land_size || 0;

      // --- Create promises for all data fetching ---
      
      // 1. Fetch linked investor data
      const getInvestorStats = supabase
        .from('farmer_investor_links')
        .select(`investors ( offer_percent, amount )`)
        .eq('farmer_id', profile.id); // Use the farmer profile's primary key (id)

      // 2. Fetch cultivation data
      const getCultivationData = supabase
        .from('cultivation')
        .select('planting_date, status')
        .eq('farmer_id', profile.id)
        .order('planting_date', { ascending: false }) // Get the latest planting
        .limit(1)
        .single();
        
      // 3. Fetch Market Price Data (simulated)
      // This logic is from MarketPrice.tsx
      const getCurrentValue = () => totalLand * 150000; // Current value per acre
      const getFutureValue = () => totalLand * 400000; // Projected 5-year value
      
      // --- Run all promises concurrently ---
      Promise.all([getInvestorStats, getCultivationData])
        .then(([investorResult, cultivationResult]) => {
          
          let investorStats = {
              totalStakeAllocated: 0,
              totalMoneyReceived: 0,
              totalLandAllocated: 0,
              remainingLand: totalLand,
              availableStake: 100,
          };

          // Process investor data
          if (investorResult.error) {
             toast.error("Could not load investor stats.");
             console.error("Error fetching links:", investorResult.error);
          } else if (investorResult.data) {
              const typedData = investorResult.data as unknown as LinkedInvestor[];
              const totalStake = typedData.reduce((sum, link) => sum + (link.investors?.offer_percent || 0), 0);
              const totalMoney = typedData.reduce((sum, link) => sum + (link.investors?.amount || 0), 0);
              const landAllocated = Math.min(totalLand, (totalLand * totalStake) / 100);
              
              investorStats = {
                  totalStakeAllocated: totalStake,
                  totalMoneyReceived: totalMoney,
                  totalLandAllocated: landAllocated,
                  remainingLand: Math.max(0, totalLand - landAllocated),
                  availableStake: Math.max(0, 100 - totalStake),
              };
          }

          // Process cultivation data
          let cultivationStats = {
              plantingDate: null as string | null,
              cultivationStatus: null as string | null,
              daysToHarvest: null as number | null,
          };

          if (cultivationResult.error && cultivationResult.error.code !== 'PGRST116') { // Ignore "no rows" error
              toast.error("Could not load cultivation data.");
              console.error("Error fetching cultivation:", cultivationResult.error);
          } else if (cultivationResult.data) {
              const plantDate = new Date(cultivationResult.data.planting_date);
              // Calculate days until first harvest (approx 4 years)
              const harvestDate = new Date(plantDate.getFullYear() + 4, plantDate.getMonth(), plantDate.getDate());
              const today = new Date();
              const diffTime = harvestDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              cultivationStats = {
                  plantingDate: cultivationResult.data.planting_date,
                  cultivationStatus: cultivationResult.data.status || "Gestation",
                  daysToHarvest: diffDays > 0 ? diffDays : 0, // Show 0 if past due
              };
          }

          // Process market data
          const marketStats = {
              currentMarketValue: getCurrentValue(),
              predictedMarketValue: getFutureValue(),
          };

          // Combine all stats and set state
          setStats({
              totalLand: totalLand,
              ...investorStats,
              ...cultivationStats,
              ...marketStats,
          });
          
          setLoadingStats(false);
        });
    }
  }, [profile]); // Re-run whenever the profile loads

  const handleLogout = async () => {
    toast.info("Logging out...");
    await logout();
    navigate('/'); // Redirect to login page
  };

  // Show main loader
  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const farmerName = profile.name?.split(" ")[0] || "Farmer";
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    // Use compact notation for large numbers
    return `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      {/* --- New Farmer Stats Card --- */}
      <div className="bg-gradient-primary rounded-b-[24px] shadow-strong pt-6 pb-8 px-4 sm:px-6 relative z-10">
        <div className="container mx-auto max-w-4xl text-primary-foreground space-y-4">
          {/* Header Row with Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-primary-foreground/50">
                <AvatarFallback className="bg-white/20 text-xl">
                  <User className="w-6 h-6" />
                  {/* Or: {profile.name?.charAt(0).toUpperCase()} */}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold leading-tight">Welcome, {farmerName}!</h1>
                <p className="text-lg font-semibold leading-tight -mt-0.5">{profile.district}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-white/20 rounded-full">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Verified Badge */}
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary-foreground flex-shrink-0" />
            <span>Verified Deforestation-Free Farm</span>
          </div>

          {/* Stats Grid */}
          <div className="pt-4">
            {loadingStats ? (
                <div className="flex justify-center items-center h-[216px]"> {/* Match grid height */}
                    <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Total Land */}
                  <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><Sprout className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Total Land</p></div>
                    <p className="text-lg sm:text-2xl font-bold leading-tight">{stats.totalLand.toLocaleString("en-IN")} acres</p>
                  </Card>
                  
                  {/* Land Available */}
                   <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><Sprout className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Available Land</p></div>
                    <p className="text-lg sm:text-2xl font-bold leading-tight">{stats.remainingLand.toLocaleString("en-IN", {maximumFractionDigits: 2})} acres</p>
                    <p className="text-xs opacity-80 leading-tight">{stats.availableStake.toLocaleString("en-IN")}% stake left</p>
                  </Card>

                  {/* Land Allocated */}
                  <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Land Allocated</p></div>
                    <p className="text-lg sm:text-2xl font-bold leading-tight">{stats.totalLandAllocated.toLocaleString("en-IN", {maximumFractionDigits: 2})} acres</p>
                    <p className="text-xs opacity-80 leading-tight">{stats.totalStakeAllocated.toLocaleString("en-IN")}% stake</p>
                  </Card>
                  
                  {/* Money Received */}
                  <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Funds Received</p></div>
                    <p className="text-lg sm:text-2xl font-bold leading-tight">{formatCurrency(stats.totalMoneyReceived)}</p>
                  </Card>
                  
                  {/* Cultivation Status */}
                  <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><CalendarDays className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Cultivation Status</p></div>
                    <p className="text-xl sm:text-2xl font-bold leading-tight">{stats.cultivationStatus || 'N/A'}</p>
                    <p className="text-xs opacity-80 leading-tight">
                        {stats.daysToHarvest !== null ? (stats.daysToHarvest > 0 ? `${stats.daysToHarvest} days to harvest` : "Ready to harvest!") : "No planting date set"}
                    </p>
                  </Card>

                  {/* Market Value */}
                  <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Market Value</p></div>
                    <p className="text-lg sm:text-xl font-bold leading-tight">{formatCurrency(stats.currentMarketValue)} <span className="text-xs opacity-80 font-medium">(Current)</span></p>
                    <p className="text-lg sm:text-xl font-bold leading-tight text-success">{formatCurrency(stats.predictedMarketValue)} <span className="text-xs opacity-80 font-medium">(5-Yr Est.)</span></p>
                  </Card>

                </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Existing 6-Icon Module Grid --- */}
      <div className="container mx-auto max-w-4xl -mt-8 relative z-20 px-4 sm:px-0">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="p-4 sm:p-6 text-center flex flex-col items-center justify-start group cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow duration-200 bg-card"
              onClick={() => navigate(module.path)}
              tabIndex={0}
              onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(module.path)}
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${module.iconBgColor} group-hover:scale-105 transition-transform`}
              >
                <module.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${module.iconColor}`} />
              </div>
              <p className="font-bold text-base sm:text-lg leading-tight text-foreground">
                {module.label}
              </p>
              <p className="text-xs text-muted-foreground font-normal leading-tight mt-0.5">
                {module.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;