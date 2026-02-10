import { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';

interface ConfirmPaymentProps {
  store: Store;
}

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
}

type ViewState =
  | { type: 'input' }
  | { type: 'loading' }
  | { type: 'preview'; orderId: string; customerName: string; totalAmount: number; items: OrderItem[] }
  | { type: 'actioning' }
  | { type: 'success'; action: 'confirm' | 'hold'; orderId: string; customerName?: string; totalAmount?: number }
  | { type: 'error'; errorCode: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code: 'This payment code is invalid. Please check and try again.',
  already_processed: 'This order has already been processed.',
  not_authenticated: 'You must be signed in to confirm payments.',
};

export function ConfirmPayment({ store }: ConfirmPaymentProps) {
  const [code, setCode] = useState('');
  const [view, setView] = useState<ViewState>({ type: 'input' });
  const cooldownRef = useRef(false);

  const isValidCode = /^[A-Z0-9]{6}$/.test(code);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCode || cooldownRef.current) return;

    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    setView({ type: 'loading' });

    try {
      const { data, error } = await supabase.rpc('confirm_payment_by_code', {
        p_code: code,
        p_action: 'preview',
      } as any);

      if (error) throw error;

      const result = data as any;

      if (result.success && result.action === 'preview') {
        setView({
          type: 'preview',
          orderId: result.order_id,
          customerName: result.customer_name,
          totalAmount: result.total_amount,
          items: result.items || [],
        });
      } else {
        setView({ type: 'error', errorCode: result.error || 'unknown' });
      }
    } catch {
      setView({ type: 'error', errorCode: 'unknown' });
    }
  };

  const handleAction = async (action: 'confirm' | 'hold') => {
    setView({ type: 'actioning' });

    try {
      const { data, error } = await supabase.rpc('confirm_payment_by_code', {
        p_code: code,
        p_action: action,
      } as any);

      if (error) throw error;

      const result = data as any;

      if (result.success) {
        setView({
          type: 'success',
          action,
          orderId: result.order_id,
          customerName: result.customer_name,
          totalAmount: result.total_amount,
        });
      } else {
        setView({ type: 'error', errorCode: result.error || 'unknown' });
      }
    } catch {
      setView({ type: 'error', errorCode: 'unknown' });
    }
  };

  const reset = () => {
    setCode('');
    setView({ type: 'input' });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        {/* Input State */}
        {(view.type === 'input' || view.type === 'loading') && (
          <form onSubmit={handleLookup} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-background">Confirm Payment</h2>
              <p className="text-sm text-background/60">
                Enter the 6-character code from the buyer's UPI transaction note.
              </p>
            </div>

            <div className="space-y-2">
              <Input
                value={code}
                onChange={handleCodeChange}
                placeholder="ABC123"
                maxLength={6}
                autoComplete="off"
                disabled={view.type === 'loading'}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/30 h-14 rounded-xl text-center text-2xl font-mono tracking-[0.3em] uppercase focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={!isValidCode || view.type === 'loading'}
              className="w-full h-12 rounded-xl text-base"
            >
              {view.type === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Look Up Order'
              )}
            </Button>
          </form>
        )}

        {/* Preview State */}
        {(view.type === 'preview' || view.type === 'actioning') && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-background">Order Found</h2>
              <p className="text-sm text-background/60">Review details before taking action.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-background/60">Order ID</span>
                <span className="font-mono text-background">
                  {view.type === 'preview' ? view.orderId.slice(0, 8) : ''}…
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-background/60">Buyer</span>
                <span className="text-background">
                  {view.type === 'preview' ? view.customerName : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-background/60">Amount</span>
                <span className="font-semibold text-background">
                  {view.type === 'preview' ? formatPrice(view.totalAmount, store.country) : ''}
                </span>
              </div>
            </div>

            {/* Order Items */}
            {view.type === 'preview' && view.items.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm font-medium text-background/80 mb-2">Items</p>
                <div className="space-y-1">
                  {view.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-background">{item.product_name} × {item.quantity}</span>
                      <span className="text-background/60">{formatPrice(item.product_price * item.quantity, store.country)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => handleAction('confirm')}
                disabled={view.type === 'actioning'}
                className="flex-1 h-12 rounded-xl text-base bg-green-600 hover:bg-green-700 text-white"
              >
                {view.type === 'actioning' ? <Loader2 className="h-5 w-5 animate-spin" /> : '✓ Confirm Order'}
              </Button>
              <Button
                onClick={() => handleAction('hold')}
                disabled={view.type === 'actioning'}
                variant="outline"
                className="flex-1 h-12 rounded-xl text-base border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              >
                ⚠ Raise Issue
              </Button>
            </div>

            <Button onClick={reset} variant="ghost" className="w-full text-background/50 hover:text-background/70">
              Cancel
            </Button>
          </div>
        )}

        {/* Success State */}
        {view.type === 'success' && (
          <div className="space-y-6 text-center">
            {view.action === 'confirm' ? (
              <>
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 mb-2">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-background">Order confirmed successfully.</h2>
                </div>
                {view.customerName && view.totalAmount && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-background/60">Buyer</span>
                      <span className="text-background">{view.customerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-background/60">Amount</span>
                      <span className="font-semibold text-background">{formatPrice(view.totalAmount, store.country)}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/10 mb-2">
                  <AlertTriangle className="h-8 w-8 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold text-background">Order placed on hold.</h2>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl border-white/20 bg-white/5 text-background hover:bg-white/10">
              Process Another
            </Button>
          </div>
        )}

        {/* Error State */}
        {view.type === 'error' && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mb-2">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-background/80 text-sm">
                {ERROR_MESSAGES[view.errorCode] || 'Something went wrong. Please try again.'}
              </p>
            </div>

            <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl border-white/20 bg-white/5 text-background hover:bg-white/10">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
