import { Link } from '@tanstack/react-router';

export function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-muted/20 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Kompilot — Tous droits réservés
      </span>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
          Politique de confidentialité
        </Link>
        <Link to="/legal" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
          Mentions légales
        </Link>
      </div>
    </footer>
  );
}
