import { useState } from 'react';
import { RoleSwitcher } from '@/components/landing/RoleSwitcher';
import { CustomerView } from '@/components/landing/CustomerView';
import { SellerView } from '@/components/landing/SellerView';
import { Footer } from '@/components/landing/Footer';

export default function Index() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'seller' | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section - Dark background */}
      <section className="relative bg-foreground text-background">
        <div className="container py-20 md:py-32">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Brand */}
            <h1 className="text-2xl font-bold tracking-tight">happy2buy</h1>
            
            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
                Simple online stores for small sellers
              </h2>
              <p className="text-lg md:text-xl text-background/70">
                Create a store. Share a link. Receive orders.
              </p>
            </div>

            {/* Role Switcher */}
            <RoleSwitcher 
              selected={selectedRole} 
              onSelect={setSelectedRole}
              className="pt-4"
            />
          </div>
        </div>
      </section>

      {/* Content Section - Switches based on role */}
      <main className="flex-1">
        {selectedRole === 'customer' && <CustomerView />}
        {selectedRole === 'seller' && <SellerView />}
        
        {/* Prompt to select if nothing selected */}
        {!selectedRole && (
          <div className="py-16 px-4 text-center">
            <p className="text-muted-foreground">
              Choose an option above to learn more
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
