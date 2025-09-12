import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword, verifyPasswordResetOtp, resetPassword } from '../services/authService';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordDialog = ({ children, open, onOpenChange }) => {
  const [step, setStep] = useState('enter-email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      console.log('ForgotPasswordDialog: forgotPasswordMutation success');
      toast({ title: 'OTP Sent', description: 'An OTP has been sent to your email address.' });
      setStep('enter-otp');
    },
    onError: (error) => {
      console.error('ForgotPasswordDialog: forgotPasswordMutation error', error);
      const errorMessage = error.response?.status === 404 
        ? 'User does not exist' 
        : error.response?.data?.msg || 'An error occurred';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyPasswordResetOtp,
    onSuccess: () => {
      toast({ title: 'OTP Verified', description: 'You can now reset your password.' });
      setStep('enter-password');
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.msg || 'An error occurred' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Your password has been reset successfully.' });
      setStep('enter-email'); // Reset to initial step
      onOpenChange(false); // Close the dialog
      navigate('/login'); // Redirect to login page
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.msg || 'An error occurred' });
    },
  });

  const handleForgotPassword = (e) => {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    verifyOtpMutation.mutate({ email, otp });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match' });
      return;
    }
    resetPasswordMutation.mutate({ email, otp, password });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-white dark:bg-white">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogDescription>
            {step === 'enter-email' && 'Enter your email to receive a password reset OTP.'}
            {step === 'enter-otp' && 'Enter the OTP sent to your email.'}
            {step === 'enter-password' && 'Enter your new password.'}
          </DialogDescription>
        </DialogHeader>
        {step === 'enter-email' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Send OTP
            </Button>
          </form>
        )}
        {step === 'enter-otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending}>
              {verifyOtpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Verify OTP
            </Button>
          </form>
        )}
        {step === 'enter-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Reset Password
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
