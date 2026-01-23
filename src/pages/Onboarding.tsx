import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useMyStore, useCreateStore, useCheckSlugAvailability } from '@/hooks/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SUPPORTED_COUNTRIES } from '@/lib/currency';

const storeNameSchema = z.string().min(2, 'Store name must be at least 2 characters').max(50, 'Store name must be less than 50 characters');
const usernameSchema = z.string()
  .min(3, 'Store link must be at least 3 characters')
  .max(30, 'Store link must be less than 30 characters')
  .regex(/^[a-z0-9]+$/, 'Store link can only contain lowercase letters and numbers');
const citySchema = z.string().min(2, 'City is required').max(100, 'City name is too long');
const whatsappSchema = z.string().min(10, 'Please enter a valid phone number').max(20, 'Phone number is too long');

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: store, isLoading: storeLoading, isFetched: storeFetched } = useMyStore();
  const createStore = useCreateStore();

  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('IN');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ storeName?: string; username?: string; city?: string; whatsapp?: string }>({});
  
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const { data: slugAvailable, isLoading: checkingSlug } = useCheckSlugAvailability(debouncedUsername);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && storeFetched && store !== null) {
      navigate('/dashboard', { replace: true });
    }
  }, [store, authLoading, user, storeFetched, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        setDebouncedUsername(username);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setUsername(sanitized);
  };

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};

    const nameResult = storeNameSchema.safeParse(storeName);
    if (!nameResult.success) {
      newErrors.storeName = nameResult.error.errors[0].message;
    }

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.errors[0].message;
    } else if (slugAvailable === false) {
      newErrors.username = 'This username is already taken';
    }

    const cityResult = citySchema.safeParse(city);
    if (!cityResult.success) {
      newErrors.city = cityResult.error.errors[0].message;
    }

    const whatsappResult = whatsappSchema.safeParse(whatsappNumber);
    if (!whatsappResult.success) {
      newErrors.whatsapp = whatsappResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [storeName, username, city, whatsappNumber, slugAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    if (checkingSlug) {
      toast.error('Please wait while we check username availability');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);

    try {
      const newStore = await createStore.mutateAsync({
        name: storeName,
        slug: username,
        city,
        country,
        whatsapp_number: whatsappNumber,
      });
      queryClient.setQueryData(['my-store', newStore.owner_id], newStore);
      toast.success('Your store is ready! 🎉');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('This username is already taken. Please choose another.');
      } else {
        toast.error(error.message || 'Failed to create store');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || storeLoading || (user && !storeFetched)) {
    return (
      <div className="min-h-screen bg-surface-inverse flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-background/60" />
      </div>
    );
  }

  const showUsernameStatus = username.length >= 3 && !errors.username?.includes('characters');

  const slugStatus = () => {
    if (!showUsernameStatus) return null;
    if (checkingSlug) return <Loader2 className="h-4 w-4 animate-spin text-background/60" />;
    if (slugAvailable) return <Check className="h-4 w-4 text-primary" />;
    return <X className="h-4 w-4 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-surface-inverse text-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-background/60 hover:text-background transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </Link>
        <Link to="/" className="text-xl font-bold">happy2buy</Link>
        <div className="w-16" />
      </header>

      {/* Form */}
      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Set up your store</h1>
            <p className="text-background/60">Just a few details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-background/80">Store name</Label>
              <Input
                id="storeName"
                placeholder="e.g. Sarah's Crafts"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
              />
              {errors.storeName && (
                <p className="text-red-400 text-sm">{errors.storeName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeLink" className="text-background/80">Store link</Label>
              <div className="relative">
                <Input
                  id="storeLink"
                  placeholder="yourstore"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus()}
                </div>
              </div>
              <p className="text-background/40 text-sm">
                {username ? `${username}.happy2buy.in` : 'yourstore.happy2buy.in'}
              </p>
              {errors.username && (
                <p className="text-red-400 text-sm">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-background/80">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-white/5 border-white/10 text-background h-12 rounded-xl [&>svg]:text-background/60">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <SelectItem 
                      key={c.code} 
                      value={c.code}
                      className="text-white focus:bg-white/10 focus:text-white"
                    >
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-background/80">City</Label>
              <Input
                id="city"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
              />
              {errors.city && (
                <p className="text-red-400 text-sm">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-background/80">WhatsApp number</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+91 98765 43210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl"
              />
              <p className="text-background/40 text-xs">
                Customers will contact you on WhatsApp
              </p>
              {errors.whatsapp && (
                <p className="text-red-400 text-sm">{errors.whatsapp}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || checkingSlug}
              className="w-full h-12 rounded-xl text-base font-medium mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Create Store'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
