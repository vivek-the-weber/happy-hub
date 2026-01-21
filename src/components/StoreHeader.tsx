import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/hooks/useCart';
import { Store } from '@/hooks/useStore';

interface StoreHeaderProps {
  store: Store;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container flex items-center justify-between h-14">
        <Link to={`/store/${store.slug}`} className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={store.logo_url || undefined} alt={store.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {store.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-lg font-bold">{store.name}</span>
        </Link>

        <Link to="/cart" className="relative p-2">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
