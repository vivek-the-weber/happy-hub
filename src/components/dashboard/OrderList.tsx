import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, Order, useStoreOrders, useOrderItems, useUpdateOrderStatus } from '@/hooks/useStore';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';

interface OrderListProps {
  store: Store;
}

const statusColors: Record<Order['status'], string> = {
  pending_payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  on_hold: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
};


export function OrderList({ store }: OrderListProps) {
  const { data: orders, isLoading } = useStoreOrders(store.id);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8 text-background/60">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl py-12">
        <div className="text-center">
          <p className="text-background/60">No orders yet</p>
          <p className="text-sm text-background/40 mt-1">
            Share your store link to start receiving orders!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-background">Orders</h2>
        <p className="text-sm text-background/60">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          storeId={store.id}
          storeCountry={store.country}
          isExpanded={expandedOrder === order.id}
          onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
        />
      ))}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  storeId: string;
  storeCountry: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function OrderCard({ order, storeId, storeCountry, isExpanded, onToggle }: OrderCardProps) {
  const { data: items } = useOrderItems(isExpanded ? order.id : undefined);
  const updateStatus = useUpdateOrderStatus();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (status: Order['status']) => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status, storeId });
      toast.success(`Order marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors" 
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h3 className="font-medium text-background truncate">{order.customer_name}</h3>
              <p className="text-sm text-background/50">{formatDate(order.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-semibold text-background">{formatPrice(order.total_amount, storeCountry)}</span>
            <Badge className={`${statusColors[order.status]} border text-xs`}>{order.status}</Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-background/60 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-background/60 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Customer Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-background/70">
              <Phone className="h-4 w-4" />
              <a href={`tel:${order.customer_phone}`} className="hover:text-primary transition-colors">
                {order.customer_phone}
              </a>
            </div>
            <div className="flex items-start gap-2 text-background/70">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>{order.customer_address}</span>
            </div>
            {order.customer_notes && (
              <div className="flex items-start gap-2 text-background/70">
                <MessageSquare className="h-4 w-4 mt-0.5" />
                <span>{order.customer_notes}</span>
              </div>
            )}
          </div>


          {/* Order Items */}
          {items && items.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-background/80 mb-2">Items</p>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-background">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="text-background/60">
                      {formatPrice(item.product_price * item.quantity, storeCountry)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-background/80">Update status:</span>
              <Select value={order.status} onValueChange={(value) => handleStatusChange(value as Order['status'])}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-background rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-foreground border-white/10">
                  <SelectItem value="pending_payment" className="text-background hover:bg-white/5">Pending Payment</SelectItem>
                  <SelectItem value="on_hold" className="text-background hover:bg-white/5">On Hold</SelectItem>
                  <SelectItem value="confirmed" className="text-background hover:bg-white/5">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
