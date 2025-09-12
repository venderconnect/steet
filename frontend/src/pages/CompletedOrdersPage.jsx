import { useQuery } from '@tanstack/react-query';
import { getSupplierGroupOrders } from '../services/orderService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const CompletedOrdersPage = () => {
  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useQuery({
    queryKey: ['supplierGroupOrders'],
    queryFn: getSupplierGroupOrders,
  });
  const groupOrders = ordersData?.data || [];
  const completedOrders = groupOrders.filter(order => order.status === 'completed' || order.status === 'delivered');

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>All Completed Orders</CardTitle>
          <CardDescription>Here are all the group orders that have been successfully delivered.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
           isOrdersError ? <p className="text-destructive text-center py-4">Error loading orders.</p> : 
           completedOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedOrders.map((order) => (
                  order.participants.map(participant => (
                    <TableRow key={`${order._id}-${participant.user?._id}`}>
                      <TableCell className="font-medium">{order.productId?.name || 'N/A'}</TableCell>
                      <TableCell>{participant.user ? participant.user.name : 'N/A'}</TableCell>
                      <TableCell>{participant.user && participant.user.address ? [participant.user.address.street, participant.user.address.city, participant.user.address.zipCode].filter(Boolean).join(', ') : 'N/A'}</TableCell>
                      <TableCell>{participant.quantity} {order.productId?.unit}</TableCell>
                      <TableCell className="capitalize">{order.status}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-center text-muted-foreground py-4">No completed orders yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedOrdersPage;
