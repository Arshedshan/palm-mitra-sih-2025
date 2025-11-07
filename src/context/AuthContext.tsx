// Create this file at: src/context/AuthContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// Define the shape of your farmer profile from the DB
export interface FarmerProfile {
  id: string; // This is the farmer table's primary key (a UUID)
  user_id: string; // This is the auth.users id
  name: string;
  district: string;
  land_size: number;
  created_at: string;
  language: string;
  gps_coords: { latitude: number; longitude: number; } | null;
  // Add avatar_url if you implement it
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: FarmerProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Create the provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Initial auth check done
    });

    // 2. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Clear profile on logout
        if (_event === 'SIGNED_OUT') {
          setProfile(null);
          // Clear localStorage on logout
          localStorage.removeItem("farmerProfile");
          localStorage.removeItem("farmerId");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 3. Fetch farmer profile when user changes
  useEffect(() => {
    // Only fetch if we have a user but don't have their profile yet
    // or if the user changed and the profile doesn't match
    if (user && (!profile || profile.user_id !== user.id) && !loading) {
      setLoading(true); // Start loading profile data
      supabase
        .from('farmers')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching farmer profile:', error.message);
          } else if (data) {
            setProfile(data as FarmerProfile);
            // Sync localStorage for older components if needed (optional)
            localStorage.setItem("farmerProfile", JSON.stringify(data));
            localStorage.setItem("farmerId", data.id);
          }
          // If no data and no error, profile is just null (new user needs onboarding)
          setLoading(false); // Profile fetch done
        });
    } else if (!user) {
      // Clear profile if user is logged out
      setProfile(null);
      localStorage.removeItem("farmerProfile");
      localStorage.removeItem("farmerId");
    }
  }, [user, profile, loading]); // Rerun when user, profile, or loading changes

  const logout = async () => {
    await supabase.auth.signOut();
    // Auth listener will handle setting user/session/profile to null
  };

  const value = {
    session,
    user,
    profile,
    loading: loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};