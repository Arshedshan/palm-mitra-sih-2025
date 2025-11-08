// Create this new file: src/components/InvestorProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useInvestorAuth } from '@/context/InvestorAuthContext'; // <-- Use new context
import { Loader2 } from 'lucide-react';

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
    <Loader2 className="w-12 h-12 animate-spin text-primary" />
  </div>
);

export const InvestorProtectedRoute = () => {
  // Use the new Investor Auth hook
  const { session, profile, loading } = useInvestorAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  // 1. If no session, redirect to investor login
  if (!session) {
    return <Navigate to="/investor-login" state={{ from: location }} replace />;
  }

  // 2. If session exists but NO investor profile, they are a farmer or new user
  //    Redirect them away to avoid errors.
  if (!profile) {
    toast.error("You are not registered as an investor.");
    // We can't log them out as they might be a farmer.
    // We just send them to the main farmer login page.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. User is logged in AND has an investor profile
  return <Outlet />;
};