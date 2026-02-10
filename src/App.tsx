import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PasscodeGate } from "@/components/PasscodeGate";
import { getStoreSlugFromSubdomain, isMainDomain } from "@/lib/subdomain";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import StorePage from "./pages/StorePage";
import Cart from "./pages/Cart";
import OrderTracking from "./pages/OrderTracking";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const subdomainSlug = getStoreSlugFromSubdomain();
  
  // If on a store subdomain (e.g., mystore.happy2buy.in), render store directly
  if (subdomainSlug && !isMainDomain()) {
    return (
      <QueryClientProvider client={queryClient}>
        <PasscodeGate>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/order/:orderId" element={<OrderTracking />} />
                  <Route path="/*" element={<StorePage subdomainSlug={subdomainSlug} />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </PasscodeGate>
      </QueryClientProvider>
    );
  }

  // Main domain routing
  return (
    <QueryClientProvider client={queryClient}>
      <PasscodeGate>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/store/:slug" element={<StorePage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order/:orderId" element={<OrderTracking />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </PasscodeGate>
    </QueryClientProvider>
  );
};

export default App;
