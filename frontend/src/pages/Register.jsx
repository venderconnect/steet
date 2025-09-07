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
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
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
    const { confirmPassword, ...userData } = formData;
    const success = await register(userData);
    if (!success) setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader><CardTitle>Create Account</CardTitle><CardDescription>Join our network of vendors and suppliers.</CardDescription></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
