import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct } from '../services/productService'; // Import updateProduct
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

const AddProductDialog = ({ isOpen, onClose, productToEdit }) => {
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
    image: null, // For new file upload
    imageUrl: '', // For existing image URL
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        pricePerKg: productToEdit.pricePerKg || '',
        category: productToEdit.category || '',
        unit: productToEdit.unit || 'kg',
        minOrderQty: productToEdit.minOrderQty || '',
        isPrepped: productToEdit.isPrepped || false,
        availableQty: productToEdit.availableQty || '',
        image: null, // No file selected initially for edit
        imageUrl: productToEdit.imageUrl || '', // Existing image URL
      });
    } else {
      // Reset form for add mode
      setFormData({ name: '', description: '', pricePerKg: '', category: '', unit: 'kg', minOrderQty: '', isPrepped: false, availableQty: '', image: null, imageUrl: '' });
    }
  }, [productToEdit]);

  const { mutate: submitProduct, isPending } = useMutation({
    mutationFn: (data) => {
      if (productToEdit) {
        return updateProduct(productToEdit._id, data);
      } else {
        return createProduct(data);
      }
    },
    onSuccess: (response) => {
      toast({
        title: productToEdit ? "Product Updated!" : "Product Added!",
        description: `${response.data.product?.name || response.data.name} is now available in the marketplace.`,
      });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Could not save the product.",
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
    setFormData(prev => ({ ...prev, image: file, imageUrl: URL.createObjectURL(file) })); // Store file and create preview URL
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('pricePerKg', formData.pricePerKg);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('unit', formData.unit);
    formDataToSend.append('minOrderQty', formData.minOrderQty);
    formDataToSend.append('isPrepped', formData.isPrepped);
    formDataToSend.append('availableQty', formData.availableQty);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    } else if (formData.imageUrl) { // If no new image, but existing imageUrl, send it
      formDataToSend.append('imageUrl', formData.imageUrl);
    }
    submitProduct(formDataToSend);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        {!productToEdit && (
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        )}
      </DialogTrigger>
  <DialogContent className="sm:max-w-[425px] bg-green-50"> {/* Added bg-green-50 class */}
        <DialogHeader>
          <DialogTitle>{productToEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {productToEdit ? "Make changes to your product details." : "Fill in the details below to list a new item in the marketplace."}
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
              {formData.imageUrl && !formData.image && (
                <img src={formData.imageUrl} alt="Current Product Image" className="mt-2 w-24 h-24 object-cover rounded-md" />
              )}
            </div>
          </div>
           <div className="flex items-center space-x-2">
            <Switch id="isPrepped" checked={formData.isPrepped} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="isPrepped">Is this a pre-prepared item? (e.g., batter)</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {productToEdit ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
