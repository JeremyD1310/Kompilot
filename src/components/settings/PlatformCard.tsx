import { useState } from 'react';
import { Check, Link2, ExternalLink, Info } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

export interface Platform {
  id: string;
  name: string;
  description: string;
  helpText?: string; // Tooltip / help bubble shown beneath the description
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  accentColor: string; // Tailwind border/ring color when connected
}

interface PlatformCardProps {
  platform: Platform;
  connected: boolean;
  onToggle: (id: string) => void;
}

export function PlatformCard({ platform, connected, onToggle }: PlatformCardProps) {
  const [loading, setLoading] = useState(false);
  const { icon: Icon, iconBg, iconColor } = platform;

  const handleClick = async () => {
    setLoading(true);
    // Simulate OAuth connection
    await new Promise(r => setTimeout(r, 900));
    onToggle(platform.id);
    setLoading(false);

    if (!connected) {
      toast.success(`${platform.name} connecté !`, {
        description: 'Votre compte a bien été lié à Kompilot.',
      });
    } else {
      toast(`${platform.name} déconnecté`, {
        description: 'Le compte a été dissocié.',
      });
    }
  };

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-2xl border p-5 bg-card transition-all duration-200 ${
        connected
          ? 'border-green-400/60 shadow-[0_0_0_1px_theme(colors.green.400/0.2)] bg-green-50/30'
          : 'border-border hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      {/* Connected badge */}
      {connected && (
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
          <Check size={10} strokeWidth={3} /> Actif
        </span>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{platform.name}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{platform.description}</p>
        </div>
      </div>

      {/* Help bubble (optional) */}
      {platform.helpText && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-2.5 -mt-1">
          <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">{platform.helpText}</p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60 ${
          connected
            ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z" />
            </svg>
            {connected ? 'Déconnexion...' : 'Connexion...'}
          </span>
        ) : connected ? (
          <>
            <Check size={15} strokeWidth={2.5} />
            Connecté
          </>
        ) : (
          <>
            <Link2 size={15} />
            Connecter mon compte
          </>
        )}
      </button>

      {connected && (
        <button className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors -mt-2">
          <ExternalLink size={10} />
          Gérer les permissions
        </button>
      )}
    </div>
  );
}
