import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../services/productService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RouteMap from '../components/RouteMap';
import SupplierLocationMap from '../components/SupplierLocationMap';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import { useAuth } from '../context/AuthContext'; // Import useAuth
import JoinOrderDialog from '../components/JoinOrderDialog'; // Import JoinOrderDialog

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const [vendorLocation, setVendorLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false); // State for order dialog
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null); // State to hold product for order dialog

  // Determine if any dialog is open to disable map interaction
  const isAnyDialogOpen = isOrderDialogOpen; // Add other dialog states here if they exist

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVendorLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting vendor location:", error);
          setLocationError("Could not get your location. Route calculation is disabled.");
          setVendorLocation(null);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 } // Increased timeout
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const { data: productData, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  const product = productData?.data;
  const supplierCoords = product?.location || product?.supplier?.address?.coords;
  const isOwner = user?._id === product?.supplier?._id;

  // --- DEBUGGING LOGS ---
  console.log('ProductDetail: user', user);
  console.log('ProductDetail: product', product);
  console.log('ProductDetail: user._id', user?._id);
  console.log('ProductDetail: product.supplier._id', product?.supplier?._id);
  console.log('ProductDetail: isOwner', isOwner);
  // --- END DEBUGGING LOGS ---

  const handleChatClick = async () => {
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/conversations/${product.supplier._id}/${product._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      navigate(`/chat/${res.data.conversationId}`);
    } catch (err) {
      console.error('Error creating/getting conversation:', err);
      setChatError('Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleOrderClick = () => {
    setSelectedProductForOrder(product);
    setIsOrderDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">Error loading product details</h2>
        <p className="text-muted-foreground">{error.message || 'Product not found or an error occurred.'}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <p className="text-muted-foreground">The product you are looking for does not exist.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-lg">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-80 object-cover"
                />
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{product.category}</Badge>
                </div>
                <CardDescription className="text-lg mt-2">
                  {product.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Pricing & Quantity</h3>
                    <p className="text-muted-foreground">
                      Price: <span className="font-bold text-primary text-xl">₹{product.pricePerKg}</span> / {product.unit}
                    </p>
                    <p className="text-muted-foreground">
                      Min. Order Quantity: <span className="font-bold">{product.minOrderQty}</span> {product.unit}
                    </p>
                    <p className="text-muted-foreground">
                      Available Stock: <span className="font-bold">{product.availableQty}</span> {product.unit}
                    </p>
                  </div>
                  {product.supplier && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Supplier Information</h3>
                      <p className="text-muted-foreground">
                        Supplier: <Link to={`/suppliers/${product.supplier._id}`} className="text-primary underline font-bold">
                          {product.supplier.businessName || product.supplier.name}
                        </Link>
                      </p>
                      {product.supplier.address && (
                        <p className="text-muted-foreground flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {product.supplier.address.street}, {product.supplier.address.city}, {product.supplier.address.state} - {product.supplier.address.zipCode}
                        </p>
                      )}
                      {supplierCoords && (
                        <p className="text-muted-foreground text-sm mt-1">
                          (Lat: {supplierCoords.lat}, Lng: {supplierCoords.lng})
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {user?.role !== 'supplier' && product.supplier && (
                  <div className="mt-6 flex gap-2">
                    <Button onClick={handleChatClick} className="w-full" disabled={chatLoading}>
                      {chatLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : ''}Chat with Supplier
                    </Button>
                    <Button onClick={handleOrderClick} className="w-full">
                      Order
                    </Button>
                    {chatError && <p className="text-destructive text-sm mt-2">{chatError}</p>}
                  </div>
                )}

                {product.reviews && product.reviews.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Reviews ({product.reviews.length})</h3>
                    <p className="text-muted-foreground">Average Rating: {product.averageRating?.toFixed(1)} / 5</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle>Supplier Location & Route</CardTitle>
                <CardDescription>Find your way to the supplier.</CardDescription>
              </CardHeader>
              <CardContent>
                {supplierCoords ? (
                  <>
                    {locationError ? (
                      <p className="text-destructive text-sm mb-2">
                        {locationError}
                      </p>
                    ) : user?.role === 'supplier' && isOwner ? (
                      <SupplierLocationMap
                        supplierCoords={supplierCoords}
                        isDialogOpen={isAnyDialogOpen} // Pass the state
                      />
                    ) : user?.role === 'supplier' && !isOwner && vendorLocation ? (
                      <RouteMap
                        vendorCoords={vendorLocation}
                        supplierCoords={supplierCoords}
                        isDialogOpen={isAnyDialogOpen} // Pass the state
                        userRole={user?.role} // Pass user role
                      />
                    ) : vendorLocation ? (
                      <RouteMap
                        vendorCoords={vendorLocation}
                        supplierCoords={supplierCoords}
                        isDialogOpen={isAnyDialogOpen} // Pass the state
                        userRole={user?.role} // Pass user role
                      />
                    ) : (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="ml-2 text-muted-foreground">Getting your location...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 font-semibold">Location Not Available</h3>
                    {isOwner ? (
                      <>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Add your location to show it on the map for customers.
                        </p>
                        <Button asChild className="mt-4">
                          <Link to="/supplier-profile-page">Set Location</Link>
                        </Button>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        This supplier has not set their location yet.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {selectedProductForOrder && (
        <JoinOrderDialog
          product={selectedProductForOrder}
          isOpen={isOrderDialogOpen}
          onClose={() => setIsOrderDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
