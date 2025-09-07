import { useQuery } from '@tanstack/react-query';
import { getOrderTracking, getOrderSummary } from '../services/orderService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';

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
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

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
                {mapError ? (
                  <p className="text-destructive">{mapError}</p>
                ) : center && center.lat && center.lng ? (
                  <MapContainer center={[center.lat, center.lng]} zoom={8} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {userLocation && userLocation.lat && userLocation.lng && (
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Tooltip>Your Location</Tooltip>
                      </Marker>
                    )}
                    {supplierLocation && supplierLocation.lat && supplierLocation.lng && (
                      <Marker position={[supplierLocation.lat, supplierLocation.lng]}>
                        <Tooltip>Supplier</Tooltip>
                      </Marker>
                    )}
                    {userLocation && userLocation.lat && userLocation.lng && supplierLocation && supplierLocation.lat && supplierLocation.lng && (
                      <Polyline positions={[[userLocation.lat, userLocation.lng], [supplierLocation.lat, supplierLocation.lng]]} color="blue" />
                    )}
                  </MapContainer>
                ) : <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>}
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