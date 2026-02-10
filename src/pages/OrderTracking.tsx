import { useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Loader2, Clock, AlertTriangle, CheckCircle, Copy, Check, Phone, Bookmark } from 'lucide-react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { formatPrice } from '@/lib/currency';

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { data, isLoading, error } = useOrderTracking(orderId, token);
  const [copiedField, setCopiedField] = useState<'code' | null>(null);

  const handleCopy = useCallback((value: string, field: 'code') => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-background/60">Loading order details...</p>
      </div>
    );
  }

  // Not found / invalid token
  if (error || !data?.order) {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
        <header className="p-6 flex items-center justify-center">
          <Link to="/" className="text-xl font-bold">happy2buy</Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-background/40" />
          </div>
          <h1 className="text-xl font-bold mb-2">Order not found</h1>
          <p className="text-background/60 mb-8 text-sm">This link is invalid or the order does not exist.</p>
        </main>
      </div>
    );
  }

  const { order, storeName, storeCountry, storePhone } = data;

  return (
    <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
      <header className="p-6 flex items-center justify-center">
        <Link to="/" className="text-xl font-bold">happy2buy</Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-4 pb-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Status Icon + Message */}
          {order.status === 'pending_payment' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <h1 className="text-xl font-bold mb-1">Payment Confirmation Pending</h1>
              <p className="text-background/60 text-sm">
                Your order is awaiting payment confirmation from the shop.
              </p>
            </div>
          )}

          {order.status === 'on_hold' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
              <h1 className="text-xl font-bold mb-1">Order on Hold</h1>
              <p className="text-background/60 text-sm">
                The shop has raised a payment clarification. Please contact the shop directly to resolve this.
              </p>
            </div>
          )}

          {order.status === 'confirmed' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-xl font-bold mb-1">Order Confirmed</h1>
              <p className="text-background/60 text-sm">
                Your order has been confirmed by the shop.
              </p>
            </div>
          )}

          {/* Order Details */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-background/60">Shop</span>
              <span className="text-background font-medium">{storeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-background/60">Order ID</span>
              <span className="text-background font-mono text-xs">{order.id.slice(0, 8)}…</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-background/60">Amount</span>
              <span className="text-background font-semibold">{formatPrice(order.total_amount, storeCountry)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-background/60">Payment Code</span>
              <div className="flex items-center gap-1.5">
                <span className="text-background font-mono font-semibold tracking-wider">{order.payment_code}</span>
                <button
                  onClick={() => handleCopy(order.payment_code, 'code')}
                  className="text-background/40 hover:text-background/60 transition-colors p-0.5"
                  aria-label="Copy payment code"
                >
                  {copiedField === 'code' ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Shop - shown on hold */}
          {order.status === 'on_hold' && storePhone && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
              <p className="text-sm font-medium text-background mb-3">Contact the shop</p>
              <a
                href={`tel:${storePhone}`}
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium"
              >
                <Phone className="h-4 w-4" />
                {storePhone}
              </a>
            </div>
          )}

          {/* Bookmark note */}
          <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Bookmark className="h-4 w-4 text-background/40 mt-0.5 shrink-0" />
            <p className="text-background/50 text-xs leading-relaxed">
              Please bookmark this page to track your order. This is your only way to check the status.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
