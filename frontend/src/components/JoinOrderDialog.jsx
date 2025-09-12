import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyGroupOrders, joinGroupOrder, createGroupOrder } from '../services/orderService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Loader2, IndianRupee, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JoinOrderDialog = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(product?.minOrderQty || 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['groupOrders', product?._id],
    queryFn: async () => {
        if (!product) return [];
        // In a real app, you would fetch orders for just this product
        // For now, we fetch all and filter.
        const res = await getMyGroupOrders();
        return (res.data || []).filter(o => o.productId._id === product._id && o.status === 'open');
    },
    enabled: !!product && isOpen, // Only fetch when dialog is open for a product
  });
  const existingOrders = ordersData || [];

  const { mutate: join, isPending: isJoining } = useMutation({
    mutationFn: ({ orderId, qty }) => joinGroupOrder(orderId, qty),
    onSuccess: (response) => {
      toast({ title: response.data.msg || "Successfully joined order!" });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['groupOrders', product?._id] });
      onClose();
    },
    onError: (err) => toast({ title: "Error joining order", description: err.response?.data?.msg || "An unexpected error occurred.", variant: "destructive" }),
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: ({ productId, qty }) => createGroupOrder(productId, 100, qty), // Target Qty is hardcoded
    onSuccess: (response) => {
        toast({ title: response.data.msg || "New group order created!" });
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
        queryClient.invalidateQueries({ queryKey: ['groupOrders', product?._id] });
        onClose();
    },
    onError: (err) => toast({ title: "Error creating order", description: err.response?.data?.msg || "An unexpected error occurred.", variant: "destructive" }),
  });

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-green-50 z-50"> {/* Added z-50 class */}
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>Join an existing group buy or start a new one.</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left side: Order details and quantity */}
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Your Order</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity ({product.unit})</Label>
                            <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} min={product.minOrderQty} />
                         </div>
                         <div className="bg-muted p-4 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                            <p className="text-2xl font-bold flex items-center justify-center"><IndianRupee className="w-5 h-5 mr-1" />{(quantity * product.pricePerKg).toLocaleString()}</p>
                         </div>
                    </CardContent>
                </Card>
                 <Button onClick={() => create({ productId: product._id, qty: quantity })} disabled={isCreating || quantity < product.minOrderQty} className="w-full">
                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create New Group Order
                </Button>
            </div>

            {/* Right side: Existing orders */}
            <div className="space-y-4">
                <h3 className="font-semibold">Join an Existing Order</h3>
                {isLoadingOrders ? <Loader2 className="animate-spin" /> :
                existingOrders.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {existingOrders.map(order => (
                            <Card key={order._id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Order #{order._id.substring(0,6)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Progress value={(order.currentQty / order.targetQty) * 100} />
                                        <div className="flex justify-between text-sm">
                                            <span>{order.currentQty}/{order.targetQty} {order.productId.unit}</span>
                                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" />{order.participants.length}</span>
                                        </div>
                                    </div>
                                    <Button onClick={() => join({ orderId: order._id, qty: quantity })} disabled={isJoining || quantity < product.minOrderQty} size="sm" className="w-full mt-4">
                                        {isJoining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Join this Order
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No open group orders for this product. Be the first to create one!</p>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinOrderDialog;
