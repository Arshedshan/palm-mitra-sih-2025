// src/pages/Investors.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, MapPin, DollarSign, CheckCircle, TrendingUp, Sprout, Loader2, Info, Handshake } from "lucide-react"; // Added Handshake
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

// Interface for available investor offers
interface InvestorOffer {
  investor_id: string; // Changed from id to investor_id
  investor_name: string;
  location: string | null;
  amount: number | null;
  offer_percent: number;
  duration: string | null;
  is_available: boolean; // We'll fetch only available ones
}

// Interface for the farmer's profile data needed on this page
interface FarmerProfile {
    name?: string;
    district?: string;
    landSize?: string | number;
    id?: string; // Supabase farmer ID (UUID)
}

// Interface for linked investors (post-approval)
interface LinkedInvestor extends InvestorOffer {
    link_id: string; // from farmer_investor_links table
    approved_at: string;
    status: string;
}


const Investors = () => {
  const navigate = useNavigate();
  const [availableOffers, setAvailableOffers] = useState<InvestorOffer[]>([]);
  const [linkedInvestors, setLinkedInvestors] = useState<LinkedInvestor[]>([]); // State for approved investors
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true); // Separate loading for linked investors
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile>({});
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null); // Track which offer is being approved

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingOffers(true);
      setIsLoadingLinks(true); // Start both loaders

      // 1. Get Farmer Profile & ID (Crucial First Step)
      const storedProfileString = localStorage.getItem("farmerProfile");
      const storedFarmerId = localStorage.getItem("farmerId");
      let currentFarmerId = storedFarmerId;
      let localProfile: FarmerProfile = {};

      if (storedProfileString) {
          try { localProfile = JSON.parse(storedProfileString); } catch (e) { console.error("Bad profile format"); }
      }

      if (!currentFarmerId && localProfile.name) { // Fetch ID if missing
          console.warn("Fetching farmer ID by name - use a more reliable method in production.");
          const { data: farmerData, error: farmerError } = await supabase
              .from('farmers')
              .select('id')
              .eq('name', localProfile.name) // RISKY: Assumes unique name
              .single();
          if (!farmerError && farmerData) {
              currentFarmerId = farmerData.id;
              localStorage.setItem("farmerId", currentFarmerId);
          } else {
               console.error("Error fetching farmer ID:", farmerError?.message);
               toast.error("Could not verify your farm identity.");
               setIsLoadingOffers(false); setIsLoadingLinks(false);
               // navigate("/onboarding"); // Consider redirecting
               return; // Stop execution
          }
      } else if (!currentFarmerId) {
          toast.error("Farmer ID not found. Please log in again.");
          setIsLoadingOffers(false); setIsLoadingLinks(false);
          // navigate("/onboarding"); // Consider redirecting
          return; // Stop execution
      }

      setFarmerId(currentFarmerId);
      // Fetch full profile data if needed, or just use local + ID
      // For now, assume localProfile + ID is enough for display
      setFarmerProfile({ ...localProfile, id: currentFarmerId });


      // 2. Fetch Available Investor Offers (is_available = true)
      const { data: offersData, error: offersError } = await supabase
        .from('investors')
        .select('*')
        .eq('is_available', true) // Only fetch available offers
        .order('created_at', { ascending: false });

      if (offersError) {
        console.error("Error fetching available offers:", offersError);
        toast.error("Failed to load available investor offers.");
        setAvailableOffers([]);
      } else {
        setAvailableOffers(offersData || []);
      }
      setIsLoadingOffers(false);

      // 3. Fetch Already Linked Investors for this Farmer
       const { data: linksData, error: linksError } = await supabase
          .from('farmer_investor_links')
          .select(`
              link_id,
              approved_at,
              status,
              investors ( * )
          `) // Select link details and all columns from the related investor
          .eq('farmer_id', currentFarmerId); // Filter by the current farmer's ID

       if (linksError) {
           console.error("Error fetching linked investors:", linksError);
           toast.error("Failed to load your approved investors.");
           setLinkedInvestors([]);
       } else {
           // Flatten the data structure
           const formattedLinks = linksData?.map(link => ({
               ...(link.investors as InvestorOffer), // Spread investor details
               link_id: link.link_id,
               approved_at: link.approved_at,
               status: link.status,
           })) || [];
           setLinkedInvestors(formattedLinks);
       }
      setIsLoadingLinks(false);

    };

    fetchInitialData();
  }, [navigate]); // Added navigate dependency

  // Handle Farmer Approving an Offer
  const handleApprove = async (offer: InvestorOffer) => {
    if (!farmerId) {
      toast.error("Cannot approve: Your Farmer ID is missing.");
      return;
    }
    if (approvingId) return; // Prevent double clicks

    setApprovingId(offer.investor_id); // Set loading state for this specific button

    try {
        // 1. Check if offer is still available (important race condition check)
        const { data: currentOffer, error: checkError } = await supabase
            .from('investors')
            .select('is_available')
            .eq('investor_id', offer.investor_id)
            .single();

        if (checkError || !currentOffer) throw new Error("Could not verify offer availability.");
        if (!currentOffer.is_available) {
            toast.error("This offer is no longer available.");
            // Refresh available offers list
            setAvailableOffers(prev => prev.filter(o => o.investor_id !== offer.investor_id));
            setApprovingId(null);
            return;
        }

        // 2. Create the link in farmer_investor_links
        const { error: linkError } = await supabase
            .from('farmer_investor_links')
            .insert({
                farmer_id: farmerId,
                investor_id: offer.investor_id,
                // status: 'approved' // Default value in table definition
            });

        if (linkError) {
             // Handle potential unique constraint violation (farmer already linked to this investor)
             if (linkError.code === '23505') { // Postgres unique violation code
                 toast.warning("You have already connected with this investor.");
             } else {
                 throw linkError; // Throw other errors
             }
         } else {
             // 3. Mark the offer as unavailable (optional, depends on business logic)
             // If one offer can only be taken by one farmer:
             const { error: updateError } = await supabase
                 .from('investors')
                 .update({ is_available: false })
                 .eq('investor_id', offer.investor_id);

             if (updateError) {
                 console.warn("Failed to mark offer as unavailable:", updateError.message);
                 // Don't necessarily fail the whole operation, but log it.
             }

            toast.success(`Successfully linked with ${offer.investor_name}!`);

            // 4. Update UI State: Move offer from available to linked
            const newlyLinkedInvestor: LinkedInvestor = {
                ...offer,
                link_id: 'temp-' + Date.now(), // Placeholder ID until full refresh
                approved_at: new Date().toISOString(),
                status: 'approved'
            };
            setAvailableOffers(prev => prev.filter(o => o.investor_id !== offer.investor_id));
            setLinkedInvestors(prev => [newlyLinkedInvestor, ...prev]); // Add to top of linked list
        }

    } catch (error: any) {
        console.error("Error approving investor:", error);
        toast.error(`Failed to link investor: ${error.message}`);
    } finally {
        setApprovingId(null); // Clear loading state for button
    }
  };


  // --- Calculations --- (Based on LINKED investors now)
  const totalStakeAllocated = linkedInvestors.reduce((sum, inv) => sum + inv.offer_percent, 0);
  const totalMoneyReceived = linkedInvestors.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const farmerTotalLand = parseFloat(String(farmerProfile?.landSize || 0));
  const totalLandAllocated = (farmerTotalLand * totalStakeAllocated) / 100;
  const remainingLand = Math.max(0, farmerTotalLand - totalLandAllocated);
  const availableStake = Math.max(0, 100 - totalStakeAllocated);


  // --- Helper Functions ---
  const calculateLandForStake = (stake: number) => {
    if (farmerTotalLand <= 0) return "0.00";
    return ((farmerTotalLand * stake) / 100).toFixed(2);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Conditional Rendering for Loading
  const showOverallLoader = !farmerProfile.id && (isLoadingOffers || isLoadingLinks); // Show loader if farmer ID isn't even set yet

  if (showOverallLoader) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
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

          {/* Farmer Profile Card & Stats (Similar to previous version, uses farmerProfile state) */}
           <Card className="p-4 sm:p-6 bg-gradient-primary text-primary-foreground shadow-medium">
                 {/* ... (render farmer name, location, stats using farmerProfile, totalStakeAllocated etc.) ... */}
                 {/* Example Stats rendering */}
                 <div className="flex items-center gap-3 sm:gap-4 mb-4">
                     {/* Avatar etc */}
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                      {/* Stat Cards using calculated values */}
                 </div>
            </Card>

           {/* Info Card (Same as before) */}
            <Card className="p-4 sm:p-6 bg-gradient-accent text-accent-foreground shadow-medium flex items-start gap-3 sm:gap-4">
                <Info className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1"/>
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
                 <Card className="p-6 text-center text-muted-foreground"> No available offers matching your criteria currently. Check back later! </Card>
             ) : (
                availableOffers.map((offer) => (
                  <Card key={offer.investor_id} className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow">
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
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>{offer.location || "Location not specified"}</span>
                                    </div>
                                </div>
                            </div>
                           {/* Maybe a badge like "Available" */}
                        </div>
                      {/* Offer Details */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 py-3 sm:py-4 border-t border-b text-center sm:text-left">
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
                        disabled={approvingId === offer.investor_id} // Disable only the clicked button
                      >
                         {approvingId === offer.investor_id ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                         ) : (
                            <Handshake className="w-5 h-5 mr-2" /> // Use Handshake icon
                         )}
                         {approvingId === offer.investor_id ? "Linking..." : "Accept Offer & Link"}
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>

          {/* Linked Investors Section */}
           <div className="space-y-4 pt-4 border-t">
               <h2 className="text-xl font-bold">Your Linked Investors</h2>
               {isLoadingLinks ? (
                   <Card className="p-6 flex justify-center items-center"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
               ) : linkedInvestors.length === 0 ? (
                   <Card className="p-6 text-center text-muted-foreground"> You haven't linked with any investors yet. Accept an offer above! </Card>
               ) : (
                   linkedInvestors.map((investor) => (
                       <Card key={investor.link_id} className="p-4 sm:p-6 shadow-soft bg-gradient-subtle border-l-4 border-success"> {/* Style linked cards */}
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
                               {/* Optional: Add button to view details or manage link */}
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
