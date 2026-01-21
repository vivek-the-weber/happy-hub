import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerModal } from './SellerModal';

export function SellerView() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="py-16 px-4">
      <div className="max-w-xl mx-auto text-center space-y-8">
        <p className="text-lg text-muted-foreground">
          No complicated setup. No technical skills needed.
          Just your products and a link to share.
        </p>
        
        <Button 
          size="lg" 
          onClick={() => setModalOpen(true)}
          className="text-lg px-8 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          Ready to sell? Create your store
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <SellerModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </div>
  );
}
