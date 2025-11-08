// Create this new file: src/context/InvestorAuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// 1. Define the shape of your investor profile
export interface InvestorProfile {
  id: string; // This is the investor_profiles table's primary key (a UUID)
  user_id: string; // This is the auth.users id
  name: string;
  created_at: string;
}

interface InvestorAuthContextType {
  session: Session | null;
  user: User | null;
  profile: InvestorProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const InvestorAuthContext = createContext<InvestorAuthContextType | null>(null);

export const InvestorAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // 2. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Initial auth check done
    });

    // 3. Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (_event === 'SIGNED_OUT') {
          setProfile(null);
          // Clear localStorage on logout
          localStorage.removeItem("investor_session"); // Clear mock session
          localStorage.removeItem("investor_user_id");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 4. Fetch investor profile when user changes
  useEffect(() => {
    if (user) {
      if (!profile) {
         setLoading(true);
      }
      supabase
        .from('investor_profiles') // <-- Fetch from the NEW table
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching investor profile:', error.message);
          } 
          
          if (data) {
            setProfile(data as InvestorProfile);
          } else {
            // This is a valid user, but not an investor
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
    // Auth listener will handle setting user/session/profile to null
  };

  const value = {
    session,
    user,
    profile,
    loading,
    logout,
  };

  return (
    <InvestorAuthContext.Provider value={value}>
      {children}
    </InvestorAuthContext.Provider>
  );
};

// Custom hook to use the Investor Auth context
export const useInvestorAuth = () => {
  const context = useContext(InvestorAuthContext);
  if (context === null) {
    throw new Error('useInvestorAuth must be used within an InvestorAuthProvider');
  }
  return context;
};