import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{ storeName: string; paymentInstructions: string | null } | null>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const itemsByStore = cart.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = { storeName: item.storeName, storeCountry: item.storeCountry, items: [] };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; storeCountry: string; items: typeof cart }>);

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [storeId, { storeName, storeCountry, items }] of Object.entries(itemsByStore)) {
        const storeTotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

        // Generate UUID client-side to avoid needing SELECT permission
        const orderId = crypto.randomUUID();

        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: orderId,
            store_id: storeId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            customer_notes: customerNotes || null,
            total_amount: storeTotal,
          });

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

        const { data: store } = await supabase
          .from('stores')
          .select('payment_instructions')
          .eq('id', storeId)
          .single();

        setOrderPlaced({ storeName, paymentInstructions: store?.payment_instructions || null });
      }

      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order confirmation
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
        <header className="p-6 flex items-center justify-between">
          <div className="w-16" />
          <Link to="/" className="text-xl font-bold">happy2buy</Link>
          <div className="w-16" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-background/60 mb-8">Thank you for your order from {orderPlaced.storeName}</p>
          
          {orderPlaced.paymentInstructions && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 max-w-sm w-full text-left">
              <h3 className="font-medium mb-2">Payment Instructions</h3>
              <p className="text-background/80 whitespace-pre-wrap text-sm">{orderPlaced.paymentInstructions}</p>
            </div>
          )}

          <p className="text-sm text-background/60 mb-6">
            The seller will contact you soon to confirm your order.
          </p>

          <Button onClick={() => navigate('/')} className="h-12 rounded-xl px-8">
            Continue Shopping
          </Button>
        </main>
      </div>
    );
  }

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

  const firstStoreCountry = Object.values(itemsByStore)[0]?.storeCountry || 'IN';

  // Checkout form
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
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Checkout</h1>
              <p className="text-background/60">Complete your order</p>
            </div>

            {/* Order Summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-medium mb-3">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm py-1">
                  <span className="text-background/80">{item.productName} × {item.quantity}</span>
                  <span>{formatPrice(item.productPrice * item.quantity, item.storeCountry)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total, firstStoreCountry)}</span>
              </div>
            </div>

            {/* Customer Details */}
            <form onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-background/80">Your name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-background/80">Phone number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-background/80">Delivery address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-background/80">Order notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-base font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Place Order'
                )}
              </Button>

              <p className="text-xs text-background/40 text-center">
                Payment instructions will be shown after you place your order.
              </p>
            </form>
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
                            className="ml-auto w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
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
