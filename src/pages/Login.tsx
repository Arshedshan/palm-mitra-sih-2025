// src/pages/Login.tsx

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Leaf } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // We will create this

const Login = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth(); // Get session from context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session) {
      navigate('/dashboard');
    }
  }, [session, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login successful! Redirecting...');
      navigate('/dashboard'); // AuthProvider will handle session update
    }
    setLoading(false);
  };

  // Show loader if auth is still checking or session exists
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
           <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-medium mb-4">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-center">
            Palm Mitra Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </p>
          {/* --- ADDED THIS LINK --- */}
          <Link to="/investor-register" className="text-sm text-muted-foreground hover:underline mt-4">
            Interested to invest? Register as an investor
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;