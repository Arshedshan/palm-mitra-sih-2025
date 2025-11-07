// Create this file at: src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Path to your AuthContext
import { Loader2 } from 'lucide-react';

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
    <Loader2 className="w-12 h-12 animate-spin text-primary" />
  </div>
);

/**
 * Protects routes that require a user to be logged in.
 * If logged in, renders the child route.
 * If not logged in, redirects to the login page.
 */
export const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!session) {
    // User is not logged in, redirect to login page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is logged in, render the child component (e.g., Onboarding)
  return <Outlet />;
};

/**
 * Protects routes that require a user to be logged in AND have a completed farmer profile.
 * If logged in + has profile, renders the child route.
 * If logged in + NO profile, redirects to onboarding.
 * If not logged in, redirects to login.
 */
export const ProfileRequiredRoute = () => {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
      return <FullScreenLoader />;
    }

    if (!session) {
      // Not logged in
      return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!profile) {
      // Logged in BUT no profile, redirect to create one
      // Pass the original intended location
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }

    // User is logged in AND has a profile, render the child
    return <Outlet />;
};