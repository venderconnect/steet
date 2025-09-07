import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProducts } from '../services/productService';
import { getSupplierGroupOrders, approveOrder, rejectOrder } from '../services/orderService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, TrendingUp, Clock, Truck } from 'lucide-react';
import AddProductDialog from '@/components/AddProductDialog';
import OrderTrackingDialog from '@/components/OrderTrackingDialog'; // Import OrderTrackingDialog
import { useState } from 'react'; // Import useState

const SupplierDashboard = () => {
  const queryClient = useQueryClient();
  const [isTrackOpen, setIsTrackOpen] = useState(false); // State for tracking dialog
  const [selectedOrder, setSelectedOrder] = useState(null); // State for selected order

  const { data: productsData, isLoading: isLoadingProducts, isError: isProductsError } = useQuery({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });
  const myProducts = productsData?.data || [];

  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useQuery({
    queryKey: ['supplierGroupOrders'],
    queryFn: getSupplierGroupOrders,
  });
  const groupOrders = ordersData?.data || [];

  const approveMutation = useMutation({
    mutationFn: approveOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['supplierGroupOrders']);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['supplierGroupOrders']);
    },
  });

  const handleTrackClick = (order) => {
    setSelectedOrder(order);
    setIsTrackOpen(true);
  };

  const activeOrders = groupOrders.filter(order => order.status === 'open');
  const processingOrders = groupOrders.filter(order => order.status === 'completed' || order.status === 'approved');
  const totalRevenue = groupOrders
    .filter(order => order.status === 'completed' || order.status === 'delivered')
    .reduce((sum, order) => sum + (order.currentQty * (order.productId?.pricePerKg || 0)), 0);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and view incoming orders.</p>
        </div>
        <AddProductDialog />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoadingProducts ? <Loader2 className="h-6 w-6 animate-spin" /> : myProducts.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Group Orders</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : activeOrders.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Processing Orders</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : processingOrders.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div></CardContent></Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Group Orders</CardTitle>
              <CardDescription>Group orders created for your products.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
               isOrdersError ? <p className="text-destructive text-center py-4">Error loading orders.</p> :
               groupOrders.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Progress (Qty)</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {groupOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.productId?.name || 'N/A'}</TableCell>
                        <TableCell>{order.currentQty} / {order.targetQty} {order.productId?.unit}</TableCell>
                        <TableCell className="capitalize">{order.status}</TableCell>
                        <TableCell>
                          {order.status === 'open' && (
                            <div className="flex gap-2">
                              <button className="btn btn-sm btn-success" onClick={() => approveMutation.mutate(order._id)} disabled={approveMutation.isLoading}>
                                {approveMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                              </button>
                              <button className="btn btn-sm btn-ghost" onClick={() => rejectMutation.mutate(order._id)} disabled={rejectMutation.isLoading}>
                                {rejectMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                              </button>
                            </div>
                          )}
                          {order.status === 'approved' && ( // Add Track button for approved orders
                            <button className="btn btn-sm btn-info" onClick={() => handleTrackClick(order)}>
                              Track
                            </button>
                          )}
                          {approveMutation.isError && <p className="text-destructive text-xs">Error approving</p>}
                          {rejectMutation.isError && <p className="text-destructive text-xs">Error rejecting</p>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-center text-muted-foreground py-4">No group orders for your products yet.</p>}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>All products you have listed.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
               isProductsError ? <p className="text-destructive text-center py-4">Error loading products.</p> :
               myProducts.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {myProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">₹{product.pricePerKg}/{product.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-center text-muted-foreground py-4">You haven't added any products.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    {/* Order Tracking Dialog */}
      <OrderTrackingDialog 
        orderId={selectedOrder?._id} 
        isOpen={isTrackOpen} 
        onClose={() => setIsTrackOpen(false)} 
      />
    </div>
  );
};

export default SupplierDashboard;