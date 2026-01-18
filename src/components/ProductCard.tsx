import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/hooks/useStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  storeName: string;
}

export function ProductCard({ product, storeName }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.image_url,
      storeId: product.store_id,
      storeName,
    });
    toast.success('Added to cart!');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Card className="overflow-hidden group">
      <div className="aspect-square bg-muted relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-medium">Sold out</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-lg font-semibold text-primary mb-3">
          {formatPrice(product.price)}
        </p>
        <Button 
          onClick={handleAddToCart} 
          disabled={!product.is_available}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add to cart
        </Button>
      </div>
    </Card>
  );
}
