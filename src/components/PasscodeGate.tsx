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

  // Not authenticated - show passcode gate
  return (
    <div className="min-h-screen bg-foreground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-background">happy2buy</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="passcode" className="text-background/70 text-sm">
              Enter access code
            </Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Paste access code"
              className="h-12 bg-background/10 border-background/20 text-background placeholder:text-background/40 rounded-xl focus:border-primary focus:ring-primary"
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            Enter
          </Button>
        </form>
      </div>
    </div>
  );
}
