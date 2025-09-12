import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../services/authService';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditProfileDialog from '../components/EditProfileDialog'; // Import the new dialog

const VendorProfile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  const user = profileData?.data;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <p>Error loading profile. Please try again later.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>No profile data available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">Name:</p>
            <p className="text-lg font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email:</p>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role:</p>
            <p className="text-lg font-medium capitalize">{user.role}</p>
          </div>
          {user.businessName && (
            <div>
              <p className="text-muted-foreground">Business Name:</p>
              <p className="text-lg font-medium">{user.businessName}</p>
            </div>
          )}
        </div>
      </div>

      {user.address && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Street:</p>
              <p className="text-lg font-medium">{user.address.street}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City:</p>
            <p className="text-lg font-medium">{user.address.city}</p>
            </div>
            <div>
              <p className="text-muted-foreground">State:</p>
              <p className="text-lg font-medium">{user.address.state}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Zip Code:</p>
              <p className="text-lg font-medium">{user.address.zipCode}</p>
            </div>
            {user.address.coords && (
              <>
                <div>
                  <p className="text-muted-foreground">Latitude:</p>
                  <p className="text-lg font-medium">{user.address.coords.lat}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Longitude:</p>
                  <p className="text-lg font-medium">{user.address.coords.lng}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {user && (
        <EditProfileDialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default VendorProfile;
