import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Trysy?: {
      init: (cfg: TrysyInitConfig) => void;
    };
  }
}

interface TrysyProduct {
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
}

interface TrysyOrderPayload {
  external_order_id: string;
  products: TrysyProduct[];
  total_order_value: number;
  trysy_fee: number;
}

interface TrysyInitConfig {
  storeId: string;
  apiKey: string;
  mount: string | HTMLElement;
  order: TrysyOrderPayload;
}

const SDK_URL = 'https://trysy.lovable.app/api/public/sdk.js';
const SCRIPT_ID = 'trysy-sdk-script';
const MOUNT_ID = 'trysy-mount';

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

interface TrysyCheckoutProps {
  storeId: string | undefined;
  externalOrderId: string;
  products: TrysyProduct[];
  totalOrderValue: number;
  onOrderCreated?: (trysyOrderId: string) => void;
}

/**
 * Loads the Trysy SDK on the checkout step and mounts the
 * "Enable try-at-home" checkbox if the seller has Trysy enabled.
 */
export function TrysyCheckout({
  storeId,
  externalOrderId,
  products,
  totalOrderValue,
  onOrderCreated,
}: TrysyCheckoutProps) {
  const [config, setConfig] = useState<{ storeId: string; apiKey: string; fee: number } | null>(
    null
  );
  const [sdkReady, setSdkReady] = useState(false);
  const initedRef = useRef(false);

  // Fetch seller config once per storeId
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_trysy_public_config', {
        p_store_id: storeId,
      });
      if (cancelled || error || !data || data.length === 0) return;
      const row = data[0] as { trysy_store_id: string; trysy_api_key: string };
      if (!row.trysy_store_id || !row.trysy_api_key) return;
      setConfig({ storeId: row.trysy_store_id, apiKey: row.trysy_api_key, fee: 99 });
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  // Load SDK once config is known
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    loadSdk()
      .then(() => {
        if (!cancelled) setSdkReady(true);
      })
      .catch((err) => console.warn('[Trysy] SDK load failed:', err));
    return () => {
      cancelled = true;
    };
  }, [config]);

  // Init / re-init when payload changes
  useEffect(() => {
    if (!config || !sdkReady || !window.Trysy) return;
    const mountEl = document.getElementById(MOUNT_ID);
    if (!mountEl) return;
    try {
      window.Trysy.init({
        storeId: config.storeId,
        apiKey: config.apiKey,
        mount: `#${MOUNT_ID}`,
        order: {
          external_order_id: externalOrderId,
          products,
          total_order_value: totalOrderValue,
          trysy_fee: config.fee,
        },
      });
      initedRef.current = true;
    } catch (err) {
      console.warn('[Trysy] init failed:', err);
    }
  }, [config, sdkReady, externalOrderId, products, totalOrderValue]);

  // Listen for order-created event
  useEffect(() => {
    if (!onOrderCreated) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { trysy_order_id?: string } | undefined;
      if (detail?.trysy_order_id) onOrderCreated(detail.trysy_order_id);
    };
    window.addEventListener('trysy:order-created', handler);
    return () => window.removeEventListener('trysy:order-created', handler);
  }, [onOrderCreated]);

  if (!config) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div id={MOUNT_ID} />
    </div>
  );
}
