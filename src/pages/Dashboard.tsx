import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ShoppingBag, Settings, Copy, Check, Truck, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductManager } from '@/components/dashboard/ProductManager';
import { OrderList } from '@/components/dashboard/OrderList';
import { ShippingSettings } from '@/components/dashboard/ShippingSettings';
import { useAuth } from '@/hooks/useAuth';
import { useMyStore, useUpdateStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && storeFetched && store === null) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, store, authLoading, storeFetched, navigate]);

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
    const maxSize = 2 * 1024 * 1024;

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
      const link = `https://${store.slug}.happy2buy.in`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || storeLoading || (user && !storeFetched)) {
    return (
      <div className="min-h-screen bg-surface-inverse flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-background/60" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-inverse text-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-inverse/95 backdrop-blur border-b border-white/10">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-bold">happy2buy</Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => signOut()}
            className="text-background/60 hover:text-background hover:bg-white/5"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Store Link Banner */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-background/60">Your store link</p>
              <p className="font-medium truncate">{store.slug}.happy2buy.in</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyStoreLink}
              className="shrink-0 border-white/20 bg-white/5 text-background hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6">
        <Tabs defaultValue="products" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <TabsList className="bg-white/5 border border-white/10 p-1 w-max">
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-white/10 data-[state=active]:text-background text-background/60"
              >
                <Package className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-background text-background/60"
              >
                <ShoppingBag className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="shipping"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-background text-background/60"
              >
                <Truck className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Shipping</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-background text-background/60"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="mt-6">
            <ProductManager store={store} />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrderList store={store} />
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <ShippingSettings store={store} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-6">
            {/* Logo Upload */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Store Logo</h3>
              <p className="text-sm text-background/60 mb-4">
                Upload a logo for your store. This will appear in the header when customers visit.
              </p>
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
                    className="border-white/20 bg-white/5 text-background hover:bg-white/10"
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
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  <p className="text-xs text-background/40">
                    Recommended: Square image, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Store Info Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Store Information</h3>
              <form onSubmit={handleUpdateStore} className="space-y-5 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-background/80">Store name</Label>
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-background/80">Description</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell customers about your store..."
                    value={storeBio}
                    onChange={(e) => setStoreBio(e.target.value)}
                    className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-background/80">City</Label>
                  <Input
                    id="city"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-background/80">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment" className="text-background/80">Payment instructions</Label>
                  <Textarea
                    id="payment"
                    placeholder="e.g., UPI: yourname@upi"
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateStore.isPending}
                  className="h-12 rounded-xl"
                >
                  {updateStore.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
