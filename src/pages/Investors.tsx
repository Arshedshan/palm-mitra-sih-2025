// src/pages/Investors.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  User,
  MapPin,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Sprout,
  Loader2,
  Info,
  Handshake, // Added Handshake icon
  XCircle, // Keep XCircle for linked section if needed later
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct

// Interface for available investor offers (matches 'investors' table)
interface InvestorOffer {
  investor_id: string;
  investor_name: string;
  location: string | null;
  amount: number | null;
  offer_percent: number;
  duration: string | null;
  is_available: boolean;
  created_at?: string; // Optional if needed
}

// Interface for the farmer's profile data needed on this page
interface FarmerProfile {
    name?: string;
    district?: string;
    landSize?: string | number; // Can be string from localStorage initially
    id?: string; // Supabase farmer ID (UUID)
    // Add avatar_url if you implement it later
    // avatar_url?: string | null;
}

// Interface for linked investors (post-approval, joined data)
interface LinkedInvestor extends InvestorOffer {
    link_id: string; // from farmer_investor_links table
    approved_at: string;
    status: string; // from farmer_investor_links table
}


const Investors = () => {
  const navigate = useNavigate();
  const [availableOffers, setAvailableOffers] = useState<InvestorOffer[]>([]);
  const [linkedInvestors, setLinkedInvestors] = useState<LinkedInvestor[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile>({});
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingOffers(true);
      setIsLoadingLinks(true);

      // 1. Get Farmer Profile & ID
      const storedProfileString = localStorage.getItem("farmerProfile");
      const storedFarmerId = localStorage.getItem("farmerId");
      let currentFarmerId = storedFarmerId;
      let localProfile: FarmerProfile = {};

      if (storedProfileString) {
          try { localProfile = JSON.parse(storedProfileString); } catch (e) { console.error("Bad profile format"); }
      }

      if (!currentFarmerId && localProfile.name) {
          console.warn("Fetching farmer ID by name - use a more reliable method in production.");
          const { data: farmerData, error: farmerError } = await supabase
              .from('farmers')
              .select('id, name, district, land_size') // Fetch more details
              .eq('name', localProfile.name)
              .single();
          if (!farmerError && farmerData) {
              currentFarmerId = farmerData.id;
              localStorage.setItem("farmerId", currentFarmerId);
              // Update profile state with fetched data if it's more complete
              localProfile = { ...localProfile, ...farmerData };
          } else {
               console.error("Error fetching farmer ID:", farmerError?.message);
               toast.error("Could not verify your farm identity.");
               setIsLoadingOffers(false); setIsLoadingLinks(false);
               navigate("/onboarding"); // Redirect if crucial ID fetch fails
               return;
          }
      } else if (!currentFarmerId) {
          toast.error("Farmer ID not found. Please log in again.");
          setIsLoadingOffers(false); setIsLoadingLinks(false);
          navigate("/onboarding"); // Redirect if ID is missing
          return;
      }
      // If we got here, we have a currentFarmerId
      setFarmerId(currentFarmerId);
      setFarmerProfile({ ...localProfile, id: currentFarmerId }); // Ensure ID is set


      // 2. Fetch Available Investor Offers
      const { data: offersData, error: offersError } = await supabase
        .from('investors')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (offersError) {
        console.error("Error fetching available offers:", offersError);
        toast.error("Failed to load available investor offers.");
        setAvailableOffers([]);
      } else {
        setAvailableOffers(offersData || []);
      }
      setIsLoadingOffers(false);

      // 3. Fetch Already Linked Investors
       const { data: linksData, error: linksError } = await supabase
          .from('farmer_investor_links')
          .select(` link_id, approved_at, status, investors ( * ) `)
          .eq('farmer_id', currentFarmerId);

       if (linksError) {
           console.error("Error fetching linked investors:", linksError);
           toast.error("Failed to load your approved investors.");
           setLinkedInvestors([]);
       } else {
           const formattedLinks = linksData?.map(link => ({
               ...(link.investors as InvestorOffer),
               link_id: link.link_id,
               approved_at: link.approved_at,
               status: link.status,
           })).filter(inv => inv.investor_id) || []; // Ensure investor data is not null
           setLinkedInvestors(formattedLinks);
       }
      setIsLoadingLinks(false);

    };

    fetchInitialData();
  }, [navigate]);

  // Handle Farmer Approving an Offer
  const handleApprove = async (offer: InvestorOffer) => {
    if (!farmerId) { toast.error("Farmer ID missing."); return; }
    if (approvingId) return;

    setApprovingId(offer.investor_id);

    try {
        // Check availability
        const { data: currentOffer, error: checkError } = await supabase
            .from('investors')
            .select('is_available')
            .eq('investor_id', offer.investor_id)
            .single();
        if (checkError || !currentOffer) throw new Error("Could not verify offer.");
        if (!currentOffer.is_available) {
            toast.error("Offer no longer available.");
            setAvailableOffers(prev => prev.filter(o => o.investor_id !== offer.investor_id)); // Remove stale offer
            return; // Stop processing
        }

        // Create link
        const { error: linkError } = await supabase
            .from('farmer_investor_links')
            .insert({ farmer_id: farmerId, investor_id: offer.investor_id });
        if (linkError) {
            if (linkError.code === '23505') { toast.warning("Already linked."); }
            else { throw linkError; }
        } else {
            // Mark offer unavailable
            const { error: updateError } = await supabase
                 .from('investors')
                 .update({ is_available: false })
                 .eq('investor_id', offer.investor_id);
             if (updateError) { console.warn("Failed to mark unavailable:", updateError.message); }

            toast.success(`Linked with ${offer.investor_name}!`);

            // Update UI State
            const newlyLinkedInvestor: LinkedInvestor = {
                ...offer, link_id: 'temp-' + Date.now(),
                approved_at: new Date().toISOString(), status: 'approved'
            };
            setAvailableOffers(prev => prev.filter(o => o.investor_id !== offer.investor_id));
            setLinkedInvestors(prev => [newlyLinkedInvestor, ...prev]);
        }
    } catch (error: any) {
        console.error("Error approving:", error);
        toast.error(`Failed to link: ${error.message}`);
    } finally {
        setApprovingId(null);
    }
  };


  // --- Calculations ---
  const totalStakeAllocated = linkedInvestors.reduce((sum, inv) => sum + inv.offer_percent, 0);
  const totalMoneyReceived = linkedInvestors.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const farmerTotalLand = parseFloat(String(farmerProfile?.landSize || 0)); // Safely parse landSize
  const totalLandAllocated = Math.min(farmerTotalLand, (farmerTotalLand * totalStakeAllocated) / 100); // Cap at total land
  const remainingLand = Math.max(0, farmerTotalLand - totalLandAllocated);
  const availableStake = Math.max(0, 100 - totalStakeAllocated);


  // --- Helper Functions ---
  const calculateLandForStake = (stake: number) => {
    if (farmerTotalLand <= 0) return "0.00";
    // Calculate based on *remaining* land if needed, or total land as per agreement
    return ((farmerTotalLand * stake) / 100).toFixed(2);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Overall loader
  const showOverallLoader = !farmerProfile.id && (isLoadingOffers || isLoadingLinks);
  if (showOverallLoader) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6"> {/* Added padding bottom */}
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}> <ArrowLeft className="w-5 h-5" /> </Button>
             <div>
                 <h1 className="text-2xl sm:text-3xl font-bold">Investor Hub</h1>
                 <p className="text-muted-foreground text-sm sm:text-base">Find & connect with investors</p>
             </div>
          </div>

          {/* Farmer Profile & Stats Card (Matches image_f51109.png) */}
          <Card className="p-4 sm:p-6 bg-gradient-primary text-primary-foreground shadow-medium rounded-2xl">
            {/* Farmer Info Row */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary-foreground/50">
                <AvatarFallback className="bg-white/20 text-xl">
                  {/* Display Initial or User Icon */}
                  {farmerProfile.name?.charAt(0).toUpperCase() || <User className="w-6 h-6"/> }
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{farmerProfile.name || "Your Farm"}</h2>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm opacity-90 mt-0.5">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{farmerProfile.district || "Unknown Location"}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Total Land */}
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Sprout className="w-3 h-3 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs opacity-80 font-medium">Total Land</p>
                </div>
                <p className="text-lg sm:text-2xl font-bold leading-tight">
                    {farmerTotalLand.toLocaleString("en-IN", { maximumFractionDigits: 1 })} acres
                 </p>
              </div>

              {/* Allocated */}
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs opacity-80 font-medium">Allocated</p>
                </div>
                 <p className="text-lg sm:text-2xl font-bold leading-tight">
                    {totalLandAllocated.toLocaleString("en-IN", { maximumFractionDigits: 2 })} acres
                 </p>
                <p className="text-[10px] sm:text-xs opacity-80 leading-tight">
                    {totalStakeAllocated.toLocaleString("en-IN", { maximumFractionDigits: 0 })}% stake
                </p>
              </div>

              {/* Money Received */}
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs opacity-80 font-medium">Money Received</p>
                </div>
                <p className="text-lg sm:text-2xl font-bold leading-tight">
                    {formatCurrency(totalMoneyReceived)}
                </p>
              </div>

              {/* Available */}
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Sprout className="w-3 h-3 sm:w-4 sm:h-4 opacity-80 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs opacity-80 font-medium">Available</p>
                </div>
                 <p className="text-lg sm:text-2xl font-bold leading-tight">
                     {remainingLand.toLocaleString("en-IN", { maximumFractionDigits: 2 })} acres
                 </p>
                <p className="text-[10px] sm:text-xs opacity-80 leading-tight">
                    {availableStake.toLocaleString("en-IN", { maximumFractionDigits: 0 })}% stake left
                </p>
              </div>
            </div>
          </Card>


           {/* Info Card */}
            <Card className="p-4 sm:p-6 bg-gradient-accent text-accent-foreground shadow-medium flex items-start gap-3 sm:gap-4 rounded-2xl">
                <Info className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-0.5"/>
                 <div>
                     <h3 className="font-bold text-base sm:text-lg mb-1">🤝 Find Funding Partners</h3>
                     <p className="text-xs sm:text-sm text-accent-foreground/90">
                         Browse available investment offers below. Approving an offer links the investor to your farm.
                     </p>
                 </div>
             </Card>

          {/* Available Investor Offers */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Available Investment Offers</h2>
            {isLoadingOffers ? (
                 <Card className="p-6 flex justify-center items-center"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
             ) : availableOffers.length === 0 ? (
                 <Card className="p-6 text-center text-muted-foreground rounded-xl"> No available offers matching your criteria currently. Check back later! </Card>
             ) : (
                availableOffers.map((offer) => (
                  <Card key={offer.investor_id} className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow rounded-xl"> {/* Added rounded-xl */}
                    <div className="space-y-4">
                      {/* Investor Info */}
                       <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 text-lg">
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                        {offer.investor_name?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-base sm:text-lg">{offer.investor_name || "Investor"}</h3>
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-0.5">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span>{offer.location || "Location not specified"}</span>
                                    </div>
                                </div>
                            </div>
                           {/* "Available" Badge could go here if needed */}
                        </div>
                      {/* Offer Details */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 sm:py-4 border-t border-b text-center sm:text-left">
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Investment</p>
                                <p className="font-bold text-sm sm:text-lg text-accent">{formatCurrency(offer.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stake Offered</p>
                                <p className="font-bold text-sm sm:text-lg text-primary">{offer.offer_percent}%</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Est. Land Share</p>
                                <p className="font-bold text-sm sm:text-lg text-success">{calculateLandForStake(offer.offer_percent)} acres</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Duration</p>
                                <p className="font-bold text-sm sm:text-lg">{offer.duration || 'N/A'}</p>
                            </div>
                        </div>

                      {/* Approve Button */}
                      <Button
                        variant="success"
                        className="w-full sm:w-auto"
                        onClick={() => handleApprove(offer)}
                        disabled={approvingId === offer.investor_id}
                      >
                         {approvingId === offer.investor_id ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                         ) : (
                            <Handshake className="w-5 h-5 mr-2" />
                         )}
                         {approvingId === offer.investor_id ? "Linking..." : "Accept Offer & Link"}
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>

          {/* Linked Investors Section */}
           <div className="space-y-4 pt-6 border-t"> {/* Added pt-6 */}
               <h2 className="text-xl font-bold">Your Linked Investors</h2>
               {isLoadingLinks ? (
                   <Card className="p-6 flex justify-center items-center rounded-xl"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
               ) : linkedInvestors.length === 0 ? (
                   <Card className="p-6 text-center text-muted-foreground rounded-xl"> You haven't linked with any investors yet. Accept an offer above! </Card>
               ) : (
                   linkedInvestors.map((investor) => (
                       <Card key={investor.link_id} className="p-4 sm:p-6 shadow-soft bg-card border-l-4 border-success rounded-xl"> {/* Added rounded-xl */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 sm:gap-4">
                                   <Avatar className="w-10 h-10 text-lg">
                                      <AvatarFallback className="bg-primary/80 text-primary-foreground">
                                          {investor.investor_name?.charAt(0).toUpperCase() || '?'}
                                      </AvatarFallback>
                                  </Avatar>
                                  <div>
                                       <h3 className="font-semibold text-base sm:text-lg">{investor.investor_name || "Investor"}</h3>
                                       <p className="text-xs text-muted-foreground">
                                           {investor.offer_percent}% stake for {formatCurrency(investor.amount)} ({investor.duration || 'N/A'})
                                       </p>
                                        <p className="text-xs text-muted-foreground">
                                            Linked on: {new Date(investor.approved_at).toLocaleDateString()}
                                       </p>
                                  </div>
                              </div>
                               <div className="text-success px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-success/10 self-start sm:self-center mt-2 sm:mt-0">
                                  <CheckCircle className="w-4 h-4" />
                                  Linked ({investor.status})
                              </div>
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
