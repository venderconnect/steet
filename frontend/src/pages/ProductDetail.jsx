import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../services/productService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, MapPin, Package } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: productData, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  const product = productData?.data;

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

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
                <p className="text-muted-foreground">
                  Pre-prepared: <span className="font-bold">{product.isPrepped ? 'Yes' : 'No'}</span>
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
                  {product.supplier.address?.coords && (
                    <p className="text-muted-foreground text-sm mt-1">
                      (Lat: {product.supplier.address.coords.lat}, Lng: {product.supplier.address.coords.lng})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Add more sections here if needed, e.g., reviews */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Reviews ({product.reviews.length})</h3>
                {/* Render reviews here */}
                <p className="text-muted-foreground">Average Rating: {product.averageRating?.toFixed(1)} / 5</p>
                {/* You might want to map through product.reviews to display individual reviews */}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
