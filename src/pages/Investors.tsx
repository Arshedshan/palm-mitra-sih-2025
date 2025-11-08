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
  Handshake,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext"; 

// Interface for investor data (from 'investors' table)
interface InvestorData {
  investor_id: string;
  investor_name: string;
  location: string | null;
  amount: number | null;
  offer_percent: number;
  duration: string | null;
  is_available: boolean;
  created_at?: string;
}

// Interface for the joined data (link + investor details)
interface CombinedOffer {
    link_id: string; // from farmer_investor_links table
    approved_at: string | null;
    status: 'pending' | 'approved' | 'rejected'; // from farmer_investor_links table
    investors: InvestorData | null; // The full investor record
}


const Investors = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth(); 
  
  const [pendingOffers, setPendingOffers] = useState<CombinedOffer[]>([]);
  const [linkedInvestors, setLinkedInvestors] = useState<CombinedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null); // For approve/reject loaders

  const farmerTotalLand = profile?.land_size || 0;

  useEffect(() => {
    if (!authLoading && profile) {
      const currentFarmerId = profile.id;
      
      const fetchAllOffers = async () => {
         setIsLoading(true);
         // Fetch all links (pending, approved, rejected) for this farmer
         const { data: linksData, error: linksError } = await supabase
            .from('farmer_investor_links')
            .select(` link_id, approved_at, status, investors ( * ) `) // Join with investors table
            .eq('farmer_id', currentFarmerId); // Filter by current farmer

         if (linksError) {
             console.error("Error fetching investor links:", linksError);
             toast.error("Failed to load your investor offers.");
         } else {
             const allOffers = linksData
                 ?.map(link => ({ ...link, investors: link.investors as InvestorData | null })) // Type cast
                 .filter(offer => offer.investors !== null) || []; // Ensure investor data exists
             
             // Filter into separate lists
             setPendingOffers(
                allOffers
                    .filter(o => o.status === 'pending')
                    .sort((a, b) => new Date(b.investors!.created_at!).getTime() - new Date(a.investors!.created_at!).getTime())
             );
             setLinkedInvestors(
                allOffers
                    .filter(o => o.status === 'approved')
                    .sort((a, b) => new Date(b.approved_at!).getTime() - new Date(a.approved_at!).getTime())
             );
         }
         setIsLoading(false);
      };

      fetchAllOffers();
      
    } else if (!authLoading && !profile) {
        toast.error("Profile not loaded. Redirecting...");
        navigate('/onboarding');
    }
  }, [authLoading, profile, navigate]); 

  // Calculate current stake
  const totalStakeAllocated = linkedInvestors.reduce((sum, inv) => sum + (inv.investors?.offer_percent || 0), 0);
  const availableStake = Math.max(0, 100 - totalStakeAllocated);

  // --- NEW: Handle Approve Offer ---
  const handleApprove = async (offer: CombinedOffer) => {
    if (!profile || !offer.investors) { toast.error("Farmer profile not found."); return; }
    if (actionLoadingId) return; 

    setActionLoadingId(offer.link_id);

    // Check if farmer has enough stake
    const offerStake = offer.investors.offer_percent;
    if (availableStake < offerStake) {
         toast.error("Cannot approve! This would exceed 100% stake allocation.", {
           description: `You only have ${availableStake.toFixed(1)}% stake available.`
         });
         setActionLoadingId(null);
         return;
    }

    try {
        // 1. Update the link status to 'approved'
        const { data: updatedLink, error: linkError } = await supabase
            .from('farmer_investor_links')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('link_id', offer.link_id)
            .select()
            .single();

        if (linkError) throw linkError;

        // 2. Mark the original investor offer as unavailable (so it can't be reused)
        // This was part of your original logic and is good practice.
        await supabase
             .from('investors')
             .update({ is_available: false })
             .eq('investor_id', offer.investors.investor_id);
             
        toast.success(`Successfully linked with ${offer.investors.investor_name}!`);

        // 3. Update UI State
        setPendingOffers(prev => prev.filter(o => o.link_id !== offer.link_id));
        setLinkedInvestors(prev => [updatedLink, ...prev].sort((a, b) => new Date(b.approved_at!).getTime() - new Date(a.approved_at!).getTime()));
        
    } catch (error: any) {
        console.error("Error approving investor:", error);
        toast.error(`Failed to link investor: ${error.message || 'Unknown error'}`);
    } finally {
        setActionLoadingId(null); // Clear loading state
    }
  };

  // --- NEW: Handle Reject Offer ---
  const handleReject = async (offer: CombinedOffer) => {
    if (actionLoadingId) return; 
    setActionLoadingId(offer.link_id);

    try {
        // 1. Update link status to 'rejected'
        const { error: linkError } = await supabase
            .from('farmer_investor_links')
            .update({ status: 'rejected' })
            .eq('link_id', offer.link_id);

        if (linkError) throw linkError;
        
        // 2. We can also delete the 'investors' record since it was a one-time offer
        // This is optional but good cleanup.
        await supabase
            .from('investors')
            .delete()
            .eq('investor_id', offer.investors!.investor_id);

        toast.info(`Offer from ${offer.investors?.investor_name} has been rejected.`);

        // 3. Update UI State
        setPendingOffers(prev => prev.filter(o => o.link_id !== offer.link_id));

    } catch (error: any) {
        console.error("Error rejecting investor:", error);
        toast.error(`Failed to reject offer: ${error.message || 'Unknown error'}`);
    } finally {
        setActionLoadingId(null);
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
                 <p className="text-muted-foreground text-sm sm:text-base">Manage your investment offers</p>
             </div>
          </div>
          
           {/* Info Card */}
            <Card className="p-4 sm:p-6 bg-gradient-accent text-accent-foreground shadow-medium flex items-start gap-3 sm:gap-4 rounded-2xl">
                <Info className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-0.5"/>
                 <div>
                     <h3 className="font-bold text-base sm:text-lg mb-1">💡 Manage Your Offers</h3>
                     <p className="text-xs sm:text-sm text-accent-foreground/90">
                         Review pending offers from investors. Approving an offer will link them to your farm and allocate a portion of your stake.
                     </p>
                 </div>
             </Card>

          {/* --- NEW: Pending Investor Offers --- */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pending Investment Offers</h2>
            {isLoading ? (
                 <Card className="p-6 flex justify-center items-center rounded-xl"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
             ) : pendingOffers.length === 0 ? (
                 <Card className="p-6 text-center text-muted-foreground rounded-xl"> You have no pending investment offers. </Card>
             ) : (
                pendingOffers.map((offer) => (
                  <Card key={offer.link_id} className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow rounded-xl border-l-4 border-accent">
                    <div className="space-y-4">
                       <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 text-lg">
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                        {offer.investors?.investor_name?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-base sm:text-lg">{offer.investors?.investor_name || "Investor"}</h3>
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-0.5">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span>{offer.investors?.location || "Location not specified"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-accent px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-accent/10 self-start">
                                <Clock className="w-3 h-3" />
                                Pending
                            </div>
                        </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 sm:py-4 border-t border-b text-center sm:text-left">
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Investment</p>
                                <p className="font-bold text-sm sm:text-lg text-accent">{formatCurrency(offer.investors?.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Stake Offered</p>
                                <p className="font-bold text-sm sm:text-lg text-primary">{offer.investors?.offer_percent}%</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Est. Land Share</p>
                                <p className="font-bold text-sm sm:text-lg text-success">{calculateLandForStake(offer.investors?.offer_percent || 0)} acres</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Duration</p>
                                <p className="font-bold text-sm sm:text-lg">{offer.investors?.duration || 'N/A'}</p>
                            </div>
                        </div>
                      {/* Approve/Reject Buttons */}
                      <div className="flex gap-4 w-full sm:w-auto">
                        <Button
                          variant="success"
                          className="flex-1"
                          onClick={() => handleApprove(offer)}
                          disabled={actionLoadingId === offer.link_id || availableStake < (offer.investors?.offer_percent || 101)}
                          title={availableStake < (offer.investors?.offer_percent || 101) ? `Not enough stake available (You have ${availableStake}%)` : "Approve this offer"}
                        >
                           {actionLoadingId === offer.link_id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Handshake className="w-5 h-5 mr-2" />}
                           Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReject(offer)}
                          disabled={actionLoadingId === offer.link_id}
                        >
                           {actionLoadingId === offer.link_id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                           Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>

          {/* --- EXISTING: Linked Investors Section --- */}
           <div className="space-y-4 pt-6 border-t">
               <h2 className="text-xl font-bold">Your Linked Investors</h2>
               {isLoading ? (
                   <Card className="p-6 flex justify-center items-center rounded-xl"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
               ) : linkedInvestors.length === 0 ? (
                   <Card className="p-6 text-center text-muted-foreground rounded-xl"> You haven't linked with any investors yet. </Card>
               ) : (
                   linkedInvestors.map((investor) => (
                       <Card key={investor.link_id} className="p-4 sm:p-6 shadow-soft bg-card border-l-4 border-success rounded-xl">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 sm:gap-4">
                                   <Avatar className="w-10 h-10 text-lg">
                                      <AvatarFallback className="bg-primary/80 text-primary-foreground">
                                          {investor.investors?.investor_name?.charAt(0).toUpperCase() || '?'}
                                      </AvatarFallback>
                                  </Avatar>
                                  <div>
                                       <h3 className="font-semibold text-base sm:text-lg">{investor.investors?.investor_name || "Investor"}</h3>
                                       <p className="text-xs text-muted-foreground">
                                           {investor.investors?.offer_percent}% stake for {formatCurrency(investor.investors?.amount)} ({investor.investors?.duration || 'N/A'})
                                       </p>
                                        <p className="text-xs text-muted-foreground">
                                            Linked on: {new Date(investor.approved_at!).toLocaleDateString()}
                                       </p>
                                  </div>
                              </div>
                               <div className="text-success px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-success/10 self-start sm:self-center mt-2 sm:mt-0">
                                  <CheckCircle className="w-4 h-4" />
                                  Linked (Approved)
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