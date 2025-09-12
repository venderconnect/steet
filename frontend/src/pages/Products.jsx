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
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

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
  const [minPrice, setMinPrice] = useState(''); // NEW: Min price filter
  const [maxPrice, setMaxPrice] = useState(''); // NEW: Max price filter
  const [minRating, setMinRating] = useState('none'); // NEW: Min rating filter, default to 'none'
  const [sortBy, setSortBy] = useState('none'); // NEW: Sort by option, default to 'none'
  const [sortOrder, setSortOrder] = useState('asc'); // NEW: Sort order option

  const navigate = useNavigate(); // Initialize useNavigate
  const { user } = useAuth(); // Get current user

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
    queryKey: ['products', { prepared: showPreparedOnly, search: searchTerm, minPrice, maxPrice, minRating, sortBy, sortOrder }],
    queryFn: () => {
      const params = {
        prepared: showPreparedOnly,
        search: searchTerm,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minRating: minRating === 'none' ? undefined : minRating, // Don't send if 'none'
        sortBy: sortBy === 'none' ? undefined : sortBy, // Don't send if 'none'
        sortOrder: sortBy === 'none' ? undefined : sortOrder, // Only send sortOrder if sortBy is not 'none'
      };
      return getProducts(params);
    },
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
    // Category filter is now applied after fetching, as backend handles other filters
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesCategory;
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

          {/* NEW: Price Range Filter */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-32"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-32"
            />
          </div>

          {/* NEW: Min Rating Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Min. Supplier Rating:</span>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NEW: Sorting Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort By:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
            {sortBy !== 'none' && (
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            )}
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
                      {typeof product.distance === 'number' && product.distance != null && !isNaN(product.distance) && isFinite(product.distance) && userLocation && (
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
                {(!user || user.role !== 'supplier') && (
                  <CardContent className="pt-0">
                    <Button className="w-full" onClick={() => { handleJoinOrder(product); }}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Join/Create Group Order
                    </Button>
                  </CardContent>
                )}
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
