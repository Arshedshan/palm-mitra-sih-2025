import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

// --- Import ALL Pages ---
// Farmer Auth
import Login from "./pages/Login";
import Register from "./pages/Register";
// Investor Auth
import InvestorLogin from "./pages/InvestorLogin"; // --- ADDED ---
// Protected Route Guards
import { ProtectedRoute, ProfileRequiredRoute } from "./components/ProtectedRoute";
// Farmer Pages
import Language from "./pages/Language";
import Onboarding from "./pages/Onboarding";
import Verification from "./pages/Verification";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import Learn from "./pages/Learn";
import Community from "./pages/Community";
import Money from "./pages/Money";
import SubsidyCalculator from "./pages/SubsidyCalculator";
import LoanCalculator from "./pages/LoanCalculator";
import Insurance from "./pages/Insurance";
import MarketPrice from "./pages/MarketPrice";
import Investors from "./pages/Investors";
import Progress from "./pages/Progress";
// Investor Pages
import InvestorMarketplace from "./pages/InvestorMarketplace"; // --- ADDED ---
import FarmerPublicProfile from "./pages/FarmerPublicProfile"; // --- ADDED ---
// General
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Farmer Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* --- NEW: Public Investor Routes --- */}
      <Route path="/investor-login" element={<InvestorLogin />} />
      
      {/* Routes for logged-in FARMERS who might NOT have a profile yet */}
      <Route element={<ProtectedRoute />}>
        <Route path="/language" element={<Language />} /> 
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/verification" element={<Verification />} />
      </Route>
      
      {/* Routes that require a FARMER to be logged in AND have a profile */}
      <Route element={<ProfileRequiredRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/community" element={<Community />} />
        <Route path="/money" element={<Money />} />
        <Route path="/money/subsidy" element={<SubsidyCalculator />} />
        <Route path="/money/loan" element={<LoanCalculator />} />
        <Route path="/money/insurance" element={<Insurance />} />
        <Route path="/money/market" element={<MarketPrice />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/progress" element={<Progress />} />
      </Route>
      
      {/* --- NEW: Investor-facing Routes --- */}
      {/* For the prototype, these are "mock" protected inside the components */}
      <Route path="/investor-marketplace" element={<InvestorMarketplace />} />
      <Route path="/farmer/:farmerId" element={<FarmerPublicProfile />} />

      {/* Catch-all Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;