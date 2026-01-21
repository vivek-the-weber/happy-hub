import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} happy2buy
          </p>
          
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <a href="mailto:support@happy2buy.in" className="hover:text-foreground transition-colors">
              Contact
            </a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
