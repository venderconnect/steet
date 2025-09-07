import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'vendor',
    businessName: '', address: { street: '', city: '', state: '', zipCode: '' },
  });
  const [otp, setOtp] = useState(''); // NEW: OTP state
  const [step, setStep] = useState('register'); // NEW: Step state (register, verifyOtp)
  const [registrationEmail, setRegistrationEmail] = useState(''); // NEW: Store email for OTP verification
  const [isLoading, setIsLoading] = useState(false);
  const { register: authRegister, isAuthenticated, verifyOtp: authVerifyOtp } = useAuth(); // Renamed register to authRegister
  const { toast } = useToast();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleInputChange = (field, value) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [addressField]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    // Build userData to ensure `address` matches backend schema
    const { confirmPassword, ...rest } = formData;
    const userData = {
      ...rest,
      address: {
        street: formData.address.street || '',
        city: formData.address.city || '',
        state: formData.address.state || '',
        zipCode: formData.address.zipCode || '',
      }
    };

    const response = await authRegister(userData); // Use authRegister

    if (response && response.success) {
      setRegistrationEmail(formData.email);
      setStep('verifyOtp');
      toast({ title: "OTP Sent", description: response.message || "Please check your email for the OTP." });
    } else if (response && response.message) {
      toast({ title: "Registration Error", description: response.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const response = await authVerifyOtp(registrationEmail, otp);

    if (response && response.success) {
      toast({ title: "Verification Successful", description: response.message || "Your email has been verified!" });
      // Optionally, redirect to login or home
      // navigate('/login'); // You might need to import useNavigate
    } else if (response && response.message) {
      toast({ title: "Verification Failed", description: response.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    // Rebuild userData for resend to include address in expected shape
    const { confirmPassword, ...rest } = formData;
    const userData = {
      ...rest,
      email: registrationEmail,
      address: {
        street: formData.address.street || '',
        city: formData.address.city || '',
        state: formData.address.state || '',
        zipCode: formData.address.zipCode || '',
      }
    };
    const response = await authRegister(userData); // Call register again to resend OTP

    if (response && response.success) {
      toast({ title: "OTP Resent", description: response.message || "A new OTP has been sent to your email." });
    } else if (response && response.message) {
      toast({ title: "Error Resending OTP", description: response.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{step === 'register' ? 'Create Account' : 'Verify Your Email'}</CardTitle>
          <CardDescription>
            {step === 'register' ? 'Join our network of vendors and suppliers.' : 'An OTP has been sent to your email. Please enter it below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <RadioGroup value={formData.role} onValueChange={(val) => handleInputChange('role', val)} className="grid grid-cols-2 gap-4">
                <div><RadioGroupItem value="vendor" id="vendor" className="peer sr-only" /><Label htmlFor="vendor" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary">Vendor</Label></div>
                <div><RadioGroupItem value="supplier" id="supplier" className="peer sr-only" /><Label htmlFor="supplier" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary">Supplier</Label></div>
              </RadioGroup>
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required /></div>
              {formData.role === 'supplier' && <div className="space-y-2"><Label htmlFor="businessName">Business Name</Label><Input id="businessName" value={formData.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} required /></div>}
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required /></div>
              <div className="space-y-2"><Label>Address</Label><Input placeholder="Street" value={formData.address.street} onChange={(e) => handleInputChange('address.street', e.target.value)} required />
                <div className="grid grid-cols-3 gap-2"><Input placeholder="City" value={formData.address.city} onChange={(e) => handleInputChange('address.city', e.target.value)} required /><Input placeholder="State" value={formData.address.state} onChange={(e) => handleInputChange('address.state', e.target.value)} required /><Input placeholder="Zip" value={formData.address.zipCode} onChange={(e) => handleInputChange('address.zipCode', e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required /></div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Account</Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Verify OTP</Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleResendOtp} disabled={isLoading}>Resend OTP</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;