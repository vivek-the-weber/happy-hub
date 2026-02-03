import { ImageIcon } from 'lucide-react';
import { Product } from '@/hooks/useStore';
import { formatPrice } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
  storeName: string;
  storeId: string;
  storeCountry: string;
  onClick?: () => void;
}

export function ProductCard({ product, storeCountry, onClick }: ProductCardProps) {
  // Use first image from image_urls array, fallback to image_url for backward compatibility
  const displayImage = product.image_urls?.[0] || product.image_url;
  const imageCount = product.image_urls?.length || (product.image_url ? 1 : 0);

  return (
    <div className="cursor-pointer group" onClick={onClick}>
      <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 relative">
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {imageCount > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{imageCount - 1}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
            <ImageIcon className="h-8 w-8 mb-2" />
            <span className="text-xs uppercase tracking-wider">Coming Soon</span>
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <span className="text-sm font-medium text-white">Sold out</span>
          </div>
        )}
      </div>
      <h3 className="text-white text-sm mt-3 line-clamp-1 font-medium">{product.name}</h3>
      <p className="text-primary font-semibold">
        {formatPrice(product.price, storeCountry)}
      </p>
    </div>
  );
}
