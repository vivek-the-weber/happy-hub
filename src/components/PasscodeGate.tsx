import { useState, useEffect, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
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
