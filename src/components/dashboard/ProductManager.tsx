import { useState } from 'react';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Store, 
  Product, 
  useStoreProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductManagerProps {
  store: Store;
}

export function ProductManager({ store }: ProductManagerProps) {
  const { data: products, isLoading } = useStoreProducts(store.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageUrl('');
    setEditingProduct(null);
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setImageUrl(product.image_url || '');
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !price) {
      toast.error('Name and price are required');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name,
          description: description || null,
          price: priceNum,
          image_url: imageUrl || null,
        });
        toast.success('Product updated!');
      } else {
        await createProduct.mutateAsync({
          store_id: store.id,
          name,
          description: description || undefined,
          price: priceNum,
          image_url: imageUrl || undefined,
        });
        toast.success('Product added!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        is_available: !product.is_available,
      });
      toast.success(product.is_available ? 'Marked as sold out' : 'Marked as available');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Delete this product?')) return;
    
    try {
      await deleteProduct.mutateAsync({ id: product.id, storeId: store.id });
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products?.length || 0} product{products?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update your product details' : 'Add a new product to your store'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Name *</Label>
                <Input
                  id="productName"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productPrice">Price *</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Image</Label>
                {imageUrl ? (
                  <div className="relative w-24 h-24">
                    <img 
                      src={imageUrl} 
                      alt="Product" 
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setImageUrl('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload">
                      <Button type="button" variant="outline" asChild disabled={isUploading}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? 'Uploading...' : 'Upload Image'}
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products?.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((product) => (
            <Card key={product.id} className={!product.is_available ? 'opacity-60' : ''}>
              <div className="aspect-square bg-muted relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm line-clamp-1 mb-1">{product.name}</h3>
                <p className="text-lg font-semibold text-primary mb-3">
                  {formatPrice(product.price)}
                </p>
                
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={() => handleToggleAvailability(product)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {product.is_available ? 'Available' : 'Sold out'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openDialog(product)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
