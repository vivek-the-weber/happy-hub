import { useState } from 'react';
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Store, useStoreProducts } from '@/hooks/useStore';
import {
  Collection,
  useCollectionWithProductCount,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useCollectionProducts,
  useUpdateCollectionProducts,
} from '@/hooks/useCollections';
import { toast } from 'sonner';

interface CollectionManagerProps {
  store: Store;
}

export function CollectionManager({ store }: CollectionManagerProps) {
  const { data: collections, isLoading } = useCollectionWithProductCount(store.id);
  const { data: products } = useStoreProducts(store.id);
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const updateCollectionProducts = useUpdateCollectionProducts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Fetch products for the editing collection
  const { data: existingProductIds } = useCollectionProducts(editingCollection?.id);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedProductIds([]);
    setEditingCollection(null);
  };

  const openDialog = (collection?: Collection & { product_count?: number }) => {
    if (collection) {
      setEditingCollection(collection);
      setName(collection.name);
      setDescription(collection.description || '');
      // Products will be loaded via useCollectionProducts
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // Update selected products when existing products are loaded
  useState(() => {
    if (existingProductIds && editingCollection) {
      setSelectedProductIds(existingProductIds);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    try {
      if (editingCollection) {
        await updateCollection.mutateAsync({
          id: editingCollection.id,
          name,
          description: description || null,
        });
        
        await updateCollectionProducts.mutateAsync({
          collectionId: editingCollection.id,
          productIds: selectedProductIds,
          storeId: store.id,
        });
        
        toast.success('Collection updated!');
      } else {
        const newCollection = await createCollection.mutateAsync({
          store_id: store.id,
          name,
          description: description || undefined,
        });
        
        if (selectedProductIds.length > 0) {
          await updateCollectionProducts.mutateAsync({
            collectionId: newCollection.id,
            productIds: selectedProductIds,
            storeId: store.id,
          });
        }
        
        toast.success('Collection created!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleToggleVisibility = async (collection: Collection) => {
    try {
      await updateCollection.mutateAsync({
        id: collection.id,
        is_visible: !collection.is_visible,
      });
      toast.success(collection.is_visible ? 'Collection hidden' : 'Collection visible');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (collection: Collection) => {
    if (!confirm('Delete this collection? Products will not be deleted.')) return;
    
    try {
      await deleteCollection.mutateAsync({ id: collection.id, storeId: store.id });
      toast.success('Collection deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-background/60">Loading collections...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-background">Collections</h2>
          <p className="text-sm text-background/60">
            {collections?.length || 0} collection{collections?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => openDialog()} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Add Collection
        </Button>
      </div>

      {/* Collection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-foreground border-white/10">
          <DialogHeader>
            <DialogTitle className="text-background">
              {editingCollection ? 'Edit Collection' : 'Add Collection'}
            </DialogTitle>
            <DialogDescription className="text-background/60">
              {editingCollection ? 'Update your collection details' : 'Create a new collection to group products'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collectionName" className="text-background/80">Name *</Label>
              <Input
                id="collectionName"
                placeholder="e.g., Summer Collection"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collectionDescription" className="text-background/80">Description</Label>
              <Textarea
                id="collectionDescription"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl resize-none"
              />
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label className="text-background/80">Products in Collection</Label>
              <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl p-2 space-y-1">
                {products?.length === 0 ? (
                  <p className="text-sm text-background/50 text-center py-4">No products available</p>
                ) : (
                  products?.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <div className="w-8 h-8 rounded-md bg-white/5 overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-background/40 text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-background truncate">{product.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-background/50">
                {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
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
                disabled={createCollection.isPending || updateCollection.isPending || updateCollectionProducts.isPending}
                className="flex-1 rounded-xl"
              >
                {editingCollection ? 'Save Changes' : 'Create Collection'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collections List */}
      {collections?.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-12">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-background/30 mb-4" />
            <p className="text-background/60 mb-4">No collections yet</p>
            <Button onClick={() => openDialog()} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {collections?.map((collection) => (
            <div 
              key={collection.id} 
              className={`bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-4 ${!collection.is_visible ? 'opacity-60' : ''}`}
            >
              {/* Collection Icon */}
              <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-background/40" />
              </div>

              {/* Collection Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-background line-clamp-1">{collection.name}</h3>
                {collection.description && (
                  <p className="text-xs text-background/50 line-clamp-1">{collection.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-background/60">
                    {collection.product_count} product{collection.product_count !== 1 ? 's' : ''}
                  </span>
                  <Switch
                    checked={collection.is_visible}
                    onCheckedChange={() => handleToggleVisibility(collection)}
                    className="h-4 w-7 data-[state=unchecked]:bg-white/20 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openDialog(collection)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-background/60 hover:bg-white/10 hover:text-background transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(collection)}
                  className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
