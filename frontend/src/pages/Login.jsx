import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import riderImg from '../assets/rider.png';
import LoginNavbar from '../components/LoginNavbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendor');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Disable page scroll while on login
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password, role);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-50 to-yellow-50">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 p-6 max-w-6xl w-full">
         <LoginNavbar />
        {/* LEFT: Illustration + tagline */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg mb-6 lg:mb-0">
          <div className="relative w-64 h-64">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 space-y-2 pointer-events-none">
              <span className="block w-24 h-1 rounded-full bg-red-400/80 animate-trail" style={{ animationDelay: '0ms' }} />
              <span className="block w-16 h-1 rounded-full bg-red-300/70 animate-trail" style={{ animationDelay: '140ms' }} />
              <span className="block w-10 h-1 rounded-full bg-red-200/60 animate-trail" style={{ animationDelay: '280ms' }} />
            </div>
            <div className="relative w-64 h-64 animate-ride-in">
              <div className="relative w-full h-full rounded-full p-2 bg-gradient-to-tr from-white/60 to-white/20 shadow-2xl">
                <img
                  src={riderImg}
                  alt="Delivery Rider"
                  className="rounded-full border-4 border-white shadow-lg w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 rounded-full pointer-events-none">
                  <div className="absolute -inset-6 rounded-full blur-2xl bg-red-200/30 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mt-6 mb-2 text-gray-800">Order Food</h1>
          <h2 className="text-4xl font-extrabold text-red-600 mb-4">Fast Delivery</h2>
          <p className="text-gray-600 max-w-sm">
            Sign in to get started with quick and delightful deliveries — intuitive dashboard for vendors & suppliers.
          </p>
        </div>

        {/* RIGHT: Login card */}
        <Card className="
  w-full max-w-xl   /* wider card */
  h-[530px]         /* moderate height */
  shadow-2xl 
  bg-white/50 
  backdrop-blur-2xl 
  border border-white/30 
  rounded-2xl 
  p-8 relative 
  overflow-hidden
  transition-all
  hover:scale-105
  animate-card-pop
">
          {/* Decorative circle behind card */}
          <div className="absolute -z-10 hidden lg:block -left-24 top-8 w-90 h-40 rounded-full bg-red-200/30 blur-3xl" />

          <CardHeader>
            <CardTitle className="text-lg">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRole('vendor')}
                  className={`flex items-center justify-center gap-2 rounded-md border-2 p-3 cursor-pointer transition-all select-none ${
                    role === 'vendor' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-transparent bg-white/60'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium">Vendor</span>
                </div>

                <div
                  onClick={() => setRole('supplier')}
                  className={`flex items-center justify-center gap-2 rounded-md border-2 p-3 cursor-pointer transition-all select-none ${
                    role === 'supplier' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-transparent bg-white/60'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="font-medium">Supplier</span>
                </div>
              </div>

              {/* Email & Password */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white mt-4 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>

            {/* Forgot password */}
            <div className="text-center mt-4">
              <ForgotPasswordDialog
                open={isForgotPasswordDialogOpen}
                onOpenChange={setIsForgotPasswordDialogOpen}
              >
                <Button
                  variant="link"
                  type="button"
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Forgot Password?
                </Button>
              </ForgotPasswordDialog>
            </div>

            <p className="mt-4 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-red-600 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
