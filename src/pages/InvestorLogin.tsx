// src/pages/InvestorLogin.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase

// This can be a MOCK login, or you can use Supabase auth
// For this demo, we'll use a MOCK login for simplicity
const InvestorLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- MOCK LOGIN HANDLER ---
  const handleMockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.success("Login successful! Redirecting to dashboard...");
    
    // Simulate network delay
    setTimeout(() => {
      // In a real app, you'd save an investor session.
      // For the prototype, we just navigate.
      // We'll use a simple localStorage flag to "protect" the investor routes
      localStorage.setItem("investor_session", "true");
      // --- MODIFICATION: Go to new dashboard ---
      navigate('/investor-dashboard'); 
      setLoading(false);
    }, 1500);
  };

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
          <form onSubmit={handleMockLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email (any email)</Label>
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
              <Label htmlFor="password">Password (any password)</Label>
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