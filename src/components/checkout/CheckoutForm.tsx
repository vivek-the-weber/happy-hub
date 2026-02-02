import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

interface CheckoutFormProps {
  initialCountry: string;
  isSubmitting: boolean;
  onSubmit: (data: CheckoutFormData) => void;
  onPostalCodeChange?: (postalCode: string) => void;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  AE: 'UAE',
  SG: 'Singapore',
  AU: 'Australia',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
};

export function CheckoutForm({ initialCountry, isSubmitting, onSubmit, onPostalCodeChange }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: initialCountry,
    notes: '',
  });

  // Debounce timer for postal code changes
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateField = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Debounce postal code changes
    if (field === 'postalCode' && onPostalCodeChange) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onPostalCodeChange(value);
      }, 500);
    }
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClasses = "bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary h-12 rounded-xl";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-background/80">Full Name *</Label>
        <Input
          id="fullName"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          required
          className={inputClasses}
        />
      </div>

      {/* Email & Phone side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-background/80">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-background/80">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            required
            className={inputClasses}
          />
        </div>
      </div>

      {/* Address Line 1 */}
      <div className="space-y-2">
        <Label htmlFor="addressLine1" className="text-background/80">Address Line 1 *</Label>
        <Input
          id="addressLine1"
          placeholder="Street address, apartment, etc."
          value={formData.addressLine1}
          onChange={(e) => updateField('addressLine1', e.target.value)}
          required
          className={inputClasses}
        />
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor="addressLine2" className="text-background/80">Address Line 2 (optional)</Label>
        <Input
          id="addressLine2"
          placeholder="Building, floor, landmark..."
          value={formData.addressLine2}
          onChange={(e) => updateField('addressLine2', e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* City & State side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-background/80">City *</Label>
          <Input
            id="city"
            placeholder="City"
            value={formData.city}
            onChange={(e) => updateField('city', e.target.value)}
            required
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-background/80">State *</Label>
          <Input
            id="state"
            placeholder="State / Province"
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            required
            className={inputClasses}
          />
        </div>
      </div>

      {/* Postal Code & Country side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-background/80">Postal Code *</Label>
          <Input
            id="postalCode"
            placeholder="PIN / ZIP code"
            value={formData.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
            required
            className={inputClasses}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-background/80">Country</Label>
          <Input
            id="country"
            value={COUNTRY_NAMES[formData.country] || formData.country}
            disabled
            className={`${inputClasses} opacity-60 cursor-not-allowed`}
          />
        </div>
      </div>

      {/* Order Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-background/80">Order notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any special instructions..."
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          className="bg-white/5 border-white/10 text-background placeholder:text-background/40 focus:border-primary rounded-xl"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl text-base font-medium"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Place Order'
        )}
      </Button>

      <p className="text-xs text-background/40 text-center">
        Payment instructions will be shown after you place your order.
      </p>
    </form>
  );
}
