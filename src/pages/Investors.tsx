// Replace this file: src/pages/Investors.tsx

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
  Handshake,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext"; // <-- Import useAuth
import { FarmerProfile } from "@/context/AuthContext"; // <-- Import FarmerProfile type

// Interface for available investor offers (matches 'investors' table)
interface InvestorOffer {
  investor_id: string;
  investor_name: string;
  location: string | null;
  amount: number | null;
  offer_percent: number;
  duration: string | null;
  is_available: boolean;
  created_at?: string;
}

// Interface for linked investors (post-approval, joined data)
interface LinkedInvestor extends InvestorOffer {
    link_id: string; // from farmer_investor_links table
    approved_at: string;
    status: string; // from farmer_investor_links table
}


const Investors = () => {
  const navigate = useNavigate();
  // Get profile and loading status from AuthContext
  const { profile, loading: authLoading } = useAuth(); 
  
  const [availableOffers, setAvailableOffers] = useState<InvestorOffer[]>([]);
  const [linkedInvestors, setLinkedInvestors] = useState<LinkedInvestor[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Farmer's total land from profile
  const farmerTotalLand = profile?.land_size || 0;

  useEffect(() => {
    // Only run if auth is done and profile is available
    if (!authLoading && profile) {
      const currentFarmerId = profile.id;
      
      // Fetch Available Offers
      const fetchAvailableOffers = async () => {
        setIsLoadingOffers(true);
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching available offers:", error);
          toast.error("Failed to load available investor offers.");
          setAvailableOffers([]);
        } else {
          setAvailableOffers(data || []);
        }
        setIsLoadingOffers(false);
      };

      // Fetch Linked Investors
      const fetchLinkedInvestors = async () => {
         setIsLoadingLinks(true);
         const { data: linksData, error: linksError } = await supabase
            .from('farmer_investor_links')
            .select(` link_id, approved_at, status, investors ( * ) `) // Join with investors table
            .eq('farmer_id', currentFarmerId); // Filter by current farmer

         if (linksError) {
             console.error("Error fetching linked investors:", linksError);
             toast.error("Failed to load your approved investors.");
             setLinkedInvestors([]);
         } else {
             // Flatten the data: combine link details with investor details
             const formattedLinks = linksData
                 ?.map(link => {
                     // Ensure the joined 'investors' data is not null
                     if (!link.investors) return null;
                     return {
                         ...(link.investors as InvestorOffer), // Spread investor details
                         link_id: link.link_id,
                         approved_at: link.approved_at,
                         status: link.status,
                     };
                 })
                 .filter((inv): inv is LinkedInvestor => inv !== null) || []; // Filter out nulls and type guard
             setLinkedInvestors(formattedLinks.sort((a, b) => new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime())); // Sort by date
         }
         setIsLoadingLinks(false);
      };

      fetchAvailableOffers();
      fetchLinkedInvestors();
      
    } else if (!authLoading && !profile) {
        // This should be handled by ProfileRequiredRoute, but as a fallback
        toast.error("Profile not loaded. Redirecting...");
        navigate('/onboarding');
    }
  }, [authLoading, profile, navigate]); // Depend on auth context

  // Calculate current stake for validation
  const totalStakeAllocated = linkedInvestors.reduce((sum, inv) => sum + inv.offer_percent, 0);
  const availableStake = Math.max(0, 100 - totalStakeAllocated);

  // Handle Farmer Approving an Offer
  const handleApprove = async (offer: InvestorOffer) => {
    if (!profile) { toast.error("Farmer profile not found."); return; }
    if (approvingId) return; // Prevent double clicks

    setApprovingId(offer.investor_id);

    try {
        // 1. Re-Check offer availability (atomic check)
        const { data: currentOffer, error: checkError } = await supabase
            .from('investors')
            .select('is_available, offer_percent') // Also get offer_percent for stake check
            .eq('investor_id', offer.investor_id)
            .single();

        if (checkError) throw new Error(`Offer check failed: ${checkError.message}`);
        if (!currentOffer) throw new Error("Offer not found.");
        if (!currentOffer.is_available) {
            toast.error("This offer is no longer available.");
            setAvailableOffers(prev => prev.filter(o => o.investor_id !== offer.investor_id)); // Refresh list
            return; // Stop processing
        }

        // 2. Check stake limit using current state + incoming offer
        if (totalStakeAllocated + currentOffer.offer_percent > 100) {
           toast.error("Cannot approve! This would exceed 100% stake allocation.", {
               description: `Available stake: ${availableStake.toFixed(1)}%`
           });
           return; // Stop processing
        }


        // 3. Create the link
        const { data: insertedLink, error: linkError } = await supabase
            .from('farmer_investor_links')
            .insert({ farmer_id: profile.id, investor_id: offer.investor_id })
            .select() // Select the newly inserted row
            .single();

        if (linkError) {
            if (linkError.code === '23505') { toast.warning("Already linked with this investor."); }
            else { throw linkError; } // Re-throw other DB errors
        } else if (insertedLink) {
            // 4. Mark offer unavailable
            const { error: updateError } = await supabase
                 .from('investors')
                 .update({ is_available: false })
                 .eq('investor_id', offer.investor_id);
             if (updateError) { console.warn("Failed to mark unavailable:", updateError.message); } // Log but don't fail

            toast.success(`Successfully linked with ${offer.investor_name}!`);

            // 5. Update UI State Optimistically
            const newlyLinkedInvestor: LinkedInvestor = {
                ...offer,
                is_available: false,
                link_id: insertedLink.link_id,
                approved_at: insertedLink.approved_at,
                status: insertedLink.status
            };
            setAvailableOffers(prev => prev.filter(o => o.investor_id !== offer.investor_id));
            setLinkedInvestors(prev => [newlyLinkedInvestor, ...prev].sort((a, b) => new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime()));
        }
    } catch (error: any) {
        console.error("Error approving investor:", error);
        toast.error(`Failed to link investor: ${error.message || 'Unknown error'}`);
    } finally {
        setApprovingId(null); // Clear loading state regardless of outcome
    }
  };


  // --- Helper Functions ---
  const calculateLandForStake = (stake: number) => {
    if (farmerTotalLand <= 0 || stake <= 0) return "0.00";
    return ((farmerTotalLand * stake) / 100).toFixed(2);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
  };

  // Main loader (waits for auth context)
  if (authLoading || !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
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
          
          {/* The green stats card is now on Dashboard.tsx */}

           {/* Info Card */}
            <Card className="p-4 sm:p-6 bg-gradient-accent text-accent-foreground shadow-medium flex items-start gap-3 sm:gap-4 rounded-2xl">
                <Info className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-0.5"/>
                 <div>
                     <h3 className="font-bold text-base sm:text-lg mb-1">🤝 Find Funding Partners</h3>
                     <p className="text-xs sm:text-sm text-accent-foreground/90">
                         Browse available investment offers below. Approving an offer links the investor to your farm. Your available stake (100% - allocated) must be high enough to accept an offer.
                     </p>
                 </div>
             </Card>

          {/* Available Investor Offers */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Available Investment Offers</h2>
            {isLoadingOffers ? (
                 <Card className="p-6 flex justify-center items-center rounded-xl"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
             ) : availableOffers.length === 0 ? (
                 <Card className="p-6 text-center text-muted-foreground rounded-xl"> No available offers matching your criteria currently. Check back later! </Card>
             ) : (
                availableOffers.map((offer) => (
                  <Card key={offer.investor_id} className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow rounded-xl">
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
                            <div className="text-blue-600 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-blue-100/70 self-start">
                                Available
                            </div>
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
                        disabled={approvingId === offer.investor_id || availableStake < offer.offer_percent}
                        title={availableStake < offer.offer_percent ? `Cannot accept: requires ${offer.offer_percent}% stake, only ${availableStake.toFixed(1)}% available` : "Accept this offer"}
                      >
                         {approvingId === offer.investor_id ? ( <Loader2 className="w-5 h-5 mr-2 animate-spin" /> ) : ( <Handshake className="w-5 h-5 mr-2" /> )}
                         {approvingId === offer.investor_id ? "Linking..." : "Accept Offer & Link"}
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>

          {/* Linked Investors Section */}
           <div className="space-y-4 pt-6 border-t">
               <h2 className="text-xl font-bold">Your Linked Investors</h2>
               {isLoadingLinks ? (
                   <Card className="p-6 flex justify-center items-center rounded-xl"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
               ) : linkedInvestors.length === 0 ? (
                   <Card className="p-6 text-center text-muted-foreground rounded-xl"> You haven't linked with any investors yet. Accept an offer above! </Card>
               ) : (
                   linkedInvestors.map((investor) => (
                       <Card key={investor.link_id} className="p-4 sm:p-6 shadow-soft bg-card border-l-4 border-success rounded-xl">
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