/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/pages/FarmerPublicProfile.tsx
*/
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Loader2, MapPin, Sprout, ShieldCheck, User, BarChart, DollarSign,
  Info, Send, Handshake, XCircle,
  Phone, Home // <-- ADDED ICONS
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { FarmerProfile } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvestorAuth } from "@/context/InvestorAuthContext"; // <-- IMPORT NEW AUTH

// Define type for Cultivation data
interface CultivationRecord {
  id: string;
  planting_date: string | null;
  status: string | null;
  harvest_date: string | null;
  yield_amount_tonnes: number | null;
}

const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`;
};

const FarmerPublicProfile = () => {
  const navigate = useNavigate();
  const { farmerId } = useParams<{ farmerId: string }>(); 
  
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [cultivation, setCultivation] = useState<CultivationRecord[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [experience, setExperience] = useState<number>(0);

  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [farmMarketValue, setFarmMarketValue] = useState(0);
  const [projectedFarmValue, setProjectedFarmValue] = useState(0);
  const [calculatedOffer, setCalculatedOffer] = useState<{
    stake: number;
    land: number;
    projectedReturn: number;
    projectedProfit: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  // --- USE NEW AUTH ---
  const { profile: investorProfile, loading: investorAuthLoading } = useInvestorAuth();

  useEffect(() => {
    // Wait for auth to finish before checking for farmerId
    if (investorAuthLoading) {
        setIsLoading(true);
        return;
    }
    
    // We are now protected by the InvestorProtectedRoute, so no need for localStorage check
    
    if (!farmerId) {
      toast.error("No farmer specified.");
      navigate("/investor-marketplace");
      return;
    }

    const fetchFarmerDetails = async () => {
      setIsLoading(true);
      try {
        // --- Fetch includes new fields: phone, address, state ---
        const { data: farmerData, error: farmerError } = await supabase
          .from('farmers')
          .select('*') // <-- This already selects all columns
          .eq('id', farmerId)
          .eq('is_seeking_investment', true)
          .single();
          
        if (farmerError || !farmerData) {
          toast.error("Could not fetch farmer details or they are no longer seeking investment.");
          console.error(farmerError);
          navigate("/investor-marketplace");
          return;
        }
        
        setFarmer(farmerData as FarmerProfile);
        const landSize = farmerData.land_size || 0;
        const currentMarketValue = landSize * 150000; 
        const futureMarketValue = landSize * 400000;  
        setFarmMarketValue(currentMarketValue);
        setProjectedFarmValue(futureMarketValue);

        const { data: cultivationData, error: cultivationError } = await supabase
          .from('cultivation')
          .select('*')
          .eq('farmer_id', farmerId)
          .order('planting_date', { ascending: true });
          
        if (!cultivationError && cultivationData) {
          setCultivation(cultivationData || []);
          const earliestPlantDate = cultivationData[0]?.planting_date;
          if (earliestPlantDate) {
              const plantDate = new Date(earliestPlantDate);
              const today = new Date();
              const diffTime = today.getTime() - plantDate.getTime();
              const diffYears = parseFloat((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
              setExperience(diffYears > 0 ? diffYears : 0);
          }
        } else if (cultivationError) {
            console.warn("Could not fetch cultivation data:", cultivationError.message);
        }

        const { data: verificationData, error: verificationError } = await supabase
          .from('Green_Ledger')
          .select('status')
          .eq('farm_id', farmerId)
          .eq('status', 'Verified: Deforestation-Free')
          .limit(1)
          .single();
          
        if (!verificationError && verificationData) {
            setIsVerified(true);
        } else if (verificationError && verificationError.code !== 'PGRST116') {
             console.warn("Could not fetch verification data:", verificationError.message);
        }
        
      } catch (err: any) {
        console.error("An unexpected error occurred:", err);
        toast.error(`An unexpected error occurred: ${err.message}`);
        navigate("/investor-marketplace");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmerDetails();
    
  }, [farmerId, navigate, investorAuthLoading]); // <-- Add auth loading dependency
  
  
  const handleAmountChange = (value: string) => {
      const amount = parseFloat(value) || 0;
      setInvestmentAmount(value);

      if (amount <= 0 || farmMarketValue <= 0 || !farmer) {
          setCalculatedOffer(null);
          return;
      }

      const stakePercent = (amount / farmMarketValue) * 100;
      const landShare = (farmer.land_size * stakePercent) / 100;
      const projectedReturn = (projectedFarmValue * stakePercent) / 100;
      const projectedProfit = projectedReturn - amount;

      setCalculatedOffer({
          stake: stakePercent,
          land: landShare,
          projectedReturn: projectedReturn,
          projectedProfit: projectedProfit
      });
  };

  const handleSubmitOffer = async () => {
    // --- USE REAL INVESTOR DATA ---
    if (!calculatedOffer || !farmer || !investorProfile) {
        toast.error("Investor profile not found. Please log in again.");
        return;
    }
    
    setIsSubmitting(true);
    const amountNum = parseFloat(investmentAmount);

    try {
        // 1. Create a new record in the 'investors' table
        const { data: newInvestor, error: investorError } = await supabase
            .from('investors')
            .insert({
                user_id: investorProfile.user_id, // <-- Use real investor user ID
                investor_name: investorProfile.name, // <-- Use real investor name
                location: "Investor Location", // TODO: Add location to investor_profiles
                amount: amountNum,
                offer_percent: calculatedOffer.stake,
                is_available: false, 
                duration: "5 Years"
            })
            .select('investor_id')
            .single();

        if (investorError) throw investorError;

        // 2. Create the 'pending' link
        const { error: linkError } = await supabase
            .from('farmer_investor_links')
            .insert({
                farmer_id: farmer.id, 
                investor_id: newInvestor.investor_id,
                status: 'pending'
            });
        
        if (linkError) throw linkError;

        toast.success("Offer Sent!", {
            description: "The farmer has been notified and can now approve or reject your offer.",
        });

        setIsOfferDialogOpen(false);
        setInvestmentAmount("");
        setCalculatedOffer(null);

    } catch (error: any) {
        console.error("Error submitting offer:", error);
        toast.error("Failed to submit offer", { description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (isLoading || investorAuthLoading) { // <-- Check both loaders
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!farmer) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate("/investor-marketplace")}>
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div>
                 <h1 className="text-2xl sm:text-3xl font-bold">Farmer Profile</h1>
                 <p className="text-muted-foreground text-sm sm:text-base">Review farmer details and history</p>
             </div>
          </div>
          
          {/* Farmer Info Card */}
          <Card className="p-4 sm:p-6 shadow-medium rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                 <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl">
                        {farmer.name?.charAt(0).toUpperCase() || <User />}
                    </AvatarFallback>
                 </Avatar>
                 <div className="flex-1 space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold">{farmer.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> <span>{farmer.district}</span></div>
                        <div className="flex items-center gap-1.5"><Sprout className="w-4 h-4" /> <span>{farmer.land_size} acres total</span></div>
                        <div className="flex items-center gap-1.5"><BarChart className="w-4 h-4" /> <span>{experience} years experience</span></div>
                    </div>
                    {isVerified ? (
                       <div className="text-success px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 bg-success/10 w-fit">
                          <ShieldCheck className="w-5 h-5" />
                          Verified Deforestation-Free Farm
                      </div>
                    ) : (
                       <div className="text-destructive px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 bg-destructive/10 w-fit">
                          <Info className="w-5 h-5" />
                          Farm Not Verified
                      </div>
                    )}
                 </div>
                 
                 <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                    <DialogTrigger asChild>
                         <Button size="lg" className="w-full sm:w-auto">
                            <DollarSign className="w-5 h-5 mr-2"/>
                            Make Investment Offer
                         </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Make an Investment Offer</DialogTitle>
                          <DialogDescription>
                            Farm's current value is approx. {formatCurrency(farmMarketValue)}. 
                            Projected 5-yr value is {formatCurrency(projectedFarmValue)}.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-base">Investment Amount (₹)</Label>
                                <Input
                                  id="amount"
                                  type="number"
                                  placeholder="e.g., 50000"
                                  className="text-lg h-12"
                                  value={investmentAmount}
                                  onChange={(e) => handleAmountChange(e.target.value)}
                                />
                            </div>

                            {calculatedOffer && (
                               <Card className="p-4 bg-muted/50 shadow-inner animate-in fade-in duration-300">
                                   <h4 className="font-semibold mb-3 text-center">Your Offer Details</h4>
                                   <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="font-medium">Stake Percentage:</div>
                                      <div className="text-right font-bold text-primary">{calculatedOffer.stake.toFixed(2)}%</div>
                                      
                                      <div className="font-medium">Equivalent Land:</div>
                                      <div className="text-right font-bold">{calculatedOffer.land.toFixed(2)} acres</div>
                                      
                                      <div className="font-medium">Est. 5-Yr Return:</div>
                                      <div className="text-right font-bold text-success">{formatCurrency(calculatedOffer.projectedReturn)}</div>
                                      
                                      <div className="font-medium">Est. 5-Yr Profit:</div>
                                      <div className="text-right font-bold text-success">{formatCurrency(calculatedOffer.projectedProfit)}</div>
                                   </div>
                               </Card>
                            )}
                        </div>

                        <DialogFooter className="sm:justify-between gap-2">
                           <DialogClose asChild>
                             <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                           </DialogClose>
                           <Button 
                             type="button" 
                             variant="success"
                             disabled={!calculatedOffer || parseFloat(investmentAmount) <= 0 || isSubmitting}
                             onClick={handleSubmitOffer}
                           >
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2"/>}
                            {isSubmitting ? "Sending..." : "Submit Offer"}
                           </Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
              </div>

              {/* --- NEW: Farmer Details Section --- */}
              <hr className="my-6 border-border/50" />
              <div>
                  <h3 className="text-lg font-semibold mb-4">Farmer Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                      {/* Contact Number */}
                      <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                              <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                              <p className="font-semibold text-foreground">{farmer.phone || 'Not Provided'}</p>
                          </div>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                              <p className="text-sm font-medium text-muted-foreground">Location</p>
                              <p className="font-semibold text-foreground">{farmer.district}, {farmer.state || 'N/A'}</p>
                          </div>
                      </div>

                      {/* Full Address */}
                      <div className="flex items-start gap-3 sm:col-span-2">
                          <Home className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                              <p className="text-sm font-medium text-muted-foreground">Full Address</p>
                              <p className="font-semibold text-foreground">{farmer.address || 'Not Provided'}</p>
                          </div>
                      </div>
                  </div>
              </div>
              {/* --- END: Farmer Details Section --- */}

          </Card>
          
          {/* Harvest Records Card */}
           <Card className="p-4 sm:p-6 shadow-soft rounded-2xl">
               <h3 className="text-xl font-bold mb-4">Cultivation & Harvest Records</h3>
               {cultivation.length > 0 ? (
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Planting Date</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Harvest Date</TableHead>
                       <TableHead className="text-right">Yield (Tonnes)</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {cultivation.map((record) => (
                       <TableRow key={record.id}>
                         <TableCell>{record.planting_date ? new Date(record.planting_date).toLocaleDateString() : 'N/A'}</TableCell>
                         <TableCell>
                           <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                             record.status === 'Gestation' ? 'bg-yellow-100 text-yellow-800' : 
                             record.status === 'Mature' ? 'bg-green-100 text-green-800' : 
                             'bg-gray-100 text-gray-800'
                           }`}>
                             {record.status || 'N/A'}
                           </span>
                         </TableCell>
                         <TableCell>{record.harvest_date ? new Date(record.harvest_date).toLocaleDateString() : 'Pending'}</TableCell>
                         <TableCell className="text-right font-medium">{record.yield_amount_tonnes || 'N/A'}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               ) : (
                 <p className="text-muted-foreground">No cultivation records found for this farmer.</p>
               )}
           </Card>

        </div>
      </div>
    </div>
  );
};

export default FarmerPublicProfile;