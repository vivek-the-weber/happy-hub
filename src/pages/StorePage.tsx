import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, Truck, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { useStoreBySlug, useStoreProducts, Product } from '@/hooks/useStore';

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: store, isLoading: storeLoading } = useStoreBySlug(slug || '');
  const { data: products, isLoading: productsLoading } = useStoreProducts(store?.id);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center text-muted-foreground">
          Loading store...
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Store not found</h1>
          <p className="text-muted-foreground">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const availableProducts = products?.filter(p => p.is_available) || [];

  const handleWhatsAppContact = () => {
    if (store.whatsapp_number) {
      const message = encodeURIComponent(`Hi! I'm interested in your products from ${store.name}`);
      window.open(`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Store Header */}
      <section className="container py-8 border-b">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
          {store.bio && (
            <p className="text-muted-foreground mb-4">{store.bio}</p>
          )}
          {store.whatsapp_number && (
            <Button variant="outline" size="sm" onClick={handleWhatsAppContact}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact on WhatsApp
            </Button>
          )}
          
          {/* Shipping Info */}
          {(store.free_shipping || store.shipping_charge || store.estimated_delivery_time) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {store.free_shipping ? (
                <Badge variant="secondary" className="gap-1">
                  <Truck className="h-3 w-3" />
                  Free Shipping
                </Badge>
              ) : store.shipping_charge ? (
                <Badge variant="secondary" className="gap-1">
                  <Truck className="h-3 w-3" />
                  ₹{store.shipping_charge} shipping
                </Badge>
              ) : null}
              
              {store.estimated_delivery_time && (
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  Delivers in {store.estimated_delivery_time}
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="container py-8">
        {productsLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading products...
          </div>
        ) : availableProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                storeName={store.name}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}
      </section>

      <ProductDetailModal
        product={selectedProduct}
        storeName={store.name}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
