import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMyStore, useCreateStore, useCheckSlugAvailability } from '@/hooks/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const storeNameSchema = z.string().min(2, 'Store name must be at least 2 characters').max(50, 'Store name must be less than 50 characters');
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-z0-9]+$/, 'Username can only contain lowercase letters and numbers');
const citySchema = z.string().min(2, 'City is required').max(100, 'City name is too long');
const whatsappSchema = z.string().min(10, 'Please enter a valid phone number').max(20, 'Phone number is too long');

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: store, isLoading: storeLoading } = useMyStore();
  const createStore = useCreateStore();

  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ storeName?: string; username?: string; city?: string; whatsapp?: string }>({});
  
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const { data: slugAvailable, isLoading: checkingSlug } = useCheckSlugAvailability(debouncedUsername);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect if already has store
  useEffect(() => {
    if (!storeLoading && store) {
      navigate('/dashboard');
    }
  }, [store, storeLoading, navigate]);

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        setDebouncedUsername(username);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  const handleUsernameChange = (value: string) => {
    // Auto-convert to lowercase and remove invalid characters
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

    setIsSubmitting(true);

    try {
      const newStore = await createStore.mutateAsync({
        name: storeName,
        slug: username,
        city,
        whatsapp_number: whatsappNumber,
      });
      // Set the cache directly to avoid race condition
      queryClient.setQueryData(['my-store'], newStore);
      toast.success('Your store is ready! 🎉');
      navigate('/dashboard');
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

  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const showUsernameStatus = username.length >= 3 && !errors.username?.includes('characters');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container py-4">
        <Link to="/" className="text-xl font-bold text-primary">
          happy2buy
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Set up your store</CardTitle>
            <CardDescription>
              Let's get your online store ready in just a minute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  placeholder="e.g. Sarah's Crafts"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
                {errors.storeName && (
                  <p className="text-sm text-destructive">{errors.storeName}</p>
                )}
              </div>

              {/* Username (Slug) */}
              <div className="space-y-2">
                <Label htmlFor="username">Store Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="sarahscrafts"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="pr-10"
                  />
                  {showUsernameStatus && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingSlug ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : slugAvailable ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {/* URL Preview */}
                {username && (
                  <p className="text-sm text-muted-foreground">
                    Your store URL: <span className="font-medium text-foreground">{username}.happy2buy.store</span>
                  </p>
                )}
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g. Jakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+62 812 3456 7890"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Customers will contact you on WhatsApp
                </p>
                {errors.whatsapp && (
                  <p className="text-sm text-destructive">{errors.whatsapp}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || checkingSlug}
              >
                {isSubmitting ? 'Creating your store...' : 'Create My Store'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
