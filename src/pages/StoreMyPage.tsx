import { useState, useEffect, useRef } from 'react';
import { StoreHeader } from '@/components/StoreHeader';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { StoreFooter } from '@/components/store/StoreFooter';
import { WhatsAppBar } from '@/components/store/WhatsAppBar';
import { useStoreBySlug, useStoreProducts, Product } from '@/hooks/useStore';
import { Star } from 'lucide-react';

// Scroll-triggered reveal wrapper
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

const TESTIMONIALS = [
  { name: 'Priya S.', quote: 'Absolutely love the quality! Will definitely order again.', rating: 5 },
  { name: 'Rahul M.', quote: 'Fast delivery and the product was exactly as shown. Great experience.', rating: 5 },
  { name: 'Ananya K.', quote: 'Beautiful packaging and amazing customer service. Highly recommend!', rating: 4 },
];

export default function StoreMyPage() {
  const slug = 'storemy';
  const { data: store, isLoading: storeLoading } = useStoreBySlug(slug);
  const { data: products, isLoading: productsLoading } = useStoreProducts(store?.id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const productsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (store) document.title = store.name;
    return () => { document.title = 'Happy2Buy'; };
  }, [store]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const availableProducts = products?.filter(p => p.is_available) || [];

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-50 bg-black">
          <div className="container flex items-center h-14 px-4">
            <span className="text-neutral-500">Loading...</span>
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
    <div className="min-h-screen bg-black text-white">
      <StoreHeader store={store} />

      {/* ── Hero Section ── */}
      <Reveal>
        <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 md:py-44">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-4">
            {store.name}
          </h1>
          {store.bio && (
            <p className="text-neutral-400 text-lg md:text-xl max-w-lg mb-8">
              {store.bio}
            </p>
          )}
          <button
            onClick={scrollToProducts}
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Shop Now
          </button>
        </section>
      </Reveal>

      {/* ── Product Showcase ── */}
      <section ref={productsRef} className="px-4 md:px-8 py-16">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Collection</h2>
        </Reveal>

        {productsLoading ? (
          <div className="text-center text-neutral-500 py-8">Loading products...</div>
        ) : availableProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {availableProducts.map((product, i) => (
              <Reveal key={product.id} className={`delay-[${i * 100}ms]`}>
                <ProductCard
                  product={product}
                  storeName={store.name}
                  storeId={store.id}
                  storeCountry={store.country}
                  onClick={() => handleProductClick(product)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── About Section ── */}
      <Reveal>
        <section className="px-6 md:px-8 py-20 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
            We believe in curating products that bring joy and quality to everyday life.
            Every item in our collection is hand-picked with care, ensuring you get nothing but the best.
            Our mission is simple — deliver exceptional products with a personal touch that makes every purchase feel special.
          </p>
        </section>
      </Reveal>

      {/* ── Testimonials ── */}
      <section className="px-4 md:px-8 py-16">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed">"{t.quote}"</p>
                <span className="text-xs text-neutral-500 font-medium">{t.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── WhatsApp + Footer ── */}
      <WhatsAppBar whatsappNumber={store.whatsapp_number} storeName={store.name} />
      <StoreFooter storeName={store.name} />

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
