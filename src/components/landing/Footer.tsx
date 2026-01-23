import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FooterProps {
  dark?: boolean;
}

export function Footer({ dark = false }: FooterProps) {
  return (
    <footer className={cn(
      "py-8 mt-auto",
      dark ? "border-t border-background/10" : "border-t"
    )}>
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className={cn(
            "flex flex-wrap items-center justify-center gap-6 text-sm order-first sm:order-none",
            dark ? "text-background/60" : "text-muted-foreground"
          )}>
            <Link to="/privacy" className={cn(
              "transition-colors",
              dark ? "hover:text-background" : "hover:text-foreground"
            )}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={cn(
              "transition-colors",
              dark ? "hover:text-background" : "hover:text-foreground"
            )}>
              Terms
            </Link>
          </nav>
          
          <p className={cn(
            "text-sm",
            dark ? "text-background/60" : "text-muted-foreground"
          )}>
            © {new Date().getFullYear()} happy2buy
          </p>
        </div>
      </div>
    </footer>
  );
}
