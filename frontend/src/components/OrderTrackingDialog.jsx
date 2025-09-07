import { useQuery } from '@tanstack/react-query';
import { getOrderTracking, getOrderSummary } from '../services/orderService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import RoutingMachine from './RoutingMachine';

const OrderTrackingDialog = ({ orderId, isOpen, onClose }) => {
  const { data: trackingData, isLoading, isError } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId && isOpen,
  });
  const trackingInfo = trackingData?.data;
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['orderSummary', orderId],
    queryFn: () => getOrderSummary(orderId),
    enabled: !!orderId && isOpen,
  });

  const orderSummary = summaryData?.data;
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setMapError('Unable to determine your location');
        }
      );
    } else {
      setMapError('Geolocation not available');
    }
  }, [isOpen]);

  const supplierLocation = orderSummary?.supplierLocation;
  const center = supplierLocation || userLocation;

  const handleRouteFound = (summary) => {
    setRouteSummary(summary);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Track Order #{orderId?.substring(0, 8)}</DialogTitle>
          <DialogDescription>Status updates for your group order.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading || isLoadingSummary ? <div className="flex justify-center items-center h-64"><p>Loading map and tracking details...</p></div> :
           isError ? <p className="text-destructive text-center">Could not fetch tracking details.</p> :
           trackingInfo ? (
            <div className="space-y-4">
              <div className="h-64 mb-4 relative">
                {mapError ? (
                  <p className="text-destructive">{mapError}</p>
                ) : center && center.lat && center.lng ? (
                  <MapContainer center={[center.lat, center.lng]} zoom={8} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {userLocation && userLocation.lat && userLocation.lng && supplierLocation && supplierLocation.lat && supplierLocation.lng && (
                      <RoutingMachine start={[userLocation.lat, userLocation.lng]} end={[supplierLocation.lat, supplierLocation.lng]} onRouteFound={handleRouteFound} />
                    )}
                  </MapContainer>
                ) : <div className="flex justify-center items-center h-full"><p>Loading map and tracking details...</p></div>}
                {routeSummary && (
                  <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow-lg text-xs">
                    <p><b>Distance:</b> {(routeSummary.totalDistance / 1000).toFixed(2)} km</p>
                    <p><b>Estimated Time:</b> {Math.round(routeSummary.totalTime / 60)} minutes</p>
                  </div>
                )}
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
