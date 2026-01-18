import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Group cart items by store
  const itemsByStore = cart.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = { storeName: item.storeName, items: [] };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; items: typeof cart }>);

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Place orders for each store separately
      for (const [storeId, { storeName, items }] of Object.entries(itemsByStore)) {
        const storeTotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

        // Create the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            store_id: storeId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            customer_notes: customerNotes || null,
            total_amount: storeTotal,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          product_price: item.productPrice,
          quantity: item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Get store payment instructions
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

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your order from {orderPlaced.storeName}.
          </p>
          
          {orderPlaced.paymentInstructions && (
            <Card className="mb-6 text-left">
              <CardHeader>
                <CardTitle className="text-base">Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{orderPlaced.paymentInstructions}</p>
              </CardContent>
            </Card>
          )}
          
          <p className="text-sm text-muted-foreground mb-6">
            The seller will contact you soon to confirm your order and arrange delivery.
          </p>
          
          <Link to="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link to="/">
            <Button variant="outline">Browse Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCheckout(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to cart
          </Button>
          
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatPrice(item.productPrice * item.quantity)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Full address for delivery"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions?"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Payment instructions will be shown after you place your order.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        
        {Object.entries(itemsByStore).map(([storeId, { storeName, items }]) => (
          <Card key={storeId} className="mb-4">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                From {storeName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img 
                        src={item.productImage} 
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{item.productName}</h3>
                    <p className="text-sm text-primary font-semibold">
                      {formatPrice(item.productPrice)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 ml-auto text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-lg font-semibold mb-4">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Button className="w-full" onClick={() => setIsCheckout(true)}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
