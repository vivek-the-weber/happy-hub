import { CartItem } from '@/lib/cart';
import { formatPrice } from '@/lib/currency';

interface StoreShippingInfo {
  freeShipping: boolean;
  shippingCharge: number;
  estimatedDelivery: string | null;
}

interface CheckoutOrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  storeCountry: string;
  shippingInfo: StoreShippingInfo | null;
}

export function CheckoutOrderSummary({ 
  cart, 
  subtotal, 
  storeCountry, 
  shippingInfo 
}: CheckoutOrderSummaryProps) {
  const shippingCost = shippingInfo?.freeShipping ? 0 : (shippingInfo?.shippingCharge || 0);
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
        
        <div className="flex justify-between text-sm">
          <span className="text-background/60">Shipping</span>
          {shippingInfo === null ? (
            <span className="text-background/40">Calculating...</span>
          ) : shippingInfo.freeShipping ? (
            <span className="text-primary">Free</span>
          ) : (
            <span>{formatPrice(shippingCost, storeCountry)}</span>
          )}
        </div>
        
        {shippingInfo?.estimatedDelivery && (
          <p className="text-xs text-background/40">
            Est. delivery: {shippingInfo.estimatedDelivery}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatPrice(total, storeCountry)}</span>
      </div>
    </div>
  );
}
