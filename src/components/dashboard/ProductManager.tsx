import { useState } from 'react';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { formatPrice } from '@/lib/currency';
import { CollectionManager } from './CollectionManager';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type TabType = 'products' | 'collections';

interface ProductManagerProps {
  store: Store;
}

export function ProductManager({ store }: ProductManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const { data: products, isLoading } = useStoreProducts(store.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageUrls([]);
    setEditingProduct(null);
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      const urls = product.image_urls?.length > 0 
        ? product.image_urls 
        : product.image_url 
          ? [product.image_url] 
          : [];
      setImageUrls(urls);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 5MB per image.`);
        return;
      }
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${store.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded!`);
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
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
          image_url: imageUrls[0] || null,
          image_urls: imageUrls,
        });
        toast.success('Product updated!');
      } else {
        await createProduct.mutateAsync({
          store_id: store.id,
          name,
          description: description || undefined,
          price: priceNum,
          image_url: imageUrls[0] || undefined,
          image_urls: imageUrls,
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

  const getDisplayImage = (product: Product) => {
    return product.image_urls?.[0] || product.image_url;
  };

  // Tab Switcher Component
  const TabSwitcher = () => (
    <div className="inline-flex bg-white/5 rounded-full p-1 border border-white/10">
      <button 
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeTab === 'products' 
            ? 'bg-background text-foreground' 
            : 'text-background/60 hover:text-background/80'
        }`}
        onClick={() => setActiveTab('products')}
      >
        Products
      </button>
      <button 
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeTab === 'collections' 
            ? 'bg-background text-foreground' 
            : 'text-background/60 hover:text-background/80'
        }`}
        onClick={() => setActiveTab('collections')}
      >
        Collections
      </button>
    </div>
  );

  // Render Collections tab
  if (activeTab === 'collections') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <TabSwitcher />
          <Button 
            onClick={() => setIsCollectionDialogOpen(true)} 
            variant="outline"
            className="rounded-full border-primary text-primary bg-transparent hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Collection
          </Button>
        </div>
        <CollectionManager 
          store={store} 
          isDialogOpen={isCollectionDialogOpen}
          onDialogOpenChange={setIsCollectionDialogOpen}
        />
      </div>
    );
  }

  // Products tab content
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <TabSwitcher />
        </div>
        <div className="text-center py-8 text-background/60">Loading products...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <TabSwitcher />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => openDialog()} 
              variant="outline"
              className="rounded-full border-primary text-primary bg-transparent hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-foreground border-white/10">
            <DialogHeader>
              <DialogTitle className="text-background">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </DialogTitle>
              <DialogDescription className="text-background/60">
                {editingProduct ? 'Update your product details' : 'Add a new product to your store'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-background/80">Name *</Label>
                <Input
                  id="productName"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productPrice" className="text-background/80">Price *</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productDescription" className="text-background/80">Description</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-background/80">Images ({imageUrls.length}/{MAX_IMAGES})</Label>
                <div className="grid grid-cols-5 gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img 
                        src={url} 
                        alt={`Product ${index + 1}`} 
                        className="w-full h-full object-cover rounded-lg border border-white/10"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {imageUrls.length < MAX_IMAGES && (
                    <div className="aspect-square">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="imageUpload"
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="imageUpload"
                        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary transition-colors"
                      >
                        {isUploading ? (
                          <span className="text-xs text-background/60">Uploading...</span>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-background/60 mb-1" />
                            <span className="text-xs text-background/60">Add</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-background/50">
                  Up to {MAX_IMAGES} images, 5MB max each
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-white/5 border-white/10 text-background hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1 rounded-xl"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {products?.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-12">
          <div className="text-center">
            <p className="text-background/60 mb-4">No products yet</p>
            <Button onClick={() => openDialog()} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products?.map((product) => {
            const displayImage = getDisplayImage(product);
            
            return (
              <div 
                key={product.id} 
                className={`bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-4 ${!product.is_available ? 'opacity-60' : ''}`}
              >
                {/* Product Image */}
                <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex-shrink-0">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-background/40 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-background line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-background/50 line-clamp-1">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-background">
                      {formatPrice(product.price, store.country)}
                    </span>
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={() => handleToggleAvailability(product)}
                      className="h-4 w-7 data-[state=unchecked]:bg-white/20 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openDialog(product)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-background/60 hover:bg-white/10 hover:text-background transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
