import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Store } from '@/hooks/useStore';

interface StoreHeaderProps {
  store: Store;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-black">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to={`/store/${store.slug}`} className="flex items-center">
          <span className="text-lg font-bold text-white">{store.name}</span>
        </Link>

        <Link to="/cart" className="relative p-2 text-white">
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
