// src/pages/Dashboard.tsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, BookOpen, DollarSign, MessageCircle, TrendingUp, Award,
  MapPin, Sprout, CheckCircle2, User, Loader2, LogOut, CalendarDays, Eye, BarChart,
  Shield // <-- Added Shield icon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label"; 

// --- MODIFIED MODULES ARRAY ---
// (Restored original 6 modules + added your 2 new ones)
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
  // --- NEW MODULE ---
  {
    id: "insurance", icon: Shield, label: "Protect Harvest", description: "Insurance Plans",
    path: "/protect-harvest", iconBgColor: "bg-[#673AB7]/20", iconColor: "text-[#673AB7]",
  },
  // --- NEW MODULE ---
  {
    id: "subsidies", icon: Award, label: "Govt. Schemes", description: "Subsidies & Benefits",
    path: "/govt-schemes", iconBgColor: "bg-[#795548]/20", iconColor: "text-[#795548]",
  },
];
// ---------------------------------

interface LinkedInvestor {
  investors: {
    offer_percent: number;
    amount: number;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading, logout } = useAuth();
  
  const [stats, setStats] = useState({
      totalLand: 0,
      totalStakeAllocated: 0,
      totalMoneyReceived: 0,
      totalLandAllocated: 0,
      remainingLand: 0,
      availableStake: 0,
      currentMarketValue: 0,
      predictedMarketValue: 0,
      experienceYears: null as number | null, 
      cultivationStatus: null as string | null,
      daysToHarvest: null as number | null, 
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [isSeeking, setIsSeeking] = useState(false);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setLoadingStats(true);
      const totalLand = profile.land_size || 0;
      
      const getInvestorStats = supabase
        .from('farmer_investor_links')
        .select(`investors ( offer_percent, amount )`)
        .eq('farmer_id', profile.id)
        .eq('status', 'approved'); 

      const getCultivationData = supabase
        .from('cultivation')
        .select('planting_date, status')
        .eq('farmer_id', profile.id)
        .order('planting_date', { ascending: true }) 
        .limit(1)
        .single();
        
      const getSeekingStatus = supabase
        .from('farmers')
        .select('is_seeking_investment')
        .eq('id', profile.id)
        .single();
        
      const getCurrentValue = () => totalLand * 150000;
      const getFutureValue = () => totalLand * 400000;
      
      Promise.all([getInvestorStats, getCultivationData, getSeekingStatus])
        .then(([investorResult, cultivationResult, seekingResult]) => {
          
          let investorStats = { 
              totalStakeAllocated: 0,
              totalMoneyReceived: 0,
              totalLandAllocated: 0,
              remainingLand: totalLand,
              availableStake: 100,
          };
          if (!investorResult.error && investorResult.data) {
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
          } else if (investorResult.error) {
              toast.error("Could not load investor stats.");
              console.error("Error fetching links:", investorResult.error);
          }

          let cultivationStats = {
              experienceYears: null as number | null,
              cultivationStatus: null as string | null,
              daysToHarvest: null as number | null, 
          };
          if (!cultivationResult.error && cultivationResult.data) {
              const plantDate = new Date(cultivationResult.data.planting_date);
              const today = new Date();
              const diffTime = today.getTime() - plantDate.getTime();
              const diffYears = parseFloat((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
              
              const status = cultivationResult.data.status || "Gestation";
              let daysToHarvest: number | null = null;

              if (status === 'Gestation' && cultivationResult.data.planting_date) {
                  const gestationPeriodDays = 3.5 * 365.25; // ~1278 days
                  const firstHarvestDate = new Date(plantDate.getTime() + gestationPeriodDays * 24 * 60 * 60 * 1000);
                  const timeToHarvest = firstHarvestDate.getTime() - today.getTime();
                  daysToHarvest = Math.max(0, Math.ceil(timeToHarvest / (1000 * 60 * 60 * 24)));
              }

              cultivationStats = {
                  experienceYears: diffYears > 0 ? diffYears : 0,
                  cultivationStatus: status,
                  daysToHarvest: daysToHarvest, 
              };
          } else if (cultivationResult.error && cultivationResult.error.code !== 'PGRST116') {
              toast.error("Could not load cultivation data.");
              console.error("Error fetching cultivation:", cultivationResult.error);
          }
          
          if (!seekingResult.error && seekingResult.data) {
              setIsSeeking(seekingResult.data.is_seeking_investment);
          }

          const marketStats = {
              currentMarketValue: getCurrentValue(),
              predictedMarketValue: getFutureValue(),
          };

          setStats({
              totalLand: totalLand,
              ...investorStats,
              ...cultivationStats, 
              ...marketStats,
          });
          
          setLoadingStats(false);
        });
    }
  }, [profile]);

  const handleLogout = async () => {
    toast.info("Logging out...");
    await logout();
    navigate('/');
  };

  const handleSeekingToggle = async (checked: boolean) => {
      if (!profile) return;
      
      setIsToggleLoading(true);
      const { error } = await supabase
        .from('farmers')
        .update({ is_seeking_investment: checked })
        .eq('id', profile.id);
        
      if (error) {
          toast.error("Failed to update status. Please try again.");
          setIsSeeking(!checked); // Revert UI
      } else {
          toast.success(checked ? "Your profile is now visible to investors!" : "Your profile is now hidden from investors.");
          setIsSeeking(checked);
      }
      setIsToggleLoading(false);
  };

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
    return `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      {/* --- Farmer Stats Card (Green Banner) --- */}
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
                <div className="flex justify-center items-center h-[216px]">
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
                  
                  {/* Harvest Status Card */}
                  <Card className="bg-white/10 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1"><CalendarDays className="w-4 h-4 opacity-80" /><p className="text-xs opacity-80 font-medium">Harvest Status</p></div>
                    
                    {stats.cultivationStatus === 'Gestation' && stats.daysToHarvest !== null && stats.daysToHarvest > 0 ? (
                        <>
                            <p className="text-xl sm:text-2xl font-bold leading-tight">
                                ~{stats.daysToHarvest} days
                            </p>
                            <p className="text-xs opacity-80 leading-tight">
                                until first harvest
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-xl sm:text-2xl font-bold leading-tight">
                                {stats.cultivationStatus || 'N/A'}
                            </p>
                            <p className="text-xs opacity-80 leading-tight">
                                {stats.cultivationStatus === 'Mature' ? 'Ready for harvest' : (stats.cultivationStatus ? 'Status' : 'No planting date')}
                            </p>
                        </>
                    )}
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

      {/* --- Module Grid & Toggle --- */}
      <div className="container mx-auto max-w-4xl mt-6 px-4 sm:px-0">
         {/* --- Toggle Switch --- */}
         <Card className="p-4 sm:p-6 shadow-medium bg-card mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl">
             <div className="flex items-center gap-3">
                 <Eye className="w-6 h-6 text-primary" />
                 <div>
                     <Label htmlFor="seeking-toggle" className="text-base font-semibold">Seek Investment</Label>
                     <p className="text-sm text-muted-foreground">Make your profile visible to investors in the Farmer Marketplace.</p>
                 </div>
             </div>
             <Switch
                id="seeking-toggle"
                checked={isSeeking}
                onCheckedChange={handleSeekingToggle}
                disabled={isToggleLoading}
             />
         </Card>
         
        {/* --- Module Grid --- */}
        {/* This 8-item grid will now wrap correctly (4 rows of 2) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="p-4 sm:p-6 text-center flex flex-col items-center justify-start group cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow duration-200 bg-card rounded-2xl"
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