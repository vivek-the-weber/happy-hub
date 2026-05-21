import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { CheckoutForm, CheckoutFormData } from '@/components/checkout/CheckoutForm';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { TrysyCheckout } from '@/components/checkout/TrysyCheckout';
import { useShippingRates, useStoreShiprocketStatus } from '@/hooks/useShippingRates';

interface StoreShippingInfo {
  freeShipping: boolean;
  shippingCharge: number;
  estimatedDelivery: string | null;
}

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeShippingInfo, setStoreShippingInfo] = useState<StoreShippingInfo | null>(null);
  const [customerPostalCode, setCustomerPostalCode] = useState('');
  const [trysyOrderId, setTrysyOrderId] = useState<string | null>(null);
  const externalOrderIdRef = useRef<string>(crypto.randomUUID());

  const itemsByStore = cart.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = { storeName: item.storeName, storeCountry: item.storeCountry, items: [] };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; storeCountry: string; items: typeof cart }>);

  const firstStoreId = Object.keys(itemsByStore)[0];
  const firstStoreCountry = Object.values(itemsByStore)[0]?.storeCountry || 'IN';

  // Check if store has Shiprocket connected
  const { data: shiprocketStatus, isLoading: isLoadingShiprocketStatus } = useStoreShiprocketStatus(firstStoreId, isCheckout);

  // Stabilize weight value to prevent query key instability
  const defaultWeight = shiprocketStatus?.defaultWeight ?? 0.5;

  // Fetch live shipping rates when postal code is entered
  const { 
    data: liveRates, 
    isLoading: isLoadingRates,
    error: ratesError,
  } = useShippingRates(
    firstStoreId,
    customerPostalCode,
    defaultWeight
  );

  // Fetch store shipping info when entering checkout (for fallback)
  useEffect(() => {
    if (isCheckout && firstStoreId) {
      const fetchShippingInfo = async () => {
        const { data: store } = await supabase
          .from('stores')
          .select('free_shipping, shipping_charge, estimated_delivery_time')
          .eq('id', firstStoreId)
          .maybeSingle();
        
        if (store) {
          setStoreShippingInfo({
            freeShipping: store.free_shipping || false,
            shippingCharge: store.shipping_charge || 0,
            estimatedDelivery: store.estimated_delivery_time || null,
          });
        }
      };
      fetchShippingInfo();
    }
  }, [isCheckout, firstStoreId]);

  // Handle postal code change from form - stable callback reference
  const handlePostalCodeChange = useCallback((postalCode: string) => {
    setCustomerPostalCode(postalCode);
  }, []);

  // Determine shipping error message
  const getShippingError = (): string | null => {
    if (ratesError) {
      return 'Unable to fetch rates';
    }
    if (liveRates?.notServiceable) {
      return 'Delivery not available to this area';
    }
    if (liveRates?.tokenExpired) {
      return 'Shipping rates unavailable';
    }
    if (liveRates?.error && !liveRates.notConfigured) {
      return liveRates.error;
    }
    return null;
  };

  // Prepare live shipping rate for display
  const getLiveShippingRate = () => {
    if (!liveRates?.success) return null;
    return {
      rate: liveRates.cheapestRate,
      etd: liveRates.etd,
      courierName: liveRates.courierName,
    };
  };

  // Derived state - computed on every render for proper reactivity
  const shiprocketEnabled = shiprocketStatus?.hasShiprocket && !!shiprocketStatus?.pickupPostcode;
  const hasEnteredPostcode = customerPostalCode.length >= 6;
  const shippingError = getShippingError();
  const liveShippingRate = getLiveShippingRate();


  const handlePlaceOrder = async (formData: CheckoutFormData) => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || 
        !formData.addressLine1.trim() || !formData.city.trim() || !formData.state.trim() || 
        !formData.postalCode.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [storeId, { storeName, items }] of Object.entries(itemsByStore)) {
        const storeTotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

        // Format combined address for backward compatibility
        const combinedAddress = [
          formData.addressLine1,
          formData.addressLine2,
          formData.city,
          formData.state,
          formData.postalCode,
          formData.country
        ].filter(Boolean).join(', ');

        const orderId = crypto.randomUUID();
        const accessToken = crypto.randomUUID();

        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: orderId,
            order_access_token: accessToken,
            store_id: storeId,
            customer_name: formData.fullName,
            customer_phone: formData.phone,
            customer_address: combinedAddress,
            customer_notes: formData.notes || null,
            total_amount: storeTotal,
            customer_email: formData.email,
            customer_address_line1: formData.addressLine1,
            customer_address_line2: formData.addressLine2 || null,
            customer_city: formData.city,
            customer_state: formData.state,
            customer_postal_code: formData.postalCode,
            customer_country: formData.country,
            trysy_order_id: trysyOrderId,
          } as any);

        if (orderError) throw orderError;

        const orderItems = items.map(item => ({
          order_id: orderId,
          product_id: item.productId,
          product_name: item.productName,
          product_price: item.productPrice,
          quantity: item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order/${orderId}?token=${accessToken}`);
        return;
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
        <header className="p-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-background/60 hover:text-background transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
          <Link to="/" className="text-xl font-bold">happy2buy</Link>
          <div className="w-16" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-background/40" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-background/60 mb-8">Start shopping to add items</p>
          <Button onClick={() => navigate('/')} className="h-12 rounded-xl px-8">
            Browse Stores
          </Button>
        </main>
      </div>
    );
  }

  // Checkout form - two column layout
  if (isCheckout) {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
        <header className="p-6 flex items-center justify-between">
          <button onClick={() => setIsCheckout(false)} className="flex items-center gap-2 text-background/60 hover:text-background transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
          <Link to="/" className="text-xl font-bold">happy2buy</Link>
          <div className="w-16" />
        </header>

        <main className="flex-1 container py-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Checkout</h1>
              <p className="text-background/60">Complete your order</p>
            </div>

            {/* Two column layout: Order summary first on mobile, side-by-side on desktop */}
            <div className="flex flex-col-reverse lg:flex-row lg:gap-8">
              {/* Left: Customer Details Form */}
              <div className="flex-1 lg:max-w-md">
                <CheckoutForm 
                  initialCountry={firstStoreCountry}
                  isSubmitting={isSubmitting}
                  onSubmit={handlePlaceOrder}
                  onPostalCodeChange={handlePostalCodeChange}
                />
              </div>

              {/* Right: Order Summary */}
              <div className="w-full lg:w-80 mb-6 lg:mb-0 space-y-4">
                <TrysyCheckout
                  storeId={firstStoreId}
                  externalOrderId={externalOrderIdRef.current}
                  products={cart.map((i) => ({
                    product_name: i.productName,
                    quantity: i.quantity,
                    price: i.productPrice,
                  }))}
                  totalOrderValue={total}
                  onOrderCreated={setTrysyOrderId}
                />
                <CheckoutOrderSummary 
                  cart={cart}
                  subtotal={total}
                  storeCountry={firstStoreCountry}
                  shippingInfo={storeShippingInfo}
                  liveShippingRate={liveShippingRate}
                  isLoadingRates={isLoadingRates && hasEnteredPostcode}
                  shiprocketEnabled={shiprocketEnabled || !!liveShippingRate}
                  hasEnteredPostcode={hasEnteredPostcode}
                  shippingError={shippingError}
                  isLoadingShiprocketStatus={isLoadingShiprocketStatus}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Cart list
  return (
    <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-background/60 hover:text-background transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        <Link to="/" className="text-xl font-bold">happy2buy</Link>
        <div className="w-16" />
      </header>

      <main className="flex-1 container py-6">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Your Cart</h1>
            <p className="text-background/60">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Cart Items */}
          <div className="space-y-4">
            {Object.entries(itemsByStore).map(([storeId, { storeName, storeCountry, items }]) => (
              <div key={storeId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-sm text-background/60 mb-4">{storeName}</p>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden">
                        {item.productImage ? (
                          <img 
                            src={item.productImage} 
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-background/40 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-sm text-background/60">
                          {formatPrice(item.productPrice, storeCountry)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="ml-auto w-8 h-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total & Checkout */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between mb-4">
              <span className="text-background/60">Total</span>
              <span className="text-xl font-bold">{formatPrice(total, firstStoreCountry)}</span>
            </div>
            <Button onClick={() => setIsCheckout(true)} className="w-full h-12 rounded-xl text-base font-medium">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
