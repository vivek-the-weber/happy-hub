import { useState, useEffect } from 'react';
import { Truck, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUpdateStore, Store } from '@/hooks/useStore';
import { useShiprocketConnection, useDisconnectShiprocket, useUpdateShiprocketConnection, useRefreshPickupLocation } from '@/hooks/useShiprocket';
import { ShiprocketConnectModal } from './ShiprocketConnectModal';
import { toast } from 'sonner';
import { getCurrencySymbol } from '@/lib/currency';

interface ShippingSettingsProps {
  store: Store;
}

export function ShippingSettings({ store }: ShippingSettingsProps) {
  const updateStore = useUpdateStore();
  const disconnectShiprocket = useDisconnectShiprocket();
  const updateShiprocketConnection = useUpdateShiprocketConnection();
  const refreshPickupLocation = useRefreshPickupLocation();
  const { data: shiprocketConnection, isLoading: isLoadingConnection } = useShiprocketConnection(store.id);

  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [shippingCharge, setShippingCharge] = useState('0');
  const [freeShipping, setFreeShipping] = useState(false);
  const [shiprocketModalOpen, setShiprocketModalOpen] = useState(false);
  const [defaultWeight, setDefaultWeight] = useState('0.5');

  useEffect(() => {
    if (store) {
      setEstimatedDeliveryTime(store.estimated_delivery_time || '');
      setShippingCharge(String(store.shipping_charge || 0));
      setFreeShipping(store.free_shipping || false);
    }
  }, [store]);

  useEffect(() => {
    if (shiprocketConnection) {
      setDefaultWeight(String(shiprocketConnection.default_weight || 0.5));
    }
  }, [shiprocketConnection]);

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateStore.mutateAsync({
        id: store.id,
        estimated_delivery_time: estimatedDeliveryTime || null,
        shipping_charge: freeShipping ? 0 : parseFloat(shippingCharge) || 0,
        free_shipping: freeShipping,
      });

      // Save Shiprocket settings if connected (only default weight is editable)
      if (shiprocketConnection) {
        await updateShiprocketConnection.mutateAsync({
          storeId: store.id,
          default_weight: parseFloat(defaultWeight) || 0.5,
        });
      }

      toast.success('Shipping settings saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save shipping settings');
    }
  };

  const handleShiprocketToggle = async (checked: boolean) => {
    if (checked && !shiprocketConnection) {
      // Open modal to connect
      setShiprocketModalOpen(true);
    } else if (!checked && shiprocketConnection) {
      // Disconnect
      try {
        await disconnectShiprocket.mutateAsync({ storeId: store.id });
        toast.success('Disconnected from Shiprocket');
      } catch (error: any) {
        toast.error(error.message || 'Failed to disconnect from Shiprocket');
      }
    }
  };

  const handleRefreshPickup = async () => {
    try {
      await refreshPickupLocation.mutateAsync({ storeId: store.id });
      toast.success('Pickup location synced from Shiprocket');
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh pickup location');
    }
  };

  const isConnected = !!shiprocketConnection;

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white/10">
          <Truck className="h-5 w-5 text-background" />
        </div>
        <h2 className="text-xl font-semibold text-background">Shipping</h2>
      </div>

      {/* Shiprocket Automation Toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="space-y-0.5">
          <Label className="text-base font-medium text-background cursor-pointer">
            Shiprocket Automation
          </Label>
          <p className="text-sm text-background/60">
            Automate shipping with Shiprocket
          </p>
          {isConnected && shiprocketConnection.email && (
            <p className="text-xs text-green-400 mt-1">
              Connected as {shiprocketConnection.email}
            </p>
          )}
        </div>
        <Switch
          checked={isConnected}
          onCheckedChange={handleShiprocketToggle}
          disabled={disconnectShiprocket.isPending || isLoadingConnection}
          className="data-[state=unchecked]:bg-white/20 data-[state=checked]:bg-green-500"
        />
      </div>

      {/* Shiprocket Settings - Only show when connected */}
      {isConnected && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium tracking-wider text-background/60 uppercase">
              Shiprocket Settings
            </span>
          </div>

          <div className="space-y-4">
            {/* Pickup Location - Read-only, synced from Shiprocket */}
            <div className="space-y-2">
              <Label className="text-background/80">Pickup Postcode</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shiprocketConnection?.pickup_postcode || 'Not available'}
                  className="bg-white/5 border-white/10 text-background h-12 rounded-xl flex-1 cursor-default"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefreshPickup}
                  disabled={refreshPickupLocation.isPending}
                  className="h-12 rounded-xl border-white/10 text-background hover:bg-white/10"
                >
                  {refreshPickupLocation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-green-400">
                ✓ Synced from your Shiprocket account
              </p>
            </div>

            {/* Default Weight - Still editable */}
            <div className="space-y-2">
              <Label htmlFor="defaultWeight" className="text-background/80">
                Default Package Weight (kg)
              </Label>
              <Input
                id="defaultWeight"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="0.5"
                value={defaultWeight}
                onChange={(e) => setDefaultWeight(e.target.value)}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
              />
              <p className="text-xs text-background/50">
                Average weight of your packages for shipping estimates
              </p>
            </div>
          </div>
        </>
      )}

      {/* Section Header */}
      <div className="flex items-center gap-2 pt-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium tracking-wider text-background/60 uppercase">
          Manual Shipping Settings
        </span>
      </div>

      {/* Manual Settings Form */}
      <form onSubmit={handleSaveShipping} className="space-y-5">
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

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
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
            className="data-[state=unchecked]:bg-white/20 data-[state=checked]:bg-green-500"
          />
        </div>
      </form>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground via-foreground to-transparent md:relative md:p-0 md:bg-none">
        <Button 
          onClick={handleSaveShipping}
          disabled={updateStore.isPending || updateShiprocketConnection.isPending}
          className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium text-base"
        >
          {(updateStore.isPending || updateShiprocketConnection.isPending) ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Shipping Settings'
          )}
        </Button>
      </div>

      {/* Shiprocket Connect Modal */}
      <ShiprocketConnectModal
        open={shiprocketModalOpen}
        onOpenChange={setShiprocketModalOpen}
        storeId={store.id}
      />
    </div>
  );
}
