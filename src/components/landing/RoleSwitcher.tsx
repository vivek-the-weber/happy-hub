import { cn } from '@/lib/utils';

interface RoleSwitcherProps {
  selected: 'customer' | 'seller' | null;
  onSelect: (role: 'customer' | 'seller') => void;
  className?: string;
}

export function RoleSwitcher({ selected, onSelect, className }: RoleSwitcherProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 justify-center", className)}>
      <button
        onClick={() => onSelect('customer')}
        className={cn(
          "px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300",
          "border backdrop-blur-sm animate-float",
          selected === 'customer'
            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-purple-400/50 text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            : "bg-white/5 border-purple-500/30 text-white/90 hover:bg-purple-500/10 hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
        )}
      >
        I'm a Customer
      </button>
      
      <button
        onClick={() => onSelect('seller')}
        className={cn(
          "px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300",
          "border backdrop-blur-sm animate-float [animation-delay:1s]",
          selected === 'seller'
            ? "bg-gradient-to-r from-green-500/20 to-teal-500/20 border-green-400/50 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]"
            : "bg-white/5 border-green-500/30 text-white/90 hover:bg-green-500/10 hover:border-green-400/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
        )}
      >
        I'm a Seller
      </button>
    </div>
  );
}