import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modifyOrder } from '../services/orderService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ModifyOrderDialog = ({ order, isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (order && user) {
      const participant = order.participants.find(p => p.user?._id === user._id);
      setQuantity(participant?.quantity || 0);
    }
  }, [order, user]);

  const { mutate: updateOrder, isPending } = useMutation({
    mutationFn: (newQuantity) => modifyOrder(order._id, newQuantity),
    onSuccess: () => {
      toast({ title: "Order Updated Successfully!" });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      onClose();
    },
    onError: (err) => toast({ title: "Error", description: err.response?.data?.msg, variant: "destructive" }),
  });

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-yellow-50"> {/* Added bg-yellow-50 class */}
        <DialogHeader>
          <DialogTitle>Modify Your Order</DialogTitle>
          <DialogDescription>Update your quantity for the {order.productId.name} group order.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="quantity">New Quantity ({order.productId.unit})</Label>
          <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} min={1} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => updateOrder(quantity)} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModifyOrderDialog;