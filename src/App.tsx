// src/App.tsx

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
import InvestorLogin from "./pages/InvestorLogin";
import InvestorRegister from "./pages/InvestorRegister"; 
// Protected Route Guards
import { ProtectedRoute, ProfileRequiredRoute } from "./components/ProtectedRoute";
import { InvestorProtectedRoute } from "./components/InvestorProtectedRoute";
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
// --- IMPORT NEW PAGES ---
import InsuranceSchemes from "./pages/InsuranceSchemes";
import GovtSchemes from "./pages/GovtSchemes";
// ----------------------
// Investor Pages
import InvestorDashboard from "./pages/InvestorDashboard";
import InvestorMarketplace from "./pages/InvestorMarketplace"; 
import FarmerPublicProfile from "./pages/FarmerPublicProfile"; 
// General
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const AppRoutes = () => {
  const { loading: farmerAuthLoading } = useAuth();

  if (farmerAuthLoading) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* --- Public Farmer Routes --- */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* --- Public Investor Routes --- */}
      <Route path="/investor-login" element={<InvestorLogin />} />
      <Route path="/investor-register" element={<InvestorRegister />} />
      
      {/* --- FARMER Protected Routes --- */}
      <Route element={<ProtectedRoute />}>
        <Route path="/language" element={<Language />} /> 
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/verification" element={<Verification />} />
      </Route>
      
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
        {/* --- ADD NEW ROUTES --- */}
        <Route path="/protect-harvest" element={<InsuranceSchemes />} />
        <Route path="/govt-schemes" element={<GovtSchemes />} />
        {/* -------------------- */}
      </Route>
      
      {/* --- INVESTOR Protected Routes --- */}
      <Route element={<InvestorProtectedRoute />}>
        <Route path="/investor-dashboard" element={<InvestorDashboard />} />
        <Route path="/investor-marketplace" element={<InvestorMarketplace />} />
        <Route path="/farmer/:farmerId" element={<FarmerPublicProfile />} />
      </Route>

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