import { CartItem } from '@/lib/cart';
import { formatPrice } from '@/lib/currency';
import { Loader2, Truck, AlertCircle } from 'lucide-react';

interface StoreShippingInfo {
  freeShipping: boolean;
  shippingCharge: number;
  estimatedDelivery: string | null;
}

interface LiveShippingRate {
  rate: number;
  etd: string;
  courierName: string;
}

interface CheckoutOrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  storeCountry: string;
  shippingInfo: StoreShippingInfo | null;
  // Live shipping rate props
  liveShippingRate?: LiveShippingRate | null;
  isLoadingRates?: boolean;
  shiprocketEnabled?: boolean;
  hasEnteredPostcode?: boolean;
  shippingError?: string | null;
  isLoadingShiprocketStatus?: boolean;
}

export function CheckoutOrderSummary({ 
  cart, 
  subtotal, 
  storeCountry, 
  shippingInfo,
  liveShippingRate,
  isLoadingRates,
  shiprocketEnabled,
  hasEnteredPostcode,
  shippingError,
  isLoadingShiprocketStatus,
}: CheckoutOrderSummaryProps) {
  // Determine which shipping cost to use
  const useLiveRate = shiprocketEnabled && liveShippingRate && !shippingError;
  
  let shippingCost: number;
  let shippingDisplay: React.ReactNode;
  let deliveryDisplay: React.ReactNode = null;

  // Show loading state while determining shipping mode
  if (isLoadingShiprocketStatus) {
    shippingCost = 0;
    shippingDisplay = (
      <span className="text-background/40 flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </span>
    );
  } else if (shiprocketEnabled) {
    // Shiprocket is enabled for this store
    if (!hasEnteredPostcode) {
      // Customer hasn't entered postal code yet
      shippingCost = 0;
      shippingDisplay = (
        <span className="text-background/40 text-sm">Enter pincode for estimate</span>
      );
    } else if (isLoadingRates) {
      // Loading rates
      shippingCost = 0;
      shippingDisplay = (
        <span className="text-background/40 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Calculating...
        </span>
      );
    } else if (shippingError) {
      // Error fetching rates - fall back to manual settings
      shippingCost = shippingInfo?.freeShipping ? 0 : (shippingInfo?.shippingCharge || 0);
      shippingDisplay = shippingInfo?.freeShipping ? (
        <span className="text-primary">Free</span>
      ) : (
        <span>{formatPrice(shippingCost, storeCountry)}</span>
      );
      deliveryDisplay = (
        <p className="text-xs text-warning flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          {shippingError}
        </p>
      );
    } else if (liveShippingRate) {
      // Live rate available
      shippingCost = liveShippingRate.rate;
      shippingDisplay = (
        <div className="text-right">
          <span>{formatPrice(shippingCost, storeCountry)}</span>
          <span className="text-background/40 text-xs ml-1">
            via {liveShippingRate.courierName}
          </span>
        </div>
      );
      deliveryDisplay = (
        <p className="text-xs text-primary flex items-center gap-1 mt-1">
          <Truck className="h-3 w-3" />
          Est. delivery: {liveShippingRate.etd}
        </p>
      );
    } else {
      // No rates returned (shouldn't happen normally)
      shippingCost = shippingInfo?.freeShipping ? 0 : (shippingInfo?.shippingCharge || 0);
      shippingDisplay = shippingInfo?.freeShipping ? (
        <span className="text-primary">Free</span>
      ) : (
        <span>{formatPrice(shippingCost, storeCountry)}</span>
      );
    }
  } else {
    // No Shiprocket - use manual store settings
    shippingCost = shippingInfo?.freeShipping ? 0 : (shippingInfo?.shippingCharge || 0);
    
    if (shippingInfo === null) {
      shippingDisplay = <span className="text-background/40">Calculating...</span>;
    } else if (shippingInfo.freeShipping) {
      shippingDisplay = <span className="text-primary">Free</span>;
    } else {
      shippingDisplay = <span>{formatPrice(shippingCost, storeCountry)}</span>;
    }

    if (shippingInfo?.estimatedDelivery) {
      deliveryDisplay = (
        <p className="text-xs text-background/40">
          Est. delivery: {shippingInfo.estimatedDelivery}
        </p>
      );
    }
  }

  const total = subtotal + shippingCost;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="font-medium mb-4">Order Summary</h3>
      
      {/* Product list with images */}
      <div className="space-y-3 mb-4">
        {cart.map((item) => (
          <div key={item.productId} className="flex items-start gap-3">
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden relative">
              {item.productImage ? (
                <img 
                  src={item.productImage} 
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-background/40 text-[10px]">
                  No img
                </div>
              )}
              {/* Quantity badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                {item.quantity}
              </div>
            </div>
            
            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.productName}</p>
              <p className="text-xs text-background/60">Qty: {item.quantity}</p>
            </div>
            
            {/* Price */}
            <p className="text-sm font-medium">
              {formatPrice(item.productPrice * item.quantity, storeCountry)}
            </p>
          </div>
        ))}
      </div>

      {/* Summary lines */}
      <div className="border-t border-white/10 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-background/60">Subtotal</span>
          <span>{formatPrice(subtotal, storeCountry)}</span>
        </div>
        
        <div className="flex justify-between text-sm items-start">
          <span className="text-background/60">Shipping</span>
          {shippingDisplay}
        </div>
        
        {deliveryDisplay}
      </div>

      {/* Total */}
      <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatPrice(total, storeCountry)}</span>
      </div>
    </div>
  );
}
