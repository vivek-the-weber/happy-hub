import { useState } from 'react';
import { RoleSwitcher } from '@/components/landing/RoleSwitcher';
import { CustomerView } from '@/components/landing/CustomerView';
import { SellerView } from '@/components/landing/SellerView';
import { Footer } from '@/components/landing/Footer';

export default function Index() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Floating overlay - only when no role selected */}
      {selectedRole === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground">
          <div className="text-center space-y-8 px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-background">happy2buy</h1>
            <p className="text-background/70 text-lg">Simple online stores for small sellers</p>
            <RoleSwitcher 
              selected={selectedRole} 
              onSelect={setSelectedRole}
              className="pt-4"
            />
          </div>
        </div>
      )}

      {/* Content - shows after selection */}
      {selectedRole !== null && (
        <>
          {/* Simple header with brand */}
          <header className="p-6 border-b">
            <h1 className="text-xl font-bold">happy2buy</h1>
          </header>

          <main className="flex-1">
            {selectedRole === 'customer' && <CustomerView />}
            {selectedRole === 'seller' && <SellerView />}
          </main>

          <Footer />
        </>
      )}
    </div>
  );
}