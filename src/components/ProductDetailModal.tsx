import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/hooks/useStore';
import { toast } from 'sonner';

interface ProductDetailModalProps {
  product: Product | null;
  storeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  storeName,
  open,
  onOpenChange,
}: ProductDetailModalProps) {
  const { addToCart } = useCart();

  if (!product) return null;

  // Collect all images
  const allImages = product.image_urls?.length
    ? product.image_urls
    : product.image_url
    ? [product.image_url]
    : [];

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: allImages[0],
      storeId: product.store_id,
      storeName,
    });
    toast.success('Added to cart!');
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

        {/* Image Carousel */}
        <div className="relative">
          {allImages.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {allImages.map((imageUrl, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          {!product.is_available && (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
              <span className="text-lg font-medium">Sold out</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4 pt-2">
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatPrice(product.price)}
            </p>
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className="w-full"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
