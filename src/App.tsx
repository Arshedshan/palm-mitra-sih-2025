import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Language />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/verification" element={<Verification />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
