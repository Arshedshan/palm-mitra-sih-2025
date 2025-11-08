import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useInvestorAuth } from '@/context/InvestorAuthContext'; // <-- Import new auth

const InvestorLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { session, loading: authLoading } = useInvestorAuth(); // <-- Use new auth

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && session) {
      navigate('/investor-dashboard');
    }
  }, [session, authLoading, navigate]);

  // --- UPDATED: Real Login Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Supabase auth.signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error; // Shows "Invalid login credentials"

      if (data.user) {
        // SUCCESS!
        toast.success("Login successful! Redirecting to dashboard...");
        // No localStorage needed, the AuthProvider will handle it
        navigate('/investor-dashboard');
      }

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Show loader if auth is still checking
  if (authLoading || session) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="items-center">
           <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center shadow-medium mb-4">
            <Building className="w-10 h-10 text-accent-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-center">
            Investor Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="investor@company.com" 
                required 
                className="h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Want to invest?{' '}
            <Link to="/investor-register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </p>
          <Link to="/" className="text-sm text-muted-foreground hover:underline mt-4">
            Are you a Farmer? Login here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InvestorLogin;