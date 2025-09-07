import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyGroupOrders } from '../services/orderService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { Loader2, Truck, Boxes, Star } from 'lucide-react';
import ModifyOrderDialog from '@/components/ModifyOrderDialog';
import OrderTrackingDialog from '@/components/OrderTrackingDialog';
import ReviewDialog from '@/components/ReviewDialog';
import { toast } from '../hooks/use-toast';

const Orders = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['myOrders'],
    queryFn: getMyGroupOrders,
  });
  const orders = ordersData?.data || [];

  const handleModifyClick = (order) => {
    setSelectedOrder(order);
    setIsModifyOpen(true);
  };

  const handleTrackClick = (order) => {
    if (order.status === 'open') {
      toast({ title: "Waiting for supplier approval" });
    } else {
      setSelectedOrder(order);
      setIsTrackOpen(true);
    }
  };
  
  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setIsReviewOpen(true);
  };

  const OrderCard = ({ order }) => {
    const progress = (order.currentQty / order.targetQty) * 100;
    const userContribution = order.participants.find(p => p.user._id === user._id);

    const statusText = order.status === 'open' ? 'Waiting for Supplier Approval' : order.status;

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{order.productId.name}</CardTitle>
            <Badge variant="outline" className="capitalize">{statusText}</Badge>
          </div>
          <CardDescription>Order ID: {order._id.substring(0, 8)}...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Order Progress</span>
              <span>{order.currentQty}/{order.targetQty} {order.productId.unit}</span>
            </div>
            <Progress value={progress} />
          </div>
          {userContribution && (
            <div className="bg-muted/50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm flex items-center"><Boxes className="w-4 h-4 mr-2" />Your Contribution</span>
                <span className="font-bold text-lg">{userContribution.quantity} {order.productId.unit}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {order.status === 'completed' ? (
              <Button size="sm" onClick={() => handleReviewClick(order)}>
                <Star className="w-4 h-4 mr-2" />Rate Product
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleTrackClick(order)}>
                <Truck className="w-4 h-4 mr-2" />Track
              </Button>
            )}
            
            {order.status === 'open' && (
              <Button size="sm" onClick={() => handleModifyClick(order)}>Modify</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isError) return <div className="text-center py-12 text-destructive">Error fetching your orders.</div>;

  const activeOrders = orders.filter(o => o.status === 'open');
  const processingOrders = orders.filter(o => o.status === 'approved' || o.status === 'processing');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track, manage, and review your group orders.</p>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({processingOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div> :
           activeOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {activeOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
           ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>You have no active group orders.</p></div>
           )
          }
        </TabsContent>
        <TabsContent value="processing" className="mt-4">
           {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div> :
           processingOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {processingOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
           ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>No orders are currently being processed.</p></div>
           )
          }
        </TabsContent>
         <TabsContent value="completed" className="mt-4">
           {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div> :
           completedOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {completedOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
           ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>No orders have been completed yet.</p></div>
           )
          }
        </TabsContent>
      </Tabs>

      {/* All dialogs are now included */}
      <ModifyOrderDialog 
        order={selectedOrder} 
        isOpen={isModifyOpen} 
        onClose={() => setIsModifyOpen(false)} 
      />
      <OrderTrackingDialog 
        orderId={selectedOrder?._id} 
        isOpen={isTrackOpen} 
        onClose={() => setIsTrackOpen(false)} 
      />
      <ReviewDialog
        product={selectedOrder?.productId}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />
    </div>
  );
};

export default Orders;
