import { Link } from 'react-router-dom';
import { ArrowRight, Store, ShoppingBag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { StoreCard } from '@/components/StoreCard';
import { useFeaturedStores } from '@/hooks/useStore';

export default function Index() {
  const { data: stores, isLoading } = useFeaturedStores();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-balance mb-6">
            Sell online, the simple way
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-balance">
            Create your online store in minutes. Perfect for Instagram and WhatsApp sellers who want to keep things simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto">
                Create Your Store
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 border-t">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <Store className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Simple Product Catalog</h3>
            <p className="text-sm text-muted-foreground">
              Add your products with photos and prices. No complicated options.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Receive Orders</h3>
            <p className="text-sm text-muted-foreground">
              Customers order directly from your store. You get notified with their details.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Share Your Link</h3>
            <p className="text-sm text-muted-foreground">
              Get a simple link to share on Instagram, WhatsApp, or anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      {!isLoading && stores && stores.length > 0 && (
        <section className="container py-16 border-t">
          <h2 className="text-2xl font-bold mb-8 text-center">Browse Stores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 happy2buy. Made for small sellers with ❤️</p>
        </div>
      </footer>
    </div>
  );
}
