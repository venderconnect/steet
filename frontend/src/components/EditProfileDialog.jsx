import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';

const EditProfileDialog = ({ isOpen, onClose, currentUser }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        businessName: currentUser.businessName || currentUser.companyName || '',
        address: {
          street: currentUser.address?.street || '',
          city: currentUser.address?.city || '',
          state: currentUser.address?.state || '',
          zipCode: currentUser.address?.zipCode || '',
        },
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      queryClient.invalidateQueries(['userProfile']);
      // Update local storage user data if email was changed
      if (data.user && data.user.email !== authUser.email) {
        const updatedUser = { ...authUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Profile Update Failed',
        description: error.response?.data?.msg || 'An error occurred while updating your profile.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty address fields if they are not required
    const addressToSend = Object.fromEntries(Object.entries(formData.address).filter(([, value]) => value !== ''));
    
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      businessName: formData.businessName,
      address: addressToSend,
    };

    // Remove fields that are empty strings or not applicable to the user's role
    if (authUser.role === 'vendor') {
      delete dataToSend.businessName;
    } else if (authUser.role === 'supplier') {
      delete dataToSend.name;
      dataToSend.companyName = dataToSend.businessName; // Backend expects companyName for supplier
      delete dataToSend.businessName;
    }

    updateProfileMutation.mutate(dataToSend);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-blue-50"> {/* Added bg-blue-50 class */}
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {authUser.role === 'vendor' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
            </div>
          )}
          {authUser.role === 'supplier' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessName" className="text-right">Business Name</Label>
              <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} className="col-span-3" />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="street" className="text-right">Street</Label>
            <Input id="street" name="address.street" value={formData.address.street} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">City</Label>
            <Input id="city" name="address.city" value={formData.address.city} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="state" className="text-right">State</Label>
            <Input id="state" name="address.state" value={formData.address.state} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="zipCode" className="text-right">Zip Code</Label>
            <Input id="zipCode" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;