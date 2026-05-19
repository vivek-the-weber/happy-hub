import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTrysyConnection, useSaveTrysyConnection, useDisconnectTrysy } from '@/hooks/useTrysy';

interface TrysySettingsProps {
  store: { id: string };
}

export function TrysySettings({ store }: TrysySettingsProps) {
  const { data: connection, isLoading } = useTrysyConnection(store.id);
  const saveMutation = useSaveTrysyConnection();
  const disconnectMutation = useDisconnectTrysy();

  const [trysyStoreId, setTrysyStoreId] = useState('');
  const [trysyApiKey, setTrysyApiKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (connection) {
      setTrysyStoreId(connection.trysy_store_id);
      setTrysyApiKey(connection.trysy_api_key);
      setIsEnabled(connection.is_enabled);
    }
  }, [connection]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trysyStoreId.trim() || !trysyApiKey.trim()) {
      toast.error('Please enter both Trysy Store ID and API Key');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        storeId: store.id,
        trysy_store_id: trysyStoreId.trim(),
        trysy_api_key: trysyApiKey.trim(),
        is_enabled: isEnabled,
      });
      toast.success('Trysy connection saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Trysy? Your credentials will be removed.')) return;
    try {
      await disconnectMutation.mutateAsync({ storeId: store.id });
      setTrysyStoreId('');
      setTrysyApiKey('');
      setIsEnabled(false);
      toast.success('Trysy disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-background/60" />
      </div>
    );
  }

  const inputClasses =
    'bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-5 w-5 text-background/80" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">Trysy</h3>
          <p className="text-sm text-background/60">
            Try-before-you-buy for your storefront.
          </p>
        </div>
      </div>

      <p className="text-xs text-background/40 mb-5 flex items-center gap-1">
        Get your credentials from
        <a
          href="https://trysy.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-background/60 hover:text-background inline-flex items-center gap-0.5 underline underline-offset-2"
        >
          trysy.lovable.app
          <ExternalLink className="h-3 w-3" />
        </a>
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-background">Enable Trysy</p>
            <p className="text-xs text-background/50">Turn on to use Trysy for orders.</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        {/* Store ID */}
        <div className="space-y-2">
          <Label htmlFor="trysyStoreId" className="text-background/80">
            Trysy Store ID
          </Label>
          <Input
            id="trysyStoreId"
            placeholder="f8cde913-77d3-4544-b9b7-137797797091"
            value={trysyStoreId}
            onChange={(e) => setTrysyStoreId(e.target.value)}
            className={`${inputClasses} font-mono text-sm`}
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="trysyApiKey" className="text-background/80">
            Trysy API Key
          </Label>
          <div className="relative">
            <Input
              id="trysyApiKey"
              type={showKey ? 'text' : 'password'}
              placeholder="trysy_live_..."
              value={trysyApiKey}
              onChange={(e) => setTrysyApiKey(e.target.value)}
              className={`${inputClasses} font-mono text-sm pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-background/40 hover:text-background/70 transition-colors"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Fee info */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <p className="text-xs text-background/50">Trysy fee per order</p>
          <p className="text-sm font-medium text-background">₹99 (fixed)</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saveMutation.isPending} className="h-11 rounded-xl">
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : connection ? (
              'Save Changes'
            ) : (
              'Connect Trysy'
            )}
          </Button>
          {connection && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="h-11 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
