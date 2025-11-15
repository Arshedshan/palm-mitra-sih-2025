/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/Dashboard.tsx
*/
// src/pages/Dashboard.tsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, BookOpen, DollarSign, MessageCircle, TrendingUp, Award,
  MapPin, Sprout, CheckCircle2, User, Loader2, LogOut, CalendarDays, Eye, BarChart,
  Shield, Banknote, PlayCircle, StopCircle // <-- ADDED ICONS
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // <-- IMPORT DIALOG
import { Input } from "@/components/ui/input"; // <-- IMPORT INPUT
import { Checkbox } from "@/components/ui/checkbox"; // <-- IMPORT CHECKBOX

// --- MODULES ARRAY (no change from last time) ---
const modules = [
  {
    id: "community", icon: Users, label: "Community", description: "Feed & Progress", 
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
    id: "microfinance", icon: Banknote, label: "Micro Finance", description: "Loan Partners",
    path: "/micro-finance", iconBgColor: "bg-[#2196F3]/20", iconColor: "text-[#2196F3]",
  },
  {
    id: "insurance", icon: Shield, label: "Protect Harvest", description: "Insurance Plans",
    path: "/protect-harvest", iconBgColor: "bg-[#673AB7]/20", iconColor: "text-[#673AB7]",
  },
  {
    id: "subsidies", icon: Award, label: "Govt. Schemes", description: "Subsidies & Benefits",
    path: "/govt-schemes", iconBgColor: "bg-[#795548]/20", iconColor: "text-[#795548]",
  },
];
// ---------------------------------

