import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Settings, Link as LinkIcon, Copy, Check, Truck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/Header';
import { ProductManager } from '@/components/dashboard/ProductManager';
import { OrderList } from '@/components/dashboard/OrderList';
import { ShippingSettings } from '@/components/dashboard/ShippingSettings';
import { useAuth } from '@/hooks/useAuth';
import { useMyStore, useUpdateStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copied, setCopied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
      setLogoUrl(store.logo_url);
    }
  }, [store]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!store || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (file.size > maxSize) {
      toast.error('Logo must be under 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${store.id}/logo_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      await updateStore.mutateAsync({
        id: store.id,
        logo_url: publicUrl,
      });

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!store) return;

    try {
      await updateStore.mutateAsync({
        id: store.id,
        logo_url: null,
      });
      setLogoUrl(null);
      toast.success('Logo removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove logo');
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
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4" />
              Shipping
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

          <TabsContent value="shipping">
            <ShippingSettings store={store} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Logo Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Logo</CardTitle>
                  <CardDescription>
                    Upload a logo for your store. This will appear in the header when customers visit your store.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={logoUrl || undefined} alt={store.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                        {store.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, max 2MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Store Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                  <CardDescription>
                    Update your store details
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
