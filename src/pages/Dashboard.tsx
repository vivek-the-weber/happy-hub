import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Settings, Link as LinkIcon, Copy, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { ProductManager } from '@/components/dashboard/ProductManager';
import { OrderList } from '@/components/dashboard/OrderList';
import { useAuth } from '@/hooks/useAuth';
import { useMyStore, useCreateStore, useUpdateStore } from '@/hooks/useStore';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: store, isLoading: storeLoading } = useMyStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const [isCreating, setIsCreating] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeBio, setStoreBio] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setStoreBio(store.bio || '');
      setWhatsappNumber(store.whatsapp_number || '');
      setPaymentInstructions(store.payment_instructions || '');
    }
  }, [store]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error('Please enter a store name');
      return;
    }

    try {
      await createStore.mutateAsync({
        name: storeName,
        bio: storeBio,
        whatsapp_number: whatsappNumber,
        payment_instructions: paymentInstructions,
      });
      toast.success('Store created! 🎉');
      setIsCreating(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create store');
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      await updateStore.mutateAsync({
        id: store.id,
        name: storeName,
        bio: storeBio || null,
        whatsapp_number: whatsappNumber || null,
        payment_instructions: paymentInstructions || null,
      });
      toast.success('Store updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store');
    }
  };

  const copyStoreLink = () => {
    if (store) {
      const link = `${window.location.origin}/store/${store.slug}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // No store - show create form
  if (!store && !isCreating) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to happy2buy!</h1>
          <p className="text-muted-foreground mb-8">
            Create your store to start selling. It only takes a minute.
          </p>
          <Button onClick={() => setIsCreating(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Your Store
          </Button>
        </div>
      </div>
    );
  }

  // Creating store
  if (isCreating && !store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
          
          <form onSubmit={handleCreateStore} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                placeholder="e.g. Sarah's Crafts"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Short Description</Label>
              <Textarea
                id="bio"
                placeholder="Tell customers what you sell..."
                value={storeBio}
                onChange={(e) => setStoreBio(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+1234567890"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Customers can contact you on WhatsApp
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment">Payment Instructions</Label>
              <Textarea
                id="payment"
                placeholder="e.g. Bank transfer to: Account 1234..."
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Shown to customers after they place an order
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStore.isPending} className="flex-1">
                {createStore.isPending ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Has store - show dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        {/* Store Link Banner */}
        <Card className="mb-6 bg-accent/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-accent-foreground" />
                <div>
                  <p className="text-sm font-medium">Your store link</p>
                  <p className="text-xs text-muted-foreground">
                    {window.location.origin}/store/{store?.slug}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={copyStoreLink}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductManager store={store!} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderList store={store!} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>
                  Update your store information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateStore} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="editStoreName">Store Name</Label>
                    <Input
                      id="editStoreName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editBio">Description</Label>
                    <Textarea
                      id="editBio"
                      value={storeBio}
                      onChange={(e) => setStoreBio(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editWhatsapp">WhatsApp Number</Label>
                    <Input
                      id="editWhatsapp"
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editPayment">Payment Instructions</Label>
                    <Textarea
                      id="editPayment"
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button type="submit" disabled={updateStore.isPending}>
                    {updateStore.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
