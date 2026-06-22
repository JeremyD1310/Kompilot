import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Home, Wifi, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

      {/* Ambient background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Robot illustration */}
      <div className="relative mb-8">
        {/* Glowing ring */}
        <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-xl" />

        {/* Robot body */}
        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 flex items-center justify-center shadow-lg">
          <span className="text-5xl">🤖</span>

          {/* Signal waves */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
            <Wifi size={11} className="text-muted-foreground opacity-40" />
          </div>
          <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
            <AlertCircle size={10} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* 404 number */}
      <div className="relative mb-4">
        <span
          className="text-8xl font-black tracking-tighter select-none"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </span>
      </div>

      {/* Main message */}
      <h1 className="text-xl font-bold text-foreground mb-2 max-w-sm leading-snug">
        Oups ! Notre Copilot s'est égaré dans le cloud.
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
        Cette page n'existe pas ou a été déplacée. Pas de panique, votre tableau de bord est à portée de clic.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-foreground text-background text-sm font-bold px-6 py-3 shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          <LayoutDashboard size={16} />
          Retourner au Tableau de bord
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl border border-border bg-card text-foreground text-sm font-medium px-5 py-3 hover:bg-muted/60 active:scale-[0.98] transition-all duration-150"
        >
          <Home size={15} />
          Accueil
        </Link>
      </div>

      {/* Fun detail */}
      <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground/60">
        <span className="font-mono bg-muted/40 rounded px-2 py-1">Error 404</span>
        <span>·</span>
        <span>Kompilot v2.0</span>
        <span>·</span>
        <span>Page introuvable</span>
      </div>
    </div>
  );
}
