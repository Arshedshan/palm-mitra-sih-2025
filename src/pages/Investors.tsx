// src/pages/Investors.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar
import { ArrowLeft, User, MapPin, DollarSign, CheckCircle, XCircle, TrendingUp, Sprout, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct

// Interface matches the Supabase table structure
interface StakeholderRequest {
  id: number;
  farmer_id: string;
  investor_name: string;
  location: string | null;
  amount: number | null;
  offer_percent: number;
  duration: string | null;
  status: 'pending' | 'approved' | 'declined';
}

// Interface for the farmer's profile data needed on this page
interface FarmerProfile {
    name?: string;
    district?: string;
    landSize?: string | number; // Can be string from localStorage
    location?: { latitude: number; longitude: number; } | null;
    id?: string; // Supabase farmer ID
}

const Investors = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<StakeholderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile>({});
  const [farmerId, setFarmerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFarmerAndRequests = async () => {
      setIsLoading(true);
      // 1. Get farmer profile basics from localStorage
      const storedProfileString = localStorage.getItem("farmerProfile");
      const storedFarmerId = localStorage.getItem("farmerId");
      let currentFarmerId = storedFarmerId;
      let localProfile: FarmerProfile = {};
       if (storedProfileString) {
           try {
               localProfile = JSON.parse(storedProfileString);
               setFarmerProfile(localProfile); // Set local profile for immediate display
           } catch (e) { console.error("Failed to parse stored profile"); }
       } else {
           toast.error("Farmer profile not found. Please log in again.");
           navigate("/onboarding"); // Redirect if no profile
           return;
       }


      // 2. Get Farmer ID (Try localStorage first, then fetch)
      let currentFarmerId = localStorage.getItem("farmerId");

      if (!currentFarmerId && localProfile.name) { // Fetch if not in localStorage (use name as fallback - NOT ideal for production)
         console.warn("Fetching farmer ID by name - ensure name is unique or use a better identifier.");
         const { data: farmerData, error: farmerError } = await supabase
           .from('farmers')
           .select('id')
           .eq('name', localProfile.name)
           .single();
         if (farmerError || !farmerData) {
           console.error("Error fetching farmer ID:", farmerError?.message);
           toast.error("Could not verify your farm identity.");
           // Consider navigation back or disabling functionality
         } else {
           currentFarmerId = farmerData.id;
           localStorage.setItem("farmerId", currentFarmerId); // Store for next time
         }
       }

       if (!currentFarmerId) {
           toast.error("Could not load investor data. Farmer ID missing.");
           setIsLoading(false);
           return; // Stop if no farmer ID
       }
       setFarmerId(currentFarmerId); // Store farmerId in state

      // 3. Fetch requests for this farmer
      const { data, error } = await supabase
        .from('stakeholder_requests')
        .select('*')
        .eq('farmer_id', currentFarmerId)
        .order('id', { ascending: false }); // Show newest requests first

      if (offersError) {
        console.error("Error fetching available offers:", offersError);
        toast.error("Failed to load available investor offers.");
        setAvailableOffers([]);
      } else {
         // Data directly matches StakeholderRequest interface
         setRequests(data || []);
      }
      setIsLoading(false);
    };

    fetchFarmerAndRequests();
  }, [navigate]);

  // Calculations based on STATE variables now
  const approvedRequests = requests.filter(req => req.status === "approved");
  const totalStakeAllocated = approvedRequests.reduce((sum, req) => sum + req.offer_percent, 0);
  const totalMoneyReceived = approvedRequests.reduce((sum, req) => sum + (req.amount || 0), 0);
  const farmerTotalLand = parseFloat(String(farmerProfile?.landSize || 0)); // Safely parse landSize
  const totalLandAllocated = (farmerTotalLand * totalStakeAllocated) / 100;
  const remainingLand = Math.max(0, farmerTotalLand - totalLandAllocated); // Ensure non-negative
  const availableStake = Math.max(0, 100 - totalStakeAllocated); // Ensure non-negative

  const handleStatusUpdate = async (id: number, newStatus: 'approved' | 'declined') => {
    const originalRequests = [...requests]; // Store original state for revert
    const request = requests.find(req => req.id === id);

    // Check stake limit *before* optimistic update for approval
    if (newStatus === 'approved' && request && (totalStakeAllocated + request.offer_percent) > 100) {
      toast.error("Cannot approve! This would exceed 100% stake allocation.", {
         description: `Available stake: ${availableStake.toFixed(1)}%`
      });
      return;
    }

    // Optimistic UI Update
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    toast.info(`Request marked as ${newStatus}. Saving...`); // Give immediate feedback

    // Update Supabase
    const { error } = await supabase
      .from('stakeholder_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error(`Error ${newStatus === 'approved' ? 'approving' : 'declining'}:`, error);
      toast.error(`Failed to save ${newStatus} status. Reverting.`);
      // Revert UI on error
      setRequests(originalRequests);
    } else {
        toast.success(`Request successfully ${newStatus}!`); // Confirm success
    }
  };


  const calculateLandForStake = (stake: number) => {
    if (farmerTotalLand <= 0) return "0.00";
    // Calculate based on *remaining* land if needed, or total land as per agreement
    return ((farmerTotalLand * stake) / 100).toFixed(2);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading && !farmerProfile.name) { // Show loader only if profile isn't displayed yet
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl"> {/* Adjusted padding */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}> <ArrowLeft className="w-5 h-5" /> </Button>
             <div>
                 <h1 className="text-2xl sm:text-3xl font-bold">Investor Hub</h1>
                 <p className="text-muted-foreground text-sm sm:text-base">Find & connect with investors</p>
             </div>
          </div>

          {/* Farmer Profile Card */}
          <Card className="p-4 sm:p-6 bg-gradient-primary text-primary-foreground shadow-medium">
             <div className="flex items-center gap-3 sm:gap-4 mb-4">
                 <Avatar className="w-12 h-12 sm:w-16 sm:h-16 text-xl sm:text-2xl">
                     <AvatarFallback className="bg-white/20">
                         {farmerProfile.name?.charAt(0).toUpperCase() || '🧑‍🌾'}
                     </AvatarFallback>
                 </Avatar>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{farmerProfile.name || "Your Farm"}</h2>
                  <div className="flex items-center gap-2 text-xs sm:text-sm opacity-90 mt-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{farmerProfile.district || "Unknown Location"}</span>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4"> {/* Adjusted gap */}
               {/* Simplified Stat Cards */}
              {[
                  { icon: Sprout, label: "Total Land", value: `${farmerTotalLand.toFixed(1)} acres` },
                  { icon: TrendingUp, label: "Allocated", value: `${totalLandAllocated.toFixed(1)} acres`, subValue: `${totalStakeAllocated}% stake` },
                  { icon: DollarSign, label: "Funded", value: formatCurrency(totalMoneyReceived) },
                  { icon: Sprout, label: "Available", value: `${remainingLand.toFixed(1)} acres`, subValue: `${availableStake}% stake` },
              ].map(stat => (
                  <div key={stat.label} className="bg-white/10 rounded-lg p-3 sm:p-4 text-center sm:text-left">
                     <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 mb-1">
                          <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" />
                          <p className="text-[10px] sm:text-xs opacity-80">{stat.label}</p>
                      </div>
                      <p className="text-lg sm:text-xl font-bold leading-tight">{stat.value}</p>
                      {stat.subValue && <p className="text-[10px] sm:text-xs opacity-80 leading-tight">{stat.subValue}</p>}
                  </div>
              ))}
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-4 sm:p-6 bg-gradient-accent text-accent-foreground shadow-medium flex items-start gap-3 sm:gap-4">
              <Info className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1"/>
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-1">🤝 Fractional Farming Explained</h3>
                <p className="text-xs sm:text-sm text-accent-foreground/90">
                    Connect with investors to fund your farm during the gestation period. Review their offers below and approve or decline them. You remain the owner and manager of your land.
                </p>
              </div>
          </Card>

          {/* Available Investor Offers */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pending Investment Requests</h2>
             {isLoading ? (
                  <Card className="p-6 flex justify-center items-center"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
              ) : pendingRequests.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground"> No new investment requests. </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow">
                    {/* ... Request Details (similar structure as before, using request.* fields) ... */}
                     <div className="space-y-4">
                          <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 sm:gap-4">
                                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 text-lg">
                                       <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                           {request.investor_name?.charAt(0).toUpperCase() || '?'}
                                       </AvatarFallback>
                                   </Avatar>
                                  <div>
                                      <h3 className="font-bold text-base sm:text-lg">{request.investor_name || "Investor"}</h3>
                                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                          <span>{request.location || "Unknown"}</span>
                                      </div>
                                  </div>
                              </div>
                              {/* Status Badge can be added here if needed later */}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 py-3 sm:py-4 border-t border-b text-center sm:text-left">
                              <div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Investment</p>
                                  <p className="font-bold text-sm sm:text-lg text-accent">{formatCurrency(request.amount)}</p>
                              </div>
                              <div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stake Offered</p>
                                  <p className="font-bold text-sm sm:text-lg text-primary">{request.offer_percent}%</p>
                              </div>
                              <div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Land Allocation</p>
                                  <p className="font-bold text-sm sm:text-lg text-success">{calculateLandForStake(request.offer_percent)} acres</p>
                              </div>
                              <div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Duration</p>
                                  <p className="font-bold text-sm sm:text-lg">{request.duration || 'N/A'}</p>
                              </div>
                          </div>

                         {/* Action Buttons for Pending */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              <Button
                                  variant="success"
                                  className="flex-1"
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                              >
                                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Approve
                              </Button>
                              <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleStatusUpdate(request.id, 'declined')}
                              >
                                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Decline
                              </Button>
                          </div>

                      </div>
                  </Card>
                ))
            )}
          </div>

           {/* History (Optional - Approved/Declined) */}
           {otherRequests.length > 0 && (
             <div className="space-y-4 pt-4 border-t">
               <h2 className="text-lg font-semibold text-muted-foreground">Request History</h2>
                {otherRequests.map((request) => (
                  <Card key={request.id} className={`p-4 sm:p-6 shadow-soft opacity-80 ${request.status === 'approved' ? 'border-green-200' : 'border-red-200'}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                             <Avatar className="w-10 h-10 text-lg">
                                 <AvatarFallback> {request.investor_name?.charAt(0).toUpperCase() || '?'} </AvatarFallback>
                             </Avatar>
                             <div>
                                 <h3 className="font-semibold text-sm sm:text-base">{request.investor_name || "Investor"}</h3>
                                 <p className="text-xs text-muted-foreground">Offered {request.offer_percent}% for {formatCurrency(request.amount)}</p>
                             </div>
                        </div>
                        {request.status === "approved" && (
                          <div className="text-success px-2 py-1 rounded text-xs sm:text-sm font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Approved
                          </div>
                        )}
                        {request.status === "declined" && (
                          <div className="text-destructive px-2 py-1 rounded text-xs sm:text-sm font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Declined
                          </div>
                      </Card>
                   ))
               )}
           </div>

        </div>
      </div>
    </div>
  );
};

export default Investors;
