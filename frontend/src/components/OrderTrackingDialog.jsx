import { useQuery } from '@tanstack/react-query';
import { getOrderTracking } from '../services/orderService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2, CheckCircle, Clock } from 'lucide-react';

const OrderTrackingDialog = ({ orderId, isOpen, onClose }) => {
  const { data: trackingData, isLoading, isError } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId && isOpen,
  });
  const trackingInfo = trackingData?.data;

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