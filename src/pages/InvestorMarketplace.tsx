// Create this file at: src/pages/InvestorMarketplace.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, MapPin, Sprout, ShieldCheck, User, BarChart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

// Define a type for the farmer data we're fetching
interface FarmerListing {
  id: string; // farmer.id (UUID)
  name: string;
  district: string;
  land_size: number;
  is_verified: boolean;
  experience_years: number;
}

const InvestorMarketplace = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<FarmerListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock check for investor session
  useEffect(() => {
    const investorSession = localStorage.getItem("investor_session");
    if (!investorSession) {
        toast.error("Please log in as an investor to view the marketplace.");
        navigate("/investor-login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchWillingFarmers = async () => {
      setIsLoading(true);
      
      // 1. Fetch all farmers who are seeking investment
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .select('id, name, district, land_size')
        .eq('is_seeking_investment', true);
        
      if (farmerError) {
        toast.error("Failed to fetch farmer listings.");
        console.error(farmerError);
        setIsLoading(false);
        return;
      }
      
      if (!farmerData) {
         setFarmers([]);
         setIsLoading(false);
         return;
      }

      // 2. Fetch cultivation and verification data for all these farmers
      // This is a more efficient approach than N+1 queries
      const farmerIds = farmerData.map(f => f.id);

      const { data: cultivationData, error: cultivationError } = await supabase
        .from('cultivation')
        .select('farmer_id, planting_date')
        .in('farmer_id', farmerIds)
        .order('planting_date', { ascending: true }); // Get earliest planting date

      const { data: ledgerData, error: ledgerError } = await supabase
        .from('Green_Ledger')
        .select('farm_id, status')
        .in('farm_id', farmerIds)
        .eq('status', 'Verified: Deforestation-Free');

      if (cultivationError) console.warn("Could not fetch all cultivation data");
      if (ledgerError) console.warn("Could not fetch all verification data");

      // 3. Process the data into maps for easy lookup
      const cultivationMap = new Map<string, number>(); // Map<farmer_id, experience_years>
      if (cultivationData) {
          // Get the *earliest* planting date for each farmer
          const earliestPlanting: Record<string, string> = {};
          for (const record of cultivationData) {
              if (!earliestPlanting[record.farmer_id]) {
                  earliestPlanting[record.farmer_id] = record.planting_date;
              }
          }
          // Calculate experience
          for (const farmerId in earliestPlanting) {
             const plantDate = new Date(earliestPlanting[farmerId]);
             const today = new Date();
             const diffTime = today.getTime() - plantDate.getTime();
             const diffYears = parseFloat((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
             cultivationMap.set(farmerId, diffYears > 0 ? diffYears : 0);
          }
      }
      
      const verifiedSet = new Set(ledgerData?.map(l => l.farm_id) || []);

      // 4. Combine all data
      const farmersWithStatus = farmerData.map(farmer => ({
        ...farmer,
        is_verified: verifiedSet.has(farmer.id),
        experience_years: cultivationMap.get(farmer.id) || 0, // Default to 0 if no planting date
      }));

      setFarmers(farmersWithStatus);
      setIsLoading(false);
    };

    fetchWillingFarmers();
  }, []);

  const handleLogout = () => {
      localStorage.removeItem("investor_session");
      navigate("/investor-login");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-6">
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-4">
                 <Button variant="ghost" size="icon" onClick={() => navigate(-1)}> {/* Go back */}
                   <ArrowLeft className="w-5 h-5" />
                 </Button>
                 <div>
                     <h1 className="text-2xl sm:text-3xl font-bold">Farmer Marketplace</h1>
                     <p className="text-muted-foreground text-sm sm:text-base">Browse farmers seeking investment</p>
                 </div>
             </div>
             <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
          
          {/* Farmer List */}
          <div className="space-y-4">
             {isLoading ? (
                 <Card className="p-6 flex justify-center items-center rounded-xl"> <Loader2 className="w-6 h-6 animate-spin text-primary" /> </Card>
             ) : farmers.length === 0 ? (
                 <Card className="p-6 text-center text-muted-foreground rounded-xl"> No farmers are currently seeking investment. Check back later! </Card>
             ) : (
                farmers.map((farmer) => (
                  <Card 
                    key={farmer.id} 
                    className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow rounded-xl cursor-pointer"
                    onClick={() => navigate(`/farmer/${farmer.id}`)} // Navigate to public profile
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                             <Avatar className="w-12 h-12 text-lg">
                                <AvatarFallback className="bg-primary/80 text-primary-foreground">
                                    {farmer.name?.charAt(0).toUpperCase() || <User />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base sm:text-lg">{farmer.name}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span>{farmer.district || "Unknown Location"}</span>
                                </div>
                                {farmer.is_verified && (
                                   <div className="text-success px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 bg-success/10 w-fit">
                                      <ShieldCheck className="w-3 h-3" />
                                      Verified Farm
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-end gap-2 sm:gap-0 sm:items-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-none">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Sprout className="w-4 h-4 text-primary" />
                                <span className="font-medium text-foreground">{farmer.land_size}</span>
                                <span>acres</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <BarChart className="w-4 h-4 text-accent" />
                                <span className="font-medium text-foreground">{farmer.experience_years}</span>
                                <span>yrs exp.</span>
                            </div>
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

export default InvestorMarketplace;