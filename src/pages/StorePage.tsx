import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { StoreHeader } from '@/components/StoreHeader';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CollectionTabs } from '@/components/store/CollectionTabs';
import { StoreFooter } from '@/components/store/StoreFooter';
import { WhatsAppBar } from '@/components/store/WhatsAppBar';
import { ThemeToggle } from '@/components/store/ThemeToggle';

import { useStoreBySlug, useStoreProducts, Product } from '@/hooks/useStore';
import { useStoreCollections, useCollectionProducts } from '@/hooks/useCollections';

interface StorePageProps {
  subdomainSlug?: string;
}

export default function StorePage({ subdomainSlug }: StorePageProps) {
  const { slug: pathSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || pathSlug || '';
  const { data: store, isLoading: storeLoading } = useStoreBySlug(slug);
  const { data: products, isLoading: productsLoading } = useStoreProducts(store?.id);
  const { data: collections } = useStoreCollections(store?.id);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Get product IDs for the selected collection
  const { data: collectionProductIds } = useCollectionProducts(selectedCollectionId || undefined);

  // Update page title to store name
  useEffect(() => {
    if (store) {
      document.title = store.name;
    }
    
    return () => {
      document.title = 'Happy2Buy';
    };
  }, [store]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  // Filter products based on selected collection
  const filteredProducts = useMemo(() => {
    const availableProducts = products?.filter(p => p.is_available) || [];
    
    if (!selectedCollectionId || !collectionProductIds) {
      return availableProducts;
    }
    
    return availableProducts.filter(p => collectionProductIds.includes(p.id));
  }, [products, selectedCollectionId, collectionProductIds]);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-50 bg-black">
          <div className="container flex items-center h-14 px-4">
            <span className="text-neutral-500">Loading store...</span>
          </div>
        </header>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-50 bg-black">
          <div className="container flex items-center h-14 px-4">
            <span className="text-lg font-bold text-white">Store not found</span>
          </div>
        </header>
        <div className="container py-16 text-center px-4">
          <h1 className="text-2xl font-bold mb-2 text-white">Store not found</h1>
          <p className="text-neutral-500">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <StoreHeader store={store} />
      
      {/* Collection Tabs */}
      {collections && collections.length > 0 && (
        <CollectionTabs
          collections={collections}
          selectedId={selectedCollectionId}
          onSelect={setSelectedCollectionId}
        />
      )}

      {/* Products */}
      <section className="px-4 py-6">
        {productsLoading ? (
          <div className="text-center text-neutral-500 py-8">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeName={store.name}
                storeId={store.id}
                storeCountry={store.country}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp Contact */}
      <WhatsAppBar whatsappNumber={store.whatsapp_number} storeName={store.name} />

      {/* Store Footer */}
      <StoreFooter storeName={store.name} />

      {/* Theme Toggle */}
      <ThemeToggle />



      <ProductDetailModal
        product={selectedProduct}
        storeName={store.name}
        storeId={store.id}
        storeCountry={store.country}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
