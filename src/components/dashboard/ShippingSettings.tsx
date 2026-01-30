import { useState, useEffect } from 'react';
import { Truck, Play, Clock, Link2, Unlink, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useUpdateStore, Store } from '@/hooks/useStore';
import { useConnectShiprocket, useDisconnectShiprocket } from '@/hooks/useShiprocket';
import { toast } from 'sonner';
import { getCurrencySymbol } from '@/lib/currency';

interface ShippingSettingsProps {
  store: Store;
}

const shippingVideos = [
  {
    title: "How to ship with India Post",
    description: "The most affordable way to ship across India. Learn how to book, pack, and track.",
  },
  {
    title: "How to ship with private couriers (DTDC / Delhivery)",
    description: "Faster delivery for your customers. Compare options and get started.",
  },
  {
    title: "Local delivery (Dunzo / Porter)",
    description: "Same-day delivery for local customers. Perfect for food and fragile items.",
  },
  {
    title: "How to update customers after shipping",
    description: "Keep your customers informed with tracking updates via WhatsApp.",
  },
  {
    title: "Common shipping mistakes",
    description: "Avoid these common errors that lead to returns and unhappy customers.",
  },
];

export function ShippingSettings({ store }: ShippingSettingsProps) {
  const updateStore = useUpdateStore();
  const connectShiprocket = useConnectShiprocket();
  const disconnectShiprocket = useDisconnectShiprocket();

  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [shippingCharge, setShippingCharge] = useState('0');
  const [freeShipping, setFreeShipping] = useState(false);
  
  // Shiprocket state
  const [shiprocketEmail, setShiprocketEmail] = useState('');
  const [shiprocketPassword, setShiprocketPassword] = useState('');

  useEffect(() => {
    if (store) {
      setEstimatedDeliveryTime(store.estimated_delivery_time || '');
      setShippingCharge(String(store.shipping_charge || 0));
      setFreeShipping(store.free_shipping || false);
    }
  }, [store]);

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateStore.mutateAsync({
        id: store.id,
        estimated_delivery_time: estimatedDeliveryTime || null,
        shipping_charge: freeShipping ? 0 : parseFloat(shippingCharge) || 0,
        free_shipping: freeShipping,
      });
      toast.success('Shipping settings saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save shipping settings');
    }
  };

  const handleConnectShiprocket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shiprocketEmail || !shiprocketPassword) {
      toast.error('Please enter your Shiprocket email and password');
      return;
    }

    try {
      await connectShiprocket.mutateAsync({
        storeId: store.id,
        email: shiprocketEmail,
        password: shiprocketPassword,
      });
      toast.success('Connected to Shiprocket successfully!');
      setShiprocketEmail('');
      setShiprocketPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect to Shiprocket');
    }
  };

  const handleDisconnectShiprocket = async () => {
    try {
      await disconnectShiprocket.mutateAsync({ storeId: store.id });
      toast.success('Disconnected from Shiprocket');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect from Shiprocket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Shipping Settings Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-background flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Settings
          </h3>
          <p className="text-sm text-background/60 mt-1">
            Configure how you ship orders to customers
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveShipping} className="space-y-6 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="deliveryTime" className="text-background/80">
                Estimated Delivery Time
              </Label>
              <Input
                id="deliveryTime"
                placeholder="e.g. 5-7 days"
                value={estimatedDeliveryTime}
                onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
              />
              <p className="text-xs text-background/50">
                Tell customers how long delivery usually takes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingCharge" className="text-background/80">
                Shipping Charge
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-background/60">
                  {getCurrencySymbol(store.country)}
                </span>
                <Input
                  id="shippingCharge"
                  type="number"
                  min="0"
                  step="1"
                  className="pl-8 bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                  placeholder="0"
                  value={shippingCharge}
                  onChange={(e) => setShippingCharge(e.target.value)}
                  disabled={freeShipping}
                />
              </div>
              <p className="text-xs text-background/50">
                Amount charged for shipping each order
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="freeShipping" className="text-base text-background cursor-pointer">
                  Free Shipping
                </Label>
                <p className="text-sm text-background/60">
                  Offer free shipping on all orders
                </p>
              </div>
              <Switch
                id="freeShipping"
                checked={freeShipping}
                onCheckedChange={setFreeShipping}
                className="data-[state=unchecked]:bg-white/20"
              />
            </div>

            <Button 
              type="submit" 
              disabled={updateStore.isPending}
              className="rounded-xl"
            >
              {updateStore.isPending ? 'Saving...' : 'Save Shipping Settings'}
            </Button>
          </form>
        </div>
      </div>

      {/* Shiprocket Integration Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-background flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Shiprocket Integration
              </h3>
              <p className="text-sm text-background/60 mt-1">
                Connect your Shiprocket account to automate shipping
              </p>
            </div>
            {store.shiprocket_connected && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                Connected
              </Badge>
            )}
          </div>
        </div>
        <div className="p-6">
          {store.shiprocket_connected ? (
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex-1">
                  <p className="text-sm text-background/80">Connected as</p>
                  <p className="font-medium text-background">{store.shiprocket_email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnectShiprocket}
                disabled={disconnectShiprocket.isPending}
                className="rounded-xl border-white/10 text-background hover:bg-white/10"
              >
                {disconnectShiprocket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect Shiprocket
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnectShiprocket} className="space-y-4 max-w-md">
              <p className="text-sm text-background/60">
                Shiprocket helps you ship orders across India with multiple courier partners. 
                Enter your Shiprocket account credentials to connect.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="shiprocketEmail" className="text-background/80">
                  Shiprocket Email
                </Label>
                <Input
                  id="shiprocketEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={shiprocketEmail}
                  onChange={(e) => setShiprocketEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiprocketPassword" className="text-background/80">
                  Shiprocket Password
                </Label>
                <Input
                  id="shiprocketPassword"
                  type="password"
                  placeholder="••••••••"
                  value={shiprocketPassword}
                  onChange={(e) => setShiprocketPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                />
                <p className="text-xs text-background/50">
                  Your password is never stored. We only save the authentication token.
                </p>
              </div>

              <Button
                type="submit"
                disabled={connectShiprocket.isPending}
                className="rounded-xl"
              >
                {connectShiprocket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect to Shiprocket
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Learn Shipping Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-background flex items-center gap-2">
            <Play className="h-5 w-5" />
            Learn Shipping
          </h3>
          <p className="text-sm text-background/60 mt-1">
            Simple guides to help you ship orders like a pro
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {shippingVideos.map((video, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex-shrink-0 w-20 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                  <Play className="h-6 w-6 text-background/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm text-background">{video.title}</h4>
                    <Badge className="text-xs bg-white/10 text-background/70 border border-white/10">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming soon
                    </Badge>
                  </div>
                  <p className="text-sm text-background/60 mt-1">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
