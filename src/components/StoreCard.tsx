import { Link } from 'react-router-dom';
import { Store as StoreIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Store } from '@/hooks/useStore';

interface StoreCardProps {
  store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link to={`/store/${store.slug}`}>
      <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <StoreIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{store.name}</h3>
            {store.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {store.bio}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
