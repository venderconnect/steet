import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupplierProfile } from '../services/productService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateSupplierCoords } from '../services/productService';

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

// (Switched to Google Maps; removed Leaflet assets)

const SupplierProfile = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['supplierProfile', id],
    queryFn: () => getSupplierProfile(id),
    enabled: !!id,
  });
  // compute some values that the effect and UI will use; safe when data is undefined
  const { supplier, products, averageRating } = data?.data || { supplier: null, products: [], averageRating: 0 };

  // Vendor location: prefer logged-in user's saved address coords; fall back to supplier's coords as placeholder
  let vendorCoords = null;
  try {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    vendorCoords = savedUser?.address?.coords ? [savedUser.address.coords.lat, savedUser.address.coords.lng] : null;
  } catch (e) { vendorCoords = null; }

  const supplierCoords = supplier?.address?.coords ? [supplier.address.coords.lat, supplier.address.coords.lng] : null;
  const center = supplierCoords || vendorCoords || [20.5937, 78.9629]; // default to India center if nothing
  const distanceKm = (vendorCoords && supplierCoords) ? haversineDistance(vendorCoords, supplierCoords) : null;

  const mapRef = useRef(null);
  const queryClient = useQueryClient();

  const [geoError, setGeoError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleUseMyLocation = () => {
    setGeoError(null);
    setSaveError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try {
        setSaving(true);
        await updateSupplierCoords(id, coords);
        await queryClient.invalidateQueries(['supplierProfile', id]);
      } catch (err) {
        setSaveError(err.response?.data?.msg || err.message || 'Failed to save coordinates');
      } finally {
        setSaving(false);
      }
    }, (err) => {
      setGeoError(err.message || 'Failed to get location');
    });
  };

  useEffect(() => {
    if (!mapRef.current || !supplier) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY is not set. Google Maps will not load.');
      return;
    }

    // load google maps script if not present
    const existing = document.getElementById('google-maps-script');
    const createMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: 10,
      });

      const markers = [];
      if (vendorCoords) {
        markers.push(new window.google.maps.Marker({ position: { lat: vendorCoords[0], lng: vendorCoords[1] }, map, title: 'Your location' }));
      }
      if (supplierCoords) {
        markers.push(new window.google.maps.Marker({ position: { lat: supplierCoords[0], lng: supplierCoords[1] }, map, title: supplier.businessName || supplier.name }));
      }

      if (vendorCoords && supplierCoords) {
        const path = [ { lat: vendorCoords[0], lng: vendorCoords[1] }, { lat: supplierCoords[0], lng: supplierCoords[1] } ];
        const line = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: '#0000FF', strokeOpacity: 1.0, strokeWeight: 2 });
        line.setMap(map);
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach(p => bounds.extend(p));
        map.fitBounds(bounds);
      }
    };

    if (!existing) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = createMap;
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    } else {
      createMap();
    }
  }, [mapRef, center, vendorCoords, supplierCoords, supplier]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (isError || !data) return <div className="text-center p-8 text-destructive">Unable to load supplier profile.</div>;

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
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="btn btn-sm" onClick={handleUseMyLocation} disabled={saving}>
                {saving ? 'Saving...' : 'Use my location'}
              </button>
              {saveError && <span className="text-destructive">{saveError}</span>}
              {geoError && <span className="text-destructive">{geoError}</span>}
            </div>
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
