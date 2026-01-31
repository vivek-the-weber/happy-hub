import { useState, useEffect, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Instagram, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ACCESS_KEY = "h2b_access_v1";
const PASSCODE = "H2b@2026!xK9#mPqR$vLwZ&jNfYc*uEaG%dStXi^WoMbC+hUlJrF=nVkOy_TpIz~QeAs<DgBx>HjKmLoRuPvNwY[ZaEfIc]ChGkDnMsWoJtLpQ";
const VERIFIED_HASH = "h2b_verified_2026";

interface PasscodeGateProps {
  children: ReactNode;
}

export function PasscodeGate({ children }: PasscodeGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(ACCESS_KEY);
    setIsAuthenticated(cached === VERIFIED_HASH);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passcode === PASSCODE) {
      localStorage.setItem(ACCESS_KEY, VERIFIED_HASH);
      setIsAuthenticated(true);
    } else {
      setError("Invalid access code");
      setPasscode("");
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    try {
      const { error: insertError } = await supabase
        .from('email_subscriptions')
        .insert({ email: email.trim().toLowerCase() });

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: "Already subscribed!",
            description: "This email is already on our list.",
          });
        } else {
          throw insertError;
        }
      } else {
        setIsSubscribed(true);
        setEmail("");
        toast({
          title: "You're in!",
          description: "We'll notify you when we launch.",
        });
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  // Still checking localStorage
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated - show the app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - show coming soon page
  return (
    <div className="min-h-screen bg-foreground flex flex-col items-center justify-between p-6 py-16">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        {/* Logo */}
        <h1 className="text-3xl font-bold text-background">happy2buy</h1>
        
        {/* Coming Soon */}
        <div className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold text-background">
            Coming Soon
          </h2>
          <p className="text-background/60 text-lg max-w-md">
            We're building something amazing. Stay tuned!
          </p>
        </div>

        {/* Email Subscription Form */}
        <div className="w-full max-w-sm">
          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">You're on the list!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-11 bg-background/5 border-background/10 text-background placeholder:text-background/40 rounded-lg focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubscribing}
                className="h-11 px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isSubscribing ? "..." : "Notify me"}
              </Button>
            </form>
          )}
        </div>

        {/* Instagram Link */}
        <a
          href="https://instagram.com/happy2buyy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-background/60 hover:text-background transition-colors"
        >
          <Instagram className="w-5 h-5" />
          <span className="text-sm">@happy2buyy</span>
        </a>
      </div>

      {/* Developer Access Section */}
      <div className="w-full max-w-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passcode" className="text-background/40 text-xs">
              Enter developer's passcode
            </Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Paste developer passcode"
              className="h-10 bg-background/5 border-background/10 text-background placeholder:text-background/30 rounded-lg text-sm focus:border-primary focus:ring-primary"
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-destructive text-xs text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="sm"
            className="w-full rounded-lg bg-background/10 hover:bg-background/20 text-background/70 font-medium"
          >
            Enter
          </Button>
        </form>
      </div>
    </div>
  );
}
