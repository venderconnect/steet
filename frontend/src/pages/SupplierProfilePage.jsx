import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../services/authService';
import { getMyProducts } from '../services/productService';
import { Loader2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SupplierProfilePage = () => {
  const { data: profileData, isLoading: isLoadingProfile, isError: isErrorProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  const { data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts } = useQuery({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });

  const user = profileData?.data;
  const myProducts = productsData?.data || [];

  if (isLoadingProfile || isLoadingProducts) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p>Loading profile and products...</p>
      </div>
    );
  }

  if (isErrorProfile || isErrorProducts) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <p>Error loading profile or products. Please try again later.</p>
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
      <h1 className="text-3xl font-bold mb-6">My Supplier Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Details about your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {user.address && (
            <Card className="shadow-md mt-6">
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>Your registered address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>All products you have listed.</CardDescription>
            </CardHeader>
            <CardContent>
              {myProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md" />}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">₹{product.pricePerKg}/{product.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't added any products yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfilePage;