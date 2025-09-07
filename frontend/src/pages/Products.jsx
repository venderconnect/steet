import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/productService';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, IndianRupee, Loader2, Package, MapPin } from 'lucide-react';
import JoinOrderDialog from '@/components/JoinOrderDialog';

const categories = ['All', 'Vegetables', 'Grains', 'Oils', 'Spices', 'Dairy', 'Pulses'];

// Helper function to calculate distance between two lat/lng points (Haversine formula)
const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371; // Radius of Earth in kilometers

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPreparedOnly, setShowPreparedOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // NEW: User's current location
  const [locationEnabled, setLocationEnabled] = useState(false); // NEW: Toggle for location filtering

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (locationEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Optionally, inform the user that location could not be retrieved
          setUserLocation(null);
          setLocationEnabled(false); // Disable if error
        }
      );
    } else if (!locationEnabled) {
      setUserLocation(null);
    }
  }, [locationEnabled]);

  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['products', { prepared: showPreparedOnly }],
    queryFn: () => getProducts({ prepared: showPreparedOnly }),
  });
  let products = productsData?.data || [];

  // NEW: Sort products by distance if location is enabled and available
  if (locationEnabled && userLocation) {
    products = products.map(product => {
      const supplierCoords = product.supplier?.address?.coords;
      if (supplierCoords) {
        const distance = haversineDistance(userLocation, supplierCoords);
        return { ...product, distance };
      }
      return { ...product, distance: Infinity }; // Products without coords go to the end
    }).sort((a, b) => a.distance - b.distance);
  }

  const filteredProducts = products.filter(product => {
    const supplierName = product.supplier?.name || '';
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoinOrder = (product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  if (isError) {
    return <div className="text-center py-12 text-destructive">Error fetching products.</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Products</h1>
          <p className="text-muted-foreground">Find quality raw materials from verified suppliers.</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by product or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
            <Button
              key="prepared"
              variant={showPreparedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPreparedOnly(v => !v)}
            >
              Prepared Hub
            </Button>
            {/* NEW: Location Filter Button */}
            <Button
              variant={locationEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLocationEnabled(v => !v)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {locationEnabled ? 'Location Filter ON' : 'Location Filter OFF'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card className="hover:shadow-lg transition-shadow flex flex-col h-full" key={product._id}>
                <Link to={`/products/${product._id}`} className="block">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <CardDescription>
                      by {product.supplier ? (
                        <span
                          className="text-primary underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent click from propagating to the outer Link
                            navigate(`/suppliers/${product.supplier._id}`);
                          }}
                        >
                          {product.supplier.businessName || product.supplier.name}
                        </span>
                      ) : 'Unknown'}
                      {product.distance !== Infinity && userLocation && (
                        <span className="ml-2 text-xs text-muted-foreground">({product.distance.toFixed(1)} km)</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline space-x-1">
                        <IndianRupee className="w-4 h-4 text-primary" />
                        <span className="text-2xl font-bold text-primary">{product.pricePerKg}</span>
                        <span className="text-muted-foreground">/{product.unit}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Min. Order</div>
                        <div className="font-semibold">{product.minOrderQty} {product.unit}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex-grow">{product.description}</p>
                  </CardContent>
                </Link>
                <CardContent className="pt-0">
                  <Button className="w-full" onClick={() => { handleJoinOrder(product); }}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Join/Create Group Order
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
      
      {/* The JoinOrderDialog component will be rendered here */}
      
      <JoinOrderDialog
        product={selectedProduct}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
     
    </div>
  );
};

export default Products;