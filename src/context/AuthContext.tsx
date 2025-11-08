/*
  File: arshedshan/palm-mitra-sih-2025/palm-mitra-sih-2025-9a5f98085db88ae6f7cf3338ebe08844f6cb6035/src/context/AuthContext.tsx
*/
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// Define the shape of your farmer profile from the DB
export interface FarmerProfile {
  id: string; // This is the farmer table's primary key (a UUID)
  user_id: string; // This is the auth.users id
  name: string;
  state: string | null; 
  district: string;
  land_size: number;
  phone: string | null; 
  address: string | null; // <-- ADD THIS LINE
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
  setProfile: (profile: FarmerProfile | null) => void;
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
          localStorage.removeItem("mockAddress"); // <-- Add this for cleanup
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 3. Fetch farmer profile when user changes
  useEffect(() => {
    if (user) {
      if (!profile) {
         setLoading(true); 
      }
      supabase
        .from('farmers')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching farmer profile:', error.message);
          } 
          
          if (data) {
            setProfile(data as FarmerProfile);
            localStorage.setItem("farmerProfile", JSON.stringify(data));
            localStorage.setItem("farmerId", data.id);
          } else {
            setProfile(null);
          }
          setLoading(false); // Profile fetch done
        });
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]); 


  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    loading, 
    logout,
    setProfile, 
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