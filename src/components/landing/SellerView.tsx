import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerModal } from './SellerModal';
export function SellerView() {
  const [modalOpen, setModalOpen] = useState(false);
  return <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
      <div className="text-center space-y-10 max-w-lg">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Simple<br />stores.</h1>
        
        <Button size="lg" onClick={() => setModalOpen(true)} className="w-full text-lg py-7 h-auto rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">
          Create your store
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-muted-foreground text-lg">Quick setup. Start selling.</p>
      </div>

      <SellerModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>;
}