import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct } from '../services/productService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';

const categories = ["Vegetables", "Grains", "Oils", "Spices", "Dairy", "Pulses", "Prepared", "Other"];
const units = ["kg", "litre", "piece", "packet", "box"];

const AddProductDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerKg: '',
    category: '',
    unit: 'kg',
    minOrderQty: '',
    isPrepped: false,
    availableQty: '',
    image: null,
  });

  const { mutate: addProduct, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      toast({
        title: "Product Added!",
        description: `${newProduct.data.name} is now available in the marketplace.`,
      });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      setIsOpen(false);
      // Reset form for next time
      setFormData({ name: '', description: '', pricePerKg: '', category: '', unit: 'kg', minOrderQty: '', isPrepped: false, availableQty: '', image: null });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Could not add the product.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked) => {
      setFormData(prev => ({ ...prev, isPrepped: checked }));
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      pricePerKg: parseFloat(formData.pricePerKg),
      minOrderQty: parseInt(formData.minOrderQty, 10),
      availableQty: formData.availableQty ? parseInt(formData.availableQty, 10) : 0,
      image: formData.image || null,
    };
    addProduct(productData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </DialogTrigger>
  <DialogContent className="sm:max-w-[425px] bg-white text-black dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to list a new item in the marketplace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerKg">Price (per unit)</Label>
              <Input id="pricePerKg" name="pricePerKg" type="number" value={formData.pricePerKg} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <select id="unit" name="unit" value={formData.unit} onChange={handleChange} className="w-full h-10 border rounded-md px-2">
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full h-10 border rounded-md px-2" required>
                <option value="" disabled>Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrderQty">Min. Order Qty</Label>
              <Input id="minOrderQty" name="minOrderQty" type="number" value={formData.minOrderQty} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availableQty">Available Quantity</Label>
              <Input id="availableQty" name="availableQty" type="number" value={formData.availableQty} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" onChange={handleFile} />
            </div>
          </div>
           <div className="flex items-center space-x-2">
            <Switch id="isPrepped" checked={formData.isPrepped} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="isPrepped">Is this a pre-prepared item? (e.g., batter)</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
