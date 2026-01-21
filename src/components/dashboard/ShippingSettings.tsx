import { useState, useEffect } from 'react';
import { Truck, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useUpdateStore, Store } from '@/hooks/useStore';
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

  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [shippingCharge, setShippingCharge] = useState('0');
  const [freeShipping, setFreeShipping] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Shipping Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Settings
          </CardTitle>
          <CardDescription>
            Configure how you ship orders to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveShipping} className="space-y-6 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Estimated Delivery Time</Label>
              <Input
                id="deliveryTime"
                placeholder="e.g. 5-7 days"
                value={estimatedDeliveryTime}
                onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tell customers how long delivery usually takes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingCharge">Shipping Charge</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getCurrencySymbol(store.country)}</span>
                <Input
                  id="shippingCharge"
                  type="number"
                  min="0"
                  step="1"
                  className="pl-8"
                  placeholder="0"
                  value={shippingCharge}
                  onChange={(e) => setShippingCharge(e.target.value)}
                  disabled={freeShipping}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Amount charged for shipping each order
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="freeShipping" className="text-base cursor-pointer">
                  Free Shipping
                </Label>
                <p className="text-sm text-muted-foreground">
                  Offer free shipping on all orders
                </p>
              </div>
              <Switch
                id="freeShipping"
                checked={freeShipping}
                onCheckedChange={setFreeShipping}
              />
            </div>

            <Button type="submit" disabled={updateStore.isPending}>
              {updateStore.isPending ? 'Saving...' : 'Save Shipping Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Learn Shipping Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Learn Shipping
          </CardTitle>
          <CardDescription>
            Simple guides to help you ship orders like a pro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shippingVideos.map((video, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-20 h-14 rounded-md bg-muted flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{video.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming soon
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
