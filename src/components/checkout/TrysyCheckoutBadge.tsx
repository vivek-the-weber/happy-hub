import { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrysyCheckoutBadgeProps {
  storeId: string | undefined;
}

/**
 * Visible "Try before you buy" badge shown on checkout
 * when the seller has Trysy enabled in their dashboard.
 */
export function TrysyCheckoutBadge({ storeId }: TrysyCheckoutBadgeProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('get_trysy_public_config', {
        p_store_id: storeId,
      });
      if (!cancelled && data && data.length > 0) setEnabled(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (!enabled) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
        <ShoppingBag className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-background flex items-center gap-1.5">
          Try before you buy
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </p>
        <p className="text-xs text-background/60 mt-0.5 leading-relaxed">
          Powered by Trysy — receive your order, try it on, and only pay for what you keep. A flat ₹99 try-on fee applies.
        </p>
      </div>
    </div>
  );
}
