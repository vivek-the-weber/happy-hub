import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppBarProps {
  whatsappNumber: string | null;
  storeName: string;
}

export function WhatsAppBar({ whatsappNumber, storeName }: WhatsAppBarProps) {
  if (!whatsappNumber) {
    return null;
  }

  const handleClick = () => {
    const message = encodeURIComponent(`Hi! I'm interested in your products from ${storeName}`);
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40 flex justify-center">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-white/20 rounded-full text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Contact on WhatsApp
      </button>
    </div>
  );
}
