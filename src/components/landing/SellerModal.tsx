import { useNavigate } from 'react-router-dom';
import { UserPlus, Store, Package, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StepCardProps {
  step: number;
  icon: React.ReactNode;
  label: string;
  microText: string;
  onClick: () => void;
}

function StepCard({ step, icon, label, microText, onClick }: StepCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Step {step}</span>
        </div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{microText}</p>
      </div>
    </button>
  );
}

export function SellerModal({ open, onOpenChange }: SellerModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStep = (loggedInPath: string, loggedOutPath: string = '/auth?mode=signup') => {
    onOpenChange(false);
    if (user) {
      navigate(loggedInPath);
    } else {
      navigate(loggedOutPath);
    }
  };

  const handleCreateStore = () => {
    onOpenChange(false);
    navigate('/auth?mode=signup');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Start selling in 4 simple steps</DialogTitle>
          <DialogDescription>
            It takes less than 5 minutes to get your store live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <StepCard
            step={1}
            icon={<UserPlus className="h-5 w-5" />}
            label="Sign up"
            microText="Create your free seller account"
            onClick={() => handleStep('/dashboard', '/auth?mode=signup')}
          />
          
          <StepCard
            step={2}
            icon={<Store className="h-5 w-5" />}
            label="Set up your store"
            microText="Store name, store link and WhatsApp number"
            onClick={() => handleStep('/onboarding')}
          />
          
          <StepCard
            step={3}
            icon={<Package className="h-5 w-5" />}
            label="Add your product"
            microText="Name, price and photo — that's it"
            onClick={() => handleStep('/dashboard')}
          />
          
          <StepCard
            step={4}
            icon={<Share2 className="h-5 w-5" />}
            label="Sell to the world 🌍"
            microText="Share on Instagram, WhatsApp, anywhere"
            onClick={() => handleStep('/dashboard')}
          />
        </div>

        <Button 
          onClick={handleCreateStore} 
          className="w-full"
          size="lg"
        >
          Create my free store
        </Button>
      </DialogContent>
    </Dialog>
  );
}
