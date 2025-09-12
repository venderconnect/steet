import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProducts } from '../services/productService';
import { getSupplierGroupOrders, approveOrder, rejectOrder, markOrderAsDelivered, getSupplierAnalytics } from '../services/orderService';
import { getProfile } from '../services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, TrendingUp, Clock, Truck, BarChart, Star } from 'lucide-react';
import AddProductDialog from '@/components/AddProductDialog';
import OrderTrackingDialog from '@/components/OrderTrackingDialog';
import { useState } from 'react';
import MonthlyRevenueChart from '@/components/MonthlyRevenueChart';
import TopProductsList from '@/components/TopProductsList';

const SupplierDashboard = () => {
  const queryClient = useQueryClient();
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });
  const myProducts = productsData?.data || [];

  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useQuery({
    queryKey: ['supplierGroupOrders'],
    queryFn: getSupplierGroupOrders,
  });
  const groupOrders = ordersData?.data || [];

  const { data: userProfileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });
  const userRevenue = userProfileData?.data?.revenue || 0;

  const { data: analyticsData, isLoading: isLoadingAnalytics, isError: isAnalyticsError } = useQuery({
    queryKey: ['supplierAnalytics'],
    queryFn: getSupplierAnalytics,
  });

  const approveMutation = useMutation({
    mutationFn: approveOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierGroupOrders'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierGroupOrders'] });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: markOrderAsDelivered,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierGroupOrders'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['supplierAnalytics'] });
    },
    onError: (error) => {
      console.error("Error marking order as delivered:", error);
    }
  });

  const handleTrackClick = (order) => {
    setSelectedOrder(order);
    setIsTrackOpen(true);
  };

  const activeOrders = groupOrders.filter(order => order.status === 'open');
  const processingOrders = groupOrders.filter(order => order.status === 'approved');
  const incomingGroupOrders = groupOrders.filter(order => order.status === 'open' || order.status === 'approved');
  const completedOrders = groupOrders.filter(order => order.status === 'completed' || order.status === 'delivered');
  const top5CompletedOrders = completedOrders.slice(0, 5);

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
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{isLoadingProfile ? <Loader2 className="h-6 w-6 animate-spin" /> : userRevenue.toLocaleString()}</div></CardContent></Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Group Orders</CardTitle>
              <CardDescription>Group orders that are open or in processing.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
               isOrdersError ? <p className="text-destructive text-center py-4">Error loading orders.</p> :
               incomingGroupOrders.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Progress (Qty)</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {incomingGroupOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.productId?.name || 'N/A'}</TableCell>
                        <TableCell>{order.currentQty} / {order.targetQty} {order.productId?.unit}</TableCell>
                        <TableCell className="capitalize">{order.status}</TableCell>
                        <TableCell>
                          {order.status === 'open' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approveMutation.mutate(order._id)} disabled={approveMutation.isPending}>
                                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => rejectMutation.mutate(order._id)} disabled={rejectMutation.isPending}>
                                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                              </Button>
                            </div>
                          )}
                          {order.status === 'approved' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleTrackClick(order)}>
                                Track
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deliverMutation.mutate(order._id)}
                                disabled={deliverMutation.isPending}
                              >
                                {deliverMutation.isPending ? <Loader2 className="h-4 w-6 animate-spin" /> : 'Delivered'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-center text-muted-foreground py-4">No incoming group orders for your products yet.</p>}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>View and manage all products you have listed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center h-full">
                <Link to="/my-products">
                  <Button>Go to My Products</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>Group orders that have been successfully delivered.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
               isOrdersError ? <p className="text-destructive text-center py-4">Error loading orders.</p> : 
               completedOrders.length > 0 ? (
                <>
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
                      {top5CompletedOrders.map((order) => (
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
                  {completedOrders.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link to="/completed-orders">
                        <Button variant="link">More Delivered Orders</Button>
                      </Link>
                    </div>
                  )}
                </>
              ) : <p className="text-center text-muted-foreground py-4">No completed orders yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
               isAnalyticsError ? <p className="text-destructive text-center py-4">Error loading analytics.</p> : 
               <MonthlyRevenueChart data={analyticsData?.data?.monthlyRevenue || []} />}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          {isLoadingAnalytics ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> :
           isAnalyticsError ? <p className="text-destructive text-center py-4">Error loading analytics.</p> : 
           <TopProductsList data={analyticsData?.data?.topProducts || []} />}
        </div>
      </div>

      <OrderTrackingDialog 
        orderId={selectedOrder?._id} 
        isOpen={isTrackOpen} 
        onClose={() => setIsTrackOpen(false)} 
      />
    </div>
  );
};

export default SupplierDashboard;