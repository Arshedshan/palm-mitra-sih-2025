import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // <-- Import Supabase

const InvestorRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // <-- ADDED NAME FIELD

  // --- UPDATED: Real Register Handler ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
    }
    setLoading(true);

    try {
      // 1. Create the user in auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration successful, but no user data returned.");

      // 2. Create the profile in public.investor_profiles
      const { error: profileError } = await supabase
        .from('investor_profiles')
        .insert({
          user_id: authData.user.id,
          name: name
        });

      if (profileError) throw profileError;
      
      toast.success("Registration successful! Please login.");
      navigate('/investor-login');

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={handleRegister} className="space-y-6">
            {/* --- ADDED NAME FIELD --- */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                required 
                className="h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {/* ------------------------ */}
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