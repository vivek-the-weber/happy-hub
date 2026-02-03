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
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 p-4 z-40">
      <Button
        onClick={handleClick}
        className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium"
        size="lg"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Contact on WhatsApp
      </Button>
    </div>
  );
}
