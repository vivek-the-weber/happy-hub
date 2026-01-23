import { HelpCircle, ShieldCheck, Package, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
function AnimatedSection({
  children
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.2
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} className={cn("space-y-4 transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
      {children}
    </section>;
}
export function CustomerView() {
  return <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-12">
        
        {/* What is happy2buy */}
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Info className="h-5 w-5 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-semibold">What is happy2buy?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">happy2buy is a platform where small sellers create online stores so you can shop directly from them.</p>
        </AnimatedSection>

        {/* How ordering works */}
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-semibold">How ordering works</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            When you place an order, it goes directly to the store you ordered from.
            The store owner contacts you for payment and delivery details.
          </p>
        </AnimatedSection>

        {/* Transparency & trust */}
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Transparency and trust</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Each store clearly shows its contact details.
            You always know who you are buying from.
          </p>
          <p className="text-sm text-muted-foreground/70 italic">
            happy2buy does not handle payments or deliveries.
          </p>
        </AnimatedSection>

        {/* Need help */}
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Need help?</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about an order, contact the store directly.
            For platform-related issues, reach happy2buy support.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a href="mailto:support@happy2buy.in" className="text-sm text-primary hover:underline">
              support@happy2buy.in
            </a>
            <a href="https://instagram.com/happy2buy" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              Instagram
            </a>
            <a href="https://twitter.com/happy2buy" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              Twitter/X
            </a>
          </div>
        </AnimatedSection>

      </div>
    </div>;
}