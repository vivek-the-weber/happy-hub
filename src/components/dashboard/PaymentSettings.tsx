import { useState, useEffect } from 'react';
import { CreditCard, Pencil, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { usePaymentSettings, useUpsertPaymentSettings, useHasPendingOrders } from '@/hooks/usePaymentSettings';
import { toast } from 'sonner';

interface PaymentSettingsProps {
  store: { id: string };
}

function maskUpiId(upiId: string): string {
  const parts = upiId.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  const masked = local.length > 3
    ? local.slice(0, 3) + '***'
    : local.slice(0, 1) + '***';
  return `${masked}@${domain}`;
}

function isValidUpi(value: string): boolean {
  return value.includes('@') && !value.includes(' ') && value.length <= 50 && value.length > 0;
}

export function PaymentSettings({ store }: PaymentSettingsProps) {
  const { data: settings, isLoading } = usePaymentSettings(store.id);
  const { data: hasPending } = useHasPendingOrders(store.id);
  const upsert = useUpsertPaymentSettings();

  const [editing, setEditing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const hasSaved = !!settings?.upi_id;
  const isEditMode = editing || !hasSaved;

  useEffect(() => {
    if (editing && settings?.upi_id) {
      setUpiId(settings.upi_id);
    }
  }, [editing, settings?.upi_id]);

  const handleSave = async () => {
    if (!isValidUpi(upiId)) return;
    try {
      await upsert.mutateAsync({ storeId: store.id, upiId });
      toast.success('UPI ID saved!');
      setEditing(false);
      setConfirmed(false);
      setUpiId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save UPI ID');
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setConfirmed(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setUpiId('');
    setConfirmed(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-background/60" />
      </div>
    );
  }

  const canSave = isValidUpi(upiId) && confirmed && !upsert.isPending && !(hasSaved && editing && hasPending);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-background/80" />
        <h3 className="text-lg font-semibold">Payments</h3>
      </div>

      {isEditMode ? (
        <div className="space-y-4 max-w-md">
          <p className="text-sm text-background/60">
            This UPI ID will be shown to buyers for direct payment.
          </p>

          <div className="space-y-2">
            <Label htmlFor="upiId" className="text-background/80">UPI ID</Label>
            <Input
              id="upiId"
              placeholder="anything@upi"
              maxLength={50}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value.replace(/\s/g, ''))}
              className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
            />
          </div>

          {hasSaved && editing && hasPending && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-300">
                You have pending orders. UPI ID cannot be changed until all pending orders are resolved.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="upiConfirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="upiConfirm" className="text-sm text-background/70 cursor-pointer leading-snug">
              I confirm that I own this UPI ID and authorize receiving payments on it.
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="h-10 rounded-xl"
            >
              {upsert.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save UPI ID'
              )}
            </Button>
            {hasSaved && editing && (
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="h-10 rounded-xl text-background/60 hover:text-background hover:bg-white/5"
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-background/40">
            Payments are collected directly to your UPI ID. We do not verify UPI ownership.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-background/60 mb-1">Your UPI ID</p>
            <p className="font-medium font-mono">{maskUpiId(settings!.upi_id)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="border-white/20 bg-white/5 text-background hover:bg-white/10"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
