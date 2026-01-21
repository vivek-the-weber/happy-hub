import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderList({ store }: OrderListProps) {
  const { data: orders, isLoading } = useStoreOrders(store.id);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="py-12">
        <CardContent className="text-center">
          <p className="text-muted-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Share your store link to start receiving orders!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Orders</h2>
        <p className="text-sm text-muted-foreground">
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
    <Card>
      <CardHeader className="py-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-base">{order.customer_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{formatPrice(order.total_amount, storeCountry)}</span>
            <Badge className={statusColors[order.status]}>{order.status}</Badge>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Customer Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${order.customer_phone}`} className="hover:underline">
                {order.customer_phone}
              </a>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>{order.customer_address}</span>
            </div>
            {order.customer_notes && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4 mt-0.5" />
                <span>{order.customer_notes}</span>
              </div>
            )}
          </div>

          {/* Order Items */}
          {items && items.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Items</p>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="text-muted-foreground">
                      {formatPrice(item.product_price * item.quantity, storeCountry)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Update status:</span>
              <Select value={order.status} onValueChange={(value) => handleStatusChange(value as Order['status'])}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