// --- NEW CULTIVATION TYPE ---
interface CultivationRecord {
  id: string; // The row ID
  planting_date: string | null;
  status: string | null;
  harvest_date: string | null;
}

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
  });
  // --- NEW STATE ---
  const [activeCultivation, setActiveCultivation] = useState<CultivationRecord | null>(null);
  const [hasEverPlanted, setHasEverPlanted] = useState(false);
  const [daysToHarvest, setDaysToHarvest] = useState<number | null>(null);
  const [cultivationStatus, setCultivationStatus] = useState<string | null>(null);

  const [loadingStats, setLoadingStats] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  // --- NEW STATE FOR DIALOGS ---
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isSubmittingPlant, setIsSubmittingPlant] = useState(false);
  
  // --- NEW STATE FOR FORMS ---
  const [plantingDate, setPlantingDate] = useState("");
  const [isFirstPlantation, setIsFirstPlantation] = useState(false);
  const [harvestDate, setHarvestDate] = useState("");


  useEffect(() => {
    if (profile) {
      setLoadingStats(true);
      const totalLand = profile.land_size || 0;
      
      const getInvestorStats = supabase
        .from('farmer_investor_links')
        .select(`investors ( offer_percent, amount )`)
        .eq('farmer_id', profile.id)
        .eq('status', 'approved'); 

      // --- UPDATED: Fetch active cultivation ---
      const getActiveCultivation = supabase
        .from('cultivation')
        .select('*')
        .eq('farmer_id', profile.id)
        .eq('status', 'Gestation') // Only get active ones
        .order('planting_date', { ascending: false }) 
        .limit(1)
        .single();
      
      // --- NEW: Check if farmer has *ever* planted ---
      const getHasEverPlanted = supabase
        .from('cultivation')
        .select('id', { count: 'exact', head: true })
        .eq('farmer_id', profile.id);
        
      const getSeekingStatus = supabase
        .from('farmers')
        .select('is_seeking_investment')
        .eq('id', profile.id)
        .single();
        
      const getCurrentValue = () => totalLand * 150000;
      const getFutureValue = () => totalLand * 400000;
      
      Promise.all([
        getInvestorStats, 
        getActiveCultivation, 
        getSeekingStatus, 
        getHasEverPlanted
      ])
        .then(([investorResult, activeCultivationResult, seekingResult, hasPlantedResult]) => {
          
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
              console.error("Error fetching links:", investorResult.error);
          }

          // --- Process Cultivation Data ---
          if (!activeCultivationResult.error && activeCultivationResult.data) {
              const cultData = activeCultivationResult.data as CultivationRecord;
              setActiveCultivation(cultData); // Set the active record
              
              const status = cultData.status || "Gestation";
              setCultivationStatus(status);

              if (status === 'Gestation' && cultData.planting_date) {
                  const plantDate = new Date(cultData.planting_date);
                  const today = new Date();
                  const gestationPeriodDays = 3.5 * 365.25; 
                  const firstHarvestDate = new Date(plantDate.getTime() + gestationPeriodDays * 24 * 60 * 60 * 1000);
                  const timeToHarvest = firstHarvestDate.getTime() - today.getTime();
                  setDaysToHarvest(Math.max(0, Math.ceil(timeToHarvest / (1000 * 60 * 60 * 24))));
              }
          } else {
              // No active cultivation
              setActiveCultivation(null);
              setCultivationStatus(null);
              setDaysToHarvest(null);
          }
          
          if (!seekingResult.error && seekingResult.data) {
              setIsSeeking(seekingResult.data.is_seeking_investment);
          }

          if (!hasPlantedResult.error && hasPlantedResult.count !== null) {
              setHasEverPlanted(hasPlantedResult.count > 0);
          }

          const marketStats = {
              currentMarketValue: getCurrentValue(),
              predictedMarketValue: getFutureValue(),
          };

          setStats({
              totalLand: totalLand,
              ...investorStats,
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

  // --- NEW: Handle Start Plantation ---
  const handleStartPlantation = async () => {
    if (!profile) return;
    if (!plantingDate) {
      toast.error("Please select a planting date.");
      return;
    }
    
    setIsSubmittingPlant(true);
    const { data, error } = await supabase
      .from("cultivation")
      .insert({
        farmer_id: profile.id,
        planting_date: plantingDate,
        status: "Gestation",
        // 'is_first' isn't in your DB schema, but this is how you'd pass it
      })
      .select()
      .single();
      
    if (error) {
      toast.error("Failed to start plantation. Please try again.");
      console.error(error);
    } else {
      toast.success("Plantation started successfully!");
      setActiveCultivation(data as CultivationRecord); // Set new active record
      setHasEverPlanted(true); // Now they have planted
      setCultivationStatus("Gestation"); // Manually update status for UI
      
      // Manually calculate days to harvest for UI
      const plantDate = new Date(plantingDate);
      const today = new Date();
      const gestationPeriodDays = 3.5 * 365.25; 
      const firstHarvestDate = new Date(plantDate.getTime() + gestationPeriodDays * 24 * 60 * 60 * 1000);
      const timeToHarvest = firstHarvestDate.getTime() - today.getTime();
      setDaysToHarvest(Math.max(0, Math.ceil(timeToHarvest / (1000 * 60 * 60 * 24))));

      setIsStartDialogOpen(false); // Close modal
      setPlantingDate(""); // Reset form
      setIsFirstPlantation(false);
    }
    setIsSubmittingPlant(false);
  };

  // --- NEW: Handle End Plantation ---
  const handleEndPlantation = async () => {
    if (!profile || !activeCultivation) return;
    if (!harvestDate) {
      toast.error("Please select a harvest date.");
      return;
    }
    
    setIsSubmittingPlant(true);
    const { data, error } = await supabase
      .from("cultivation")
      .update({
        harvest_date: harvestDate,
        status: "Mature" // or "Harvested"
      })
      .eq('id', activeCultivation.id) // Update the specific active record
      .select()
      .single();
      
    if (error) {
      toast.error("Failed to end plantation. Please try again.");
      console.error(error);
    } else {
      toast.success("Plantation cycle marked as complete!");
      setActiveCultivation(null); // No longer an active "Gestation" record
      setCultivationStatus("Mature"); // Set status for UI
      setDaysToHarvest(null); // Clear days to harvest
      setIsEndDialogOpen(false); // Close modal
      setHarvestDate(""); // Reset form
    }
    setIsSubmittingPlant(false);
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
             <button 
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity rounded-md p-1 -ml-1"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="w-12 h-12 border-2 border-primary-foreground/50">
                <AvatarFallback className="bg-white/20 text-xl">
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1 className="text-xl font-bold leading-tight">Welcome, {farmerName}!</h1>
                <p className="text-lg font-semibold leading-tight -mt-0.5">{profile.district}</p>
              </div>
            </button>
            
            {/* --- NEW BUTTONS --- */}
            <div className="flex items-center gap-2">
              <Button 
                variant={activeCultivation ? "destructive" : "success"} 
                className="hidden sm:flex"
                onClick={() => activeCultivation ? setIsEndDialogOpen(true) : setIsStartDialogOpen(true)}
              >
                {activeCultivation ? (
                  <StopCircle className="w-5 h-5 mr-2" />
                ) : (
                  <PlayCircle className="w-5 h-5 mr-2" />
                )}
                {activeCultivation ? "End Plantation" : "Start Plantation"}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-white/20 rounded-full">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
            {/* -------------------- */}
          </div>
          {/* Verified Badge */}
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary-foreground flex-shrink-0" />
            <span>Verified Deforestation-Free Farm</span>
          </div>

          {/* --- NEW: Mobile Start/End Plantation Button --- */}
          <Button 
            variant={activeCultivation ? "destructive" : "success"} 
            className="flex sm:hidden w-full"
            onClick={() => activeCultivation ? setIsEndDialogOpen(true) : setIsStartDialogOpen(true)}
          >
            {activeCultivation ? (
              <StopCircle className="w-5 h-5 mr-2" />
            ) : (
              <PlayCircle className="w-5 h-5 mr-2" />
            )}
            {activeCultivation ? "End Plantation" : "Start Plantation"}
          </Button>
          {/* ------------------------------------------- */}


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
                    
                    {cultivationStatus === 'Gestation' && daysToHarvest !== null && daysToHarvest > 0 ? (
                        <>
                            <p className="text-xl sm:text-2xl font-bold leading-tight">
                                ~{daysToHarvest} days
                            </p>
                            <p className="text-xs opacity-80 leading-tight">
                                until first harvest
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-xl sm:text-2xl font-bold leading-tight">
                                {cultivationStatus || 'Not Started'}
                            </p>
                            <p className="text-xs opacity-80 leading-tight">
                                {cultivationStatus === 'Mature' ? 'Ready for harvest' : 'No active plantation'}
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
         {/* --- Toggle Switch (NOW DISABLED BASED ON STATE) --- */}
         <Card className="p-4 sm:p-6 shadow-medium bg-card mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl">
             <div className="flex items-center gap-3">
                 <Eye className={`w-6 h-6 ${hasEverPlanted ? 'text-primary' : 'text-muted-foreground'}`} />
                 <div>
                     <Label htmlFor="seeking-toggle" className={`text-base font-semibold ${!hasEverPlanted ? 'text-muted-foreground' : ''}`}>Seek Investment</Label>
                     <p className="text-sm text-muted-foreground">
                       {hasEverPlanted 
                         ? "Make your profile visible to investors in the Farmer Marketplace."
                         : "You must start your first plantation before you can seek investment."
                       }
                     </p>
                 </div>
             </div>
             <Switch
                id="seeking-toggle"
                checked={isSeeking && hasEverPlanted}
                onCheckedChange={handleSeekingToggle}
                disabled={isToggleLoading || !hasEverPlanted}
             />
         </Card>
         
        {/* --- Module Grid --- */}
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

      {/* --- NEW: Start Plantation Dialog --- */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Start a New Plantation</DialogTitle>
            <DialogDescription>
              Log the start of a new cultivation cycle. This will be visible to investors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planting-date">Planting Date</Label>
              <Input
                id="planting-date"
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-first" 
                checked={isFirstPlantation}
                onCheckedChange={(checked) => setIsFirstPlantation(checked === true)}
              />
              <label
                htmlFor="is-first"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Is this your first oil palm plantation?
              </label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmittingPlant}>Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleStartPlantation} disabled={isSubmittingPlant}>
              {isSubmittingPlant && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmittingPlant ? "Saving..." : "Start Plantation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- NEW: End Plantation Dialog --- */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">End Plantation Cycle</DialogTitle>
            <DialogDescription>
              Mark this cultivation cycle as complete and log the harvest date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="harvest-date">Harvest Date</Label>
              <Input
                id="harvest-date"
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="h-12"
              />
            </div>
            <Card className="p-3 bg-muted/50 text-sm text-muted-foreground">
              This will mark your 'Gestation' period as 'Mature' and allow you to start a new plantation log.
            </Card>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmittingPlant}>Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="destructive" onClick={handleEndPlantation} disabled={isSubmittingPlant}>
              {isSubmittingPlant && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmittingPlant ? "Saving..." : "End Plantation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Dashboard;