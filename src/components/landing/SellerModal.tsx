import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Store, Package, Share2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  isVisible: boolean;
  isCompleted: boolean;
  isClickable: boolean;
}

function StepCard({ step, icon, label, microText, onClick, isVisible, isCompleted, isClickable }: StepCardProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left group animate-fade-in",
        isCompleted 
          ? "border-primary/50 bg-primary/5" 
          : "border-border bg-card hover:bg-accent/50",
        !isClickable && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
        isCompleted 
          ? "bg-primary text-primary-foreground" 
          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
      )}>
        {isCompleted ? <Check className="h-5 w-5" /> : icon}
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
      <DialogContent className="sm:max-w-md" blur>
        <DialogHeader>
          <DialogTitle className="text-xl">Start selling in 4 simple steps</DialogTitle>
          <DialogDescription>
            Click each step to continue. It takes less than 5 minutes!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {steps.map((stepData) => (
            <StepCard
              key={stepData.step}
              {...stepData}
              onClick={() => handleStepClick(stepData.step)}
              isVisible={stepData.step <= currentStep}
              isCompleted={completedSteps.includes(stepData.step)}
              isClickable={stepData.step === currentStep && !completedSteps.includes(stepData.step)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progress: {completedSteps.length}/4 steps</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate('/auth?mode=signup');
            }}
          >
            Skip tutorial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
