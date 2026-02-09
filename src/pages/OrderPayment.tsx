import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrderPaymentDetails } from '@/hooks/useOrderPaymentDetails';
import { formatPrice } from '@/lib/currency';

export default function OrderPayment() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, error } = useOrderPaymentDetails(orderId);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-background/60">Loading payment details...</p>
      </div>
    );
  }

  // Not found or not in pending_payment
  if (error || !data?.order || data.order.status !== 'pending_payment') {
    return (
      <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
        <header className="p-6 flex items-center justify-center">
          <Link to="/" className="text-xl font-bold">happy2buy</Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-background/40" />
          </div>
          <h1 className="text-xl font-bold mb-2">Order not found or already processed</h1>
          <p className="text-background/60 mb-8 text-sm">This payment link is no longer valid.</p>
          <Button onClick={() => window.location.href = '/'} className="h-12 rounded-xl px-8">
            Go Home
          </Button>
        </main>
      </div>
    );
  }

  const { order, storeName, storeCountry } = data;
  const isExpired = order.code_status === 'expired';


  return (
    <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
      <header className="p-6 flex items-center justify-center">
        <Link to="/" className="text-xl font-bold">happy2buy</Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-4 pb-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Order confirmed icon */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-1">Order Placed!</h1>
            <p className="text-background/60 text-sm">Complete your payment to {storeName}</p>
          </div>

          {/* Amount */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-background/60 text-sm mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold">{formatPrice(order.total_amount, storeCountry)}</p>
          </div>

          {/* Payment Code */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-background/60 text-sm mb-2">Payment Code</p>
            <p className="text-3xl font-bold font-mono tracking-[0.3em] text-primary">
              {order.payment_code}
            </p>
            <p className="text-background/40 text-xs mt-3">
              This payment code is valid for a limited time.
            </p>
            <p className="text-green-400 font-semibold text-sm mt-4">
              ENTER THE CODE <span className="font-mono tracking-wider">{order.payment_code.toUpperCase()}</span> IN THE NOTE/REMARKS WHILE PAYING IN YOUR UPI APP
            </p>
          </div>

          {/* Seller UPI ID */}
          {order.seller_upi_id_snapshot && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-background/60 text-sm mb-1">Pay to UPI ID</p>
              <p className="font-medium font-mono text-sm break-all">{order.seller_upi_id_snapshot}</p>
            </div>
          )}

          {/* Expired warning */}
          {isExpired && (
            <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5 text-center">
              <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-2" />
              <p className="text-sm text-background/80">
                The payment code has expired. Your order will be confirmed after manual review.
              </p>
            </div>
          )}


          {/* Buyer instructions */}
          {!isExpired && (
            <div className="text-center space-y-1">
              <p className="text-background/50 text-xs leading-relaxed">
                Please pay the exact amount shown.
              </p>
              <p className="text-background/50 text-xs leading-relaxed">
                Do not change the payment note.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
