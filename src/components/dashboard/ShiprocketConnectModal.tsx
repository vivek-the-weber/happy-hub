import { useState } from 'react';
import { Loader2, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useConnectShiprocket } from '@/hooks/useShiprocket';
import { toast } from 'sonner';

interface ShiprocketConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
}

export function ShiprocketConnectModal({ open, onOpenChange, storeId }: ShiprocketConnectModalProps) {
  const connectShiprocket = useConnectShiprocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter your Shiprocket email and password');
      return;
    }

    try {
      await connectShiprocket.mutateAsync({
        storeId,
        email,
        password,
      });
      toast.success('Connected to Shiprocket successfully!');
      setEmail('');
      setPassword('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect to Shiprocket');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-foreground border-white/10 text-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-background">
            <Link2 className="h-5 w-5" />
            Connect Shiprocket
          </DialogTitle>
          <DialogDescription className="text-background/60">
            Enter your Shiprocket credentials to automate shipping
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="shiprocketEmail" className="text-background/80">
              Shiprocket Email
            </Label>
            <Input
              id="shiprocketEmail"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shiprocketPassword" className="text-background/80">
              Shiprocket Password
            </Label>
            <Input
              id="shiprocketPassword"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
            />
            <p className="text-xs text-background/50">
              Your password is never stored. We only save the authentication token.
            </p>
          </div>

          <Button
            type="submit"
            disabled={connectShiprocket.isPending}
            className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white"
          >
            {connectShiprocket.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Connect to Shiprocket
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
