import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check if there's a saved preference
    const saved = localStorage.getItem('store-theme');
    if (saved) {
      setIsDark(saved === 'dark');
    }
  }, []);

  useEffect(() => {
    // Apply theme to body
    if (isDark) {
      document.body.classList.add('store-dark');
      document.body.classList.remove('store-light');
    } else {
      document.body.classList.remove('store-dark');
      document.body.classList.add('store-light');
    }
    localStorage.setItem('store-theme', isDark ? 'dark' : 'light');

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('store-dark', 'store-light');
    };
  }, [isDark]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="fixed bottom-20 right-4 z-50 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
