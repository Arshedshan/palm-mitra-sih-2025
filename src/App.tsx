// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- Import New Auth/Route Components ---
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ProtectedRoute, ProfileRequiredRoute } from "./components/ProtectedRoute";
// ------------------------------------

// Import other pages
import Language from "./pages/Language";
import Onboarding from "./pages/Onboarding";
import Verification from "./pages/Verification";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import Learn from "./pages/Learn";
import Community from "./pages/Community"; // <-- FIX: Corrected path
import Money from "./pages/Money";
import SubsidyCalculator from "./pages/SubsidyCalculator";
import LoanCalculator from "./pages/LoanCalculator";
import Insurance from "./pages/Insurance";
import MarketPrice from "./pages/MarketPrice";
import Investors from "./pages/Investors";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Create a component to handle loading state
const AppRoutes = () => {
  const { loading } = useAuth();

  // Show a global loader while the AuthContext is busy
  if (loading) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes: Login and Register are accessible to everyone */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Routes for logged-in users who might NOT have a profile yet */}
      <Route element={<ProtectedRoute />}>
        <Route path="/language" element={<Language />} /> 
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/verification" element={<Verification />} />
      </Route>
      
      {/* Routes that require a user to be logged in AND have a farmer profile */}
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
        {/* --- FIX: Corrected typo 'Element=' to 'element=' --- */}
        <Route path="/investors" element={<Investors />} />
        {/* -------------------------------------------------- */}
        <Route path="/progress" element={<Progress />} />
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
        <AppRoutes /> {/* Use the new AppRoutes component */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;