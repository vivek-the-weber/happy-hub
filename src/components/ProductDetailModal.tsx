import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, ShoppingBag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/hooks/useStore';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  storeName: string;
  storeId: string;
  storeCountry: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  storeName,
  storeId,
  storeCountry,
  open,
  onOpenChange,
}: ProductDetailModalProps) {
  const { addToCart, itemCount } = useCart();
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  if (!open || !product) return null;

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
      productImage: allImages[0] || null,
      storeId: storeId,
      storeName,
      storeCountry,
    });
    toast.success('Added to cart!');
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black flex items-center justify-between px-4 h-14">
        <button
          onClick={() => onOpenChange(false)}
          className="p-2 -ml-2 text-white hover:text-white/80 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/cart" className="relative p-2 -mr-2 text-white hover:text-white/80 transition-colors">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </header>

      {/* Scrollable content */}
      <div className="overflow-y-auto h-[calc(100vh-56px-88px)]">
        {/* Image with white bg */}
        <div className="px-4 pt-2">
          <div className="bg-white rounded-2xl overflow-hidden relative">
            {allImages.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {allImages.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-[4/3]">
                        <img
                          src={imageUrl}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400">
                No image
              </div>
            )}

            {!product.is_available && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-lg font-medium text-white">Sold out</span>
              </div>
            )}
          </div>
        </div>

        {/* Product info */}
        <div className="px-4 pt-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            <p className="text-xl font-semibold text-primary mt-1">
              {formatPrice(product.price, storeCountry)}
            </p>
          </div>

          {product.description && (
            <>
              <Separator className="bg-neutral-800" />

              <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-white hover:text-white/80 transition-colors">
                  <span className="font-medium">Description</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      descriptionOpen && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <p className="text-neutral-400 pb-4 leading-relaxed">
                    {product.description}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-neutral-800">
        <Button
          onClick={handleAddToCart}
          disabled={!product.is_available}
          className="w-full rounded-full h-12 text-base"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add to cart
        </Button>
      </div>
    </div>
  );
}
