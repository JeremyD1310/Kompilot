import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@blinkdotnew/ui';
import { CheckCircle, Clock, Loader2, X } from 'lucide-react';

const LS_KEY = 'connected_channels';

function loadConnected(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveConnected(s: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...s]));
}

// ─── SVG logos ───────────────────────────────────────────────────────────────
function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <defs>
        <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9CE34" />
          <stop offset=".33" stopColor="#EE2A7B" />
          <stop offset="1" stopColor="#6228D7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2">
      <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
    </svg>
  );
}

function GoogleBizLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path fill="#4285F4" d="M12 10.8v3.6h5.04c-.24 1.32-1.56 3.84-5.04 3.84-3.0 0-5.52-2.52-5.52-5.64s2.52-5.64 5.52-5.64c1.68 0 2.82.72 3.48 1.32l2.4-2.28C16.44 4.68 14.4 3.6 12 3.6 7.56 3.6 3.96 7.2 3.96 11.6s3.6 8 8.04 8c4.68 0 7.8-3.24 7.8-7.92 0-.54-.06-1.02-.12-1.44L12 10.8z" />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0A66C2">
      <path d="M20.447 20.452H17V14.88c0-1.328-.027-3.037-1.852-3.037-1.854 0-2.137 1.446-2.137 2.94v5.667H9.604V9h3.278v1.56h.046c.455-.86 1.567-1.766 3.226-1.766 3.449 0 4.087 2.27 4.087 5.222l-.001 6.437zM5.337 7.433a1.903 1.903 0 110-3.806 1.903 1.903 0 010 3.806zM6.97 20.452H3.7V9h3.27v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Fake OAuth Modal ─────────────────────────────────────────────────────────
interface OAuthModalProps {
  channel: ChannelConfig;
  onSuccess: () => void;
  onClose: () => void;
}

function OAuthModal({ channel, onSuccess, onClose }: OAuthModalProps) {
  const [step, setStep] = useState<'prompt' | 'loading' | 'done'>('prompt');

  const handleAuthorize = () => {
    setStep('loading');
    setTimeout(() => {
      setStep('done');
      setTimeout(onSuccess, 700);
    }, 2000);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl p-0 overflow-hidden">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-2 py-6 px-6 bg-muted/30 border-b border-border">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
            {channel.logo}
          </div>
          <DialogHeader className="text-center space-y-0.5 items-center">
            <DialogTitle className="text-sm font-bold">Se connecter à {channel.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">Kompilot demande l'accès à votre compte</p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Permissions list */}
          <ul className="space-y-2">
            {channel.permissions.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle size={13} className="text-teal-500 mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>

          <AnimatePresence mode="wait">
            {step === 'prompt' && (
              <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button className="w-full gap-2" onClick={handleAuthorize}>
                  Autoriser Kompilot
                </Button>
              </motion.div>
            )}
            {step === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center py-1">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">Connexion en cours…</span>
              </motion.div>
            )}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 py-1">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600">Connecté avec succès !</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Channel Config ───────────────────────────────────────────────────────────
interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  permissions: string[];
  oauthUrl?: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Publiez photos & reels directement',
    logo: <InstagramLogo />,
    permissions: ['Voir votre profil', 'Publier des médias', 'Lire les statistiques'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Pages et groupes professionnels',
    logo: <FacebookLogo />,
    permissions: ['Accéder à votre Page', 'Créer des publications', 'Lire les insights'],
  },
  {
    id: 'google',
    name: 'Google Business',
    description: 'Mettez à jour votre fiche Google',
    logo: <GoogleBizLogo />,
    permissions: ['Accéder à votre fiche', 'Publier des posts', 'Répondre aux avis'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Partagez sur votre page entreprise',
    logo: <LinkedInLogo />,
    comingSoon: true,
    comingSoonLabel: 'Q3 2025',
    permissions: [],
  },
];

// ─── Channel Row ──────────────────────────────────────────────────────────────
interface ChannelRowProps {
  channel: ChannelConfig;
  connected: boolean;
  onConnectClick: () => void;
  onDisconnect: () => void;
}

function ChannelRow({ channel, connected, onConnectClick, onDisconnect }: ChannelRowProps) {
  const syncMinutes = connected ? Math.floor(Math.random() * 30) + 1 : null;

  return (
    <motion.div
      layout
      className="flex items-center gap-4 py-3.5 px-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        {channel.logo}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{channel.name}</p>
        <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
        <AnimatePresence>
          {connected && syncMinutes !== null && (
            <motion.p
              key="sync"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 mt-0.5"
            >
              <Clock size={10} />
              Sync il y a {syncMinutes} min
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {channel.comingSoon ? (
          <Badge variant="secondary" className="text-[10px] rounded-full">{channel.comingSoonLabel}</Badge>
        ) : connected ? (
          <>
            <motion.span
              key="connected-badge"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connecté
            </motion.span>
            <button
              onClick={onDisconnect}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Déconnecter"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 rounded-lg" onClick={onConnectClick}>
            Connecter →
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface SocialChannelsPanelProps {
  onConnect?: (channel: string) => void;
}

export function SocialChannelsPanel({ onConnect }: SocialChannelsPanelProps) {
  const [connected, setConnected] = useState<Set<string>>(loadConnected);
  const [oauthTarget, setOauthTarget] = useState<ChannelConfig | null>(null);

  useEffect(() => {
    saveConnected(connected);
  }, [connected]);

  const handleConnect = (ch: ChannelConfig) => {
    setOauthTarget(ch);
  };

  const handleOAuthSuccess = () => {
    if (!oauthTarget) return;
    setConnected((prev) => {
      const next = new Set(prev);
      next.add(oauthTarget.id);
      return next;
    });
    onConnect?.(oauthTarget.id);
    setOauthTarget(null);
  };

  const handleDisconnect = (id: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <>
      <div className="space-y-2">
        {CHANNELS.map((ch) => (
          <ChannelRow
            key={ch.id}
            channel={ch}
            connected={connected.has(ch.id)}
            onConnectClick={() => handleConnect(ch)}
            onDisconnect={() => handleDisconnect(ch.id)}
          />
        ))}
      </div>

      {oauthTarget && (
        <OAuthModal
          channel={oauthTarget}
          onSuccess={handleOAuthSuccess}
          onClose={() => setOauthTarget(null)}
        />
      )}
    </>
  );
}
