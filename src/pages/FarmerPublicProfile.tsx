// Create this file at: src/pages/FarmerPublicProfile.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, MapPin, Sprout, ShieldCheck, User, CalendarDays, BarChart, DollarSign, Info, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { FarmerProfile } from "@/context/AuthContext"; // Re-use FarmerProfile interface
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define type for Cultivation data
interface CultivationRecord {
  id: string;
  planting_date: string | null;
  status: string | null;
  harvest_date: string | null;
  yield_amount_tonnes: number | null;
}

const FarmerPublicProfile = () => {
  const navigate = useNavigate();
  const { farmerId } = useParams<{ farmerId: string }>(); // Get farmerId from URL
  
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [cultivation, setCultivation] = useState<CultivationRecord[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [experience, setExperience] = useState<number>(0);

  useEffect(() => {
    // Mock check for investor session
    const investorSession = localStorage.getItem("investor_session");
    if (!investorSession) {
        toast.error("Please log in as an investor.");
        navigate("/investor-login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!farmerId) {
      toast.error("No farmer specified.");
      navigate("/investor-marketplace"); // Go back if no ID
      return;
    }

    const fetchFarmerDetails = async () => {
      setIsLoading(true);

      // 1. Fetch Farmer Profile
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', farmerId)
        .eq('is_seeking_investment', true) // Ensure they are still seeking
        .single();
        
      if (farmerError || !farmerData) {
        toast.error("Could not fetch farmer details or they are no longer seeking investment.");
        console.error(farmerError);
        navigate("/investor-marketplace");
        return;
      }
      setFarmer(farmerData as FarmerProfile);

      // 2. Fetch Cultivation Records
      const { data: cultivationData, error: cultivationError } = await supabase
        .from('cultivation')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('planting_date', { ascending: true }); // Order by planting date
        
      if (!cultivationError && cultivationData) {
        setCultivation(cultivationData || []);
        
        // Calculate experience from earliest planting date
        const earliestPlantDate = cultivationData[0]?.planting_date;
        if (earliestPlantDate) {
            const plantDate = new Date(earliestPlantDate);
            const today = new Date();
            const diffTime = today.getTime() - plantDate.getTime();
            const diffYears = parseFloat((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
            setExperience(diffYears > 0 ? diffYears : 0);
        }
      } // Don't block on this error

      // 3. Fetch Verification Status
      const { data: verificationData, error: verificationError } = await supabase
        .from('Green_Ledger')
        .select('status')
        .eq('farm_id', farmerId)
        .eq('status', 'Verified: Deforestation-Free')
        .limit(1)
        .single();
        
      setIsVerified(!!verificationData && !verificationError);

      setIsLoading(false);
    };

    fetchFarmerDetails();
  }, [farmerId, navigate]);
  
  const handleMakeOffer = () => {
      // This is where an investor would enter their offer details
      // For the prototype, we just show a message
      toast.info("This is where an investor would create an offer (e.g., amount, stake %)", {
          description: "This would create a new 'investor' record with 'is_available: true' for the farmer to see.",
          action: {
              label: "Close",
              onClick: () => {},
          },
          duration: 7000,
      });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!farmer) return null; // Should be covered by loader

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
                 <Button size="lg" className="w-full sm:w-auto" onClick={handleMakeOffer}>
                    <DollarSign className="w-5 h-5 mr-2"/>
                    Make Investment Offer
                 </Button>
              </div>
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