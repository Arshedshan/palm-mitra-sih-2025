// Create this file at: src/pages/InvestorRegister.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building } from 'lucide-react';
// Note: We are not importing Supabase here for the mock registration

const InvestorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- MOCK REGISTER HANDLER ---
  const handleMockRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
    }
    setLoading(true);
    toast.success("Registration successful! Please login.");
    
    // Simulate network delay
    setTimeout(() => {
      // In a real app, you would have created a user with Supabase auth
      // and potentially created an investor profile.
      // For this prototype, we just redirect to the login page.
      navigate('/investor-login');
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
            Create Investor Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMockRegister} className="space-y-6">
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
              <Label htmlFor="password">Password (min. 6 characters)</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required
                minLength={6}
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/investor-login" className="font-semibold text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InvestorRegister;