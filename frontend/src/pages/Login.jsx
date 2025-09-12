import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendor');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false); // NEW
  const { login, isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password, role);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-6">
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div 
                onClick={() => setRole('vendor')}
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${role === 'vendor' ? 'border-primary' : 'border-muted'}`}
              >
                Vendor
              </div>
              <div 
                onClick={() => setRole('supplier')}
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${role === 'supplier' ? 'border-primary' : 'border-muted'}`}
              >
                Supplier
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full mt-6" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sign In</Button>
          </form>
          <div className="text-center mt-4">
            <ForgotPasswordDialog
              open={isForgotPasswordDialogOpen}
              onOpenChange={setIsForgotPasswordDialogOpen}
            >
              <Button variant="link" type="button" className="text-sm font-medium text-primary hover:underline">
                Forgot Password?
              </Button>
            </ForgotPasswordDialog>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <p className="mt-4 text-center text-sm text-muted-foreground">Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link></p>
        </CardContent>
      </Card>
    </div>
  );
};



export default Login;
