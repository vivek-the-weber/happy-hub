import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Settings, Link as LinkIcon, Copy, Check } from 'lucide-react';
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
import { useMyStore, useUpdateStore } from '@/hooks/useStore';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: store, isLoading: storeLoading, isFetched: storeFetched } = useMyStore();
  const updateStore = useUpdateStore();

  const [storeName, setStoreName] = useState('');
  const [storeBio, setStoreBio] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Redirect to onboarding if no store (only after store query is settled)
  useEffect(() => {
    if (!authLoading && user && storeFetched && store === null) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, store, authLoading, storeFetched, navigate]);

  // Populate form when store loads
  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setStoreBio(store.bio || '');
      setStoreCity(store.city || '');
      setWhatsappNumber(store.whatsapp_number || '');
      setPaymentInstructions(store.payment_instructions || '');
    }
  }, [store]);

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      await updateStore.mutateAsync({
        id: store.id,
        name: storeName,
        bio: storeBio || null,
        city: storeCity || null,
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

  // Show loading while auth or store is loading
  if (authLoading || storeLoading || (user && !storeFetched)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // No store yet (redirect will happen via useEffect)
  if (!store) {
    return null;
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
                    {window.location.origin}/store/{store.slug}
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
            <ProductManager store={store} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderList store={store} />
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
                    <Label htmlFor="editCity">City</Label>
                    <Input
                      id="editCity"
                      value={storeCity}
                      onChange={(e) => setStoreCity(e.target.value)}
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
