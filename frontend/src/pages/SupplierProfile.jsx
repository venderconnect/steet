import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupplierProfile } from '../services/productService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Basic haversine distance in kilometers
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fix default marker icon issue in many bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SupplierProfile = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['supplierProfile', id],
    queryFn: () => getSupplierProfile(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isError || !data) return <div className="text-center p-8 text-destructive">Unable to load supplier profile.</div>;

  const { supplier, products, averageRating } = data.data;

  // Vendor location: prefer logged-in user's saved address coords; fall back to supplier's coords as placeholder
  let vendorCoords = null;
  try {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    vendorCoords = savedUser?.address?.coords ? [savedUser.address.coords.lat, savedUser.address.coords.lng] : null;
  } catch (e) { vendorCoords = null; }

  const supplierCoords = supplier.address?.coords ? [supplier.address.coords.lat, supplier.address.coords.lng] : null;
  const center = supplierCoords || vendorCoords || [20.5937, 78.9629]; // default to India center if nothing
  const distanceKm = (vendorCoords && supplierCoords) ? haversineDistance(vendorCoords, supplierCoords) : null;

  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Initialize map
    const map = L.map(mapRef.current).setView(center, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (vendorCoords) {
      L.marker(vendorCoords).addTo(map).bindPopup('Your location');
    }
    if (supplierCoords) {
      L.marker(supplierCoords).addTo(map).bindPopup(supplier.businessName || supplier.name);
    }
    if (vendorCoords && supplierCoords) {
      L.polyline([vendorCoords, supplierCoords], { color: 'blue' }).addTo(map);
      const bounds = L.latLngBounds([vendorCoords, supplierCoords]);
      map.fitBounds(bounds.pad(0.5));
    } else {
      map.setView(center, 6);
    }

    return () => {
      map.remove();
    };
  }, [mapRef, center, vendorCoords, supplierCoords]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{supplier.businessName || supplier.name}</CardTitle>
          <CardDescription>{supplier.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{supplier.address?.street}, {supplier.address?.city}, {supplier.address?.state} - {supplier.address?.zipCode}</p>
          <p className="mt-2">Average Product Rating: <strong>{averageRating ? averageRating.toFixed(2) : 'N/A'}</strong></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>All products listed by this supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Map section */}
          <div className="mb-6 h-64">
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            {distanceKm !== null && <p className="text-sm mt-2">Distance from you: <strong>{distanceKm.toFixed(2)} km</strong></p>}
          </div>
          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>₹{p.pricePerKg}/{p.unit}</TableCell>
                    <TableCell>{p.category}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No products listed by this supplier.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierProfile;
