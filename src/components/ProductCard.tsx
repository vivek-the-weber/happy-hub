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

  // Use first image from image_urls array, fallback to image_url for backward compatibility
  const displayImage = product.image_urls?.[0] || product.image_url;
  const imageCount = product.image_urls?.length || (product.image_url ? 1 : 0);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: displayImage,
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
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {imageCount > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{imageCount - 1}
              </div>
            )}
          </>
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
