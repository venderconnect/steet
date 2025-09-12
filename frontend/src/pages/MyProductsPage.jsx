import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyProducts } from '../services/productService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Pencil } from 'lucide-react'; // Import Pencil icon
import AddProductDialog from '@/components/AddProductDialog';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Import Button

const MyProductsPage = () => {
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const { data: productsData, isLoading: isLoadingProducts, isError: isProductsError } = useQuery({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });
  const myProducts = productsData?.data || [];

  const handleEditClick = (product) => {
    setProductToEdit(product);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground">Manage all products you have listed.</p>
        </div>
        <AddProductDialog isOpen={false} onClose={() => {}} /> {/* This is for adding new products, keep it as is */}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>All products you have listed.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isProductsError ? (
            <p className="text-destructive text-center py-4">Error loading products.</p>
          ) : myProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead> {/* New column for actions */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myProducts.map((product) => (
                  <TableRow key={product._id}> {/* Removed onClick from TableRow */}
                    <TableCell>
                      {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md" />}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">₹{product.pricePerKg}/{product.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p>You haven't added any products yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      {productToEdit && (
        <AddProductDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          productToEdit={productToEdit}
        />
      )}
    </div>
  );
};

export default MyProductsPage;
