import { useState, useEffect } from 'react';
import { ShoppingBag, Store } from 'lucide-react';
import { CustomerView } from '@/components/landing/CustomerView';
import { SellerView } from '@/components/landing/SellerView';
import { Footer } from '@/components/landing/Footer';
import { cn } from '@/lib/utils';
export default function Index() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | null>(null);
  useEffect(() => {
    document.title = selectedRole === 'seller' ? 'Simple store' : 'happy shopin';
  }, [selectedRole]);
  return <div className="min-h-screen flex flex-col bg-surface-inverse text-background">
      {/* Header */}
      <header className="p-6 text-center">
        <button onClick={() => setSelectedRole(null)} className="text-xl font-bold hover:opacity-80 transition-opacity">
          happy2buy
        </button>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero section - always visible when no role selected */}
        {selectedRole === null && <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="text-center space-y-6 max-w-lg w-full">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">happy shopn'</h2>
              
              <p className="text-background/60 text-lg">Shop from trusted sellers.</p>

              {/* Role selection buttons */}
              <div className="space-y-4 pt-8">
                <button onClick={() => setSelectedRole('customer')} className={cn("w-full flex items-center justify-between px-6 py-5 rounded-2xl", "bg-background/5 border border-customer/30", "text-lg font-medium text-background/90", "transition-all duration-300 hover:bg-customer/10 hover:border-customer/50")}>
                  <span>I'm a Customer</span>
                  <ShoppingBag className="h-6 w-6 text-customer" />
                </button>

                <button onClick={() => setSelectedRole('seller')} className={cn("w-full flex items-center justify-between px-6 py-5 rounded-2xl", "bg-background/5 border border-primary/30", "text-lg font-medium text-background/90", "transition-all duration-300 hover:bg-primary/10 hover:border-primary/50")}>
                  <span>I'm a Seller</span>
                  <Store className="h-6 w-6 text-primary" />
                </button>
              </div>
            </div>
          </div>}

        {/* Content after selection */}
        {selectedRole === 'customer' && <div className="flex-1 bg-background text-foreground">
            <CustomerView />
          </div>}
        {selectedRole === 'seller' && <SellerView />}
      </main>

      <Footer dark />
    </div>;
}