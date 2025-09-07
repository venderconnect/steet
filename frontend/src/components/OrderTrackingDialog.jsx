import { useQuery } from '@tanstack/react-query';
import { getOrderTracking, getOrderSummary } from '../services/orderService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const OrderTrackingDialog = ({ orderId, isOpen, onClose }) => {
  const { data: trackingData, isLoading, isError } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId && isOpen,
  });
  const trackingInfo = trackingData?.data;
  const { data: summaryData } = useQuery({
    queryKey: ['orderSummary', orderId],
    queryFn: () => getOrderSummary(orderId),
    enabled: !!orderId && isOpen,
  });

  const orderSummary = summaryData?.data;
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!isOpen || !orderSummary) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError('Google Maps API key not configured');
      return;
    }

    let cancelled = false;
  // dynamic import the loader to avoid static module resolution errors in some environments
  import('../lib/loadGoogleMaps.js').then(mod => mod.default(apiKey)).then(() => {
      if (cancelled) return;
      const map = new window.google.maps.Map(mapRef.current, { center: { lat: 20.5937, lng: 78.9629 }, zoom: 8 });

      // vendor location: try current browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const vendorPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const supplierPos = orderSummary.supplierLocation;
          new window.google.maps.Marker({ position: vendorPos, map, title: 'Your location' });
          if (supplierPos) new window.google.maps.Marker({ position: supplierPos, map, title: 'Supplier' });

          if (supplierPos) {
            const directionsService = new window.google.maps.DirectionsService();
            const directionsRenderer = new window.google.maps.DirectionsRenderer({ map });
            directionsService.route({ origin: vendorPos, destination: supplierPos, travelMode: window.google.maps.TravelMode.DRIVING, provideRouteAlternatives: true }, (result, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(result);
                // Optionally display ETA and distance
                const leg = result.routes[0].legs[0];
                const info = `${leg.distance.text} • ${leg.duration.text}`;
                const infoDiv = document.createElement('div');
                infoDiv.textContent = info;
                infoDiv.className = 'p-2 bg-white rounded shadow';
                map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(infoDiv);
              } else {
                setMapError('Directions request failed: ' + status);
              }
            });
          }
        }, () => {
          setMapError('Unable to determine your location');
        });
      } else {
        setMapError('Geolocation not available');
      }
  }).catch(err => setMapError(err.message));

    return () => { cancelled = true; };
  }, [isOpen, orderSummary]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Track Order #{orderId?.substring(0, 8)}</DialogTitle>
          <DialogDescription>Status updates for your group order.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div> :
           isError ? <p className="text-destructive text-center">Could not fetch tracking details.</p> :
           trackingInfo ? (
            <div className="space-y-4">
              <div className="h-64 mb-4">
                {mapError ? <p className="text-destructive">{mapError}</p> : <div ref={mapRef} style={{ height: '100%', width: '100%' }} />}
              </div>
              <ul className="space-y-4">
                {trackingInfo.events.map((event, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div>
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                        {event.status.includes('Confirmed') ? <CheckCircle className="text-primary"/> : <Clock className="text-muted-foreground"/>}
                      </div>
                    </div>
                    <div>
                        <p className="font-semibold">{event.status}</p>
                        <p className="text-sm text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
           ) : <p className="text-center">No tracking information available.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingDialog;