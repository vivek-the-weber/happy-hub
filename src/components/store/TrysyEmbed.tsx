import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Trysy?: {
      init: (cfg: { storeId: string; apiKey: string }) => void;
      _initialized?: string;
    };
  }
}

const SDK_URL = 'https://trysy.lovable.app/sdk.js';
const SCRIPT_ID = 'trysy-sdk-script';

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Trysy) return resolve();
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Trysy SDK failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Trysy SDK failed to load'));
    document.head.appendChild(s);
  });
}

interface TrysyEmbedProps {
  storeId: string | undefined;
}

/**
 * Loads the Trysy SDK and initializes it for the given store
 * if the seller has Trysy enabled. Renders nothing.
 */
export function TrysyEmbed({ storeId }: TrysyEmbedProps) {
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_trysy_public_config', {
          p_store_id: storeId,
        });
        if (cancelled || error || !data || data.length === 0) return;

        const cfg = data[0] as { trysy_store_id: string; trysy_api_key: string };
        if (!cfg.trysy_store_id || !cfg.trysy_api_key) return;

        await loadSdk();
        if (cancelled) return;

        if (window.Trysy && window.Trysy._initialized !== cfg.trysy_store_id) {
          window.Trysy.init({
            storeId: cfg.trysy_store_id,
            apiKey: cfg.trysy_api_key,
          });
          window.Trysy._initialized = cfg.trysy_store_id;
        }
      } catch (err) {
        console.warn('[Trysy] init failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return null;
}
