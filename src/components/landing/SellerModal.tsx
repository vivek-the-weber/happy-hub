import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Store, Package, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StepCardProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isVisible: boolean;
}

function StepCard({ icon, label, onClick, isVisible }: StepCardProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card transition-all duration-300 text-left group animate-scale-in shadow-lg hover:shadow-xl cursor-pointer"
      )}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <p className="font-semibold text-lg">{label}</p>
    </button>
  );
}

export function SellerModal({ open, onOpenChange }: SellerModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setCompletedSteps([]);
    }
  }, [open]);

  const handleStepClick = (step: number) => {
    if (step !== currentStep) return;

    if (step === 4) {
      // Final step - trigger confetti and redirect
      setCompletedSteps(prev => [...prev, step]);
      
      // Fire confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6']
      });

      // Additional confetti bursts
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#10b981', '#14b8a6']
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#06b6d4', '#3b82f6', '#8b5cf6']
        });
      }, 400);

      // Redirect after celebration
      setTimeout(() => {
        onOpenChange(false);
        navigate('/auth?mode=signup');
      }, 1500);
    } else {
      // Mark step as completed and reveal next step
      setCompletedSteps(prev => [...prev, step]);
      setCurrentStep(step + 1);
    }
  };

  const steps = [
    {
      step: 1,
      icon: <UserPlus className="h-5 w-5" />,
      label: "Sign up",
      microText: "Create your free seller account"
    },
    {
      step: 2,
      icon: <Store className="h-5 w-5" />,
      label: "Set up your store",
      microText: "Store name, store link and WhatsApp number"
    },
    {
      step: 3,
      icon: <Package className="h-5 w-5" />,
      label: "Add your product",
      microText: "Name, price and photo — that's it"
    },
    {
      step: 4,
      icon: <Share2 className="h-5 w-5" />,
      label: "Sell to the world 🌍",
      microText: "Share on Instagram, WhatsApp, anywhere"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm mx-4 p-0 border-0 bg-transparent shadow-none" blur>
        {steps.map((stepData) => (
          <StepCard
            key={stepData.step}
            icon={stepData.icon}
            label={stepData.label}
            onClick={() => handleStepClick(stepData.step)}
            isVisible={stepData.step === currentStep}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
}
