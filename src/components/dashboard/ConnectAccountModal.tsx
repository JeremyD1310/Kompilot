import { useState, useRef, type ReactElement } from 'react';
import { X, Check, Zap, Eye, EyeOff, Shield, Wifi } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useConnectedAccounts, type NetworkId } from '../../context/ConnectedAccountsContext';

interface ConnectAccountModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Network definitions ───────────────────────────────────────────────────────

interface NetworkDef {
  id: NetworkId;
  name: string;
  bgColor: string;
  borderColor: string;
  fields: { id: string; label: string; type: 'email' | 'password' | 'text'; placeholder: string; required: boolean }[];
  icon: () => ReactElement;
  kpiPreview: string; // teaser shown after connect
}

const NETWORKS: NetworkDef[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    fields: [
      { id: 'email',    label: 'Email LinkedIn',  type: 'email',    placeholder: 'vous@example.com', required: true },
      { id: 'password', label: 'Mot de passe',    type: 'password', placeholder: '••••••••',         required: true },
    ],
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
    kpiPreview: '1 240 vues · +12% cette semaine',
  },
  {
    id: 'instagram',
    name: 'Instagram Pro (Meta)',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    fields: [
      { id: 'username', label: "Nom d'utilisateur", type: 'text',     placeholder: '@votre_compte', required: true },
      { id: 'password', label: 'Mot de passe',       type: 'password', placeholder: '••••••••',     required: true },
    ],
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-pink-600">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    kpiPreview: '3 450 abonnés · 5,8% engagement',
  },
  {
    id: 'facebook',
    name: 'Facebook (Meta)',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    fields: [
      { id: 'email',    label: 'Email Facebook', type: 'email',    placeholder: 'vous@example.com', required: true },
      { id: 'password', label: 'Mot de passe',   type: 'password', placeholder: '••••••••',         required: true },
    ],
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="12" cy="12" r="12" fill="#1877F2"/>
        <path d="M16.5 7.5H14.25C13.5596 7.5 13 8.05964 13 8.75V10.5H16.5L16 13.5H13V21H10V13.5H7.5V10.5H10V8.75C10 6.67893 11.6789 5 13.75 5H16.5V7.5Z" fill="white"/>
      </svg>
    ),
    kpiPreview: '2 180 abonnés · +8% cette semaine',
  },
  {
    id: 'tiktok',
    name: 'TikTok Enterprise',
    bgColor: 'bg-muted/60',
    borderColor: 'border-border',
    fields: [
      { id: 'email',    label: 'Email TikTok',  type: 'email',    placeholder: 'vous@example.com', required: true },
      { id: 'password', label: 'Mot de passe',  type: 'password', placeholder: '••••••••',         required: true },
    ],
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-foreground">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.79 1.54V6.93a4.85 4.85 0 01-1.02-.24z"/>
      </svg>
    ),
    kpiPreview: '8 920 vues vidéo · +34% cette semaine',
  },
  {
    id: 'google',
    name: 'Google Business Profile',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    fields: [
      { id: 'email',    label: 'Compte Google (email)', type: 'email',    placeholder: 'vous@gmail.com', required: true },
      { id: 'password', label: 'Mot de passe',          type: 'password', placeholder: '••••••••',       required: true },
    ],
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-orange-500">
        <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
      </svg>
    ),
    kpiPreview: 'Note 4,7★ · 3 avis à traiter',
  },
];

// ── Network row ───────────────────────────────────────────────────────────────

function NetworkRow({ network }: { network: NetworkDef }) {
  const { isConnected, connectAccount } = useConnectedAccounts();
  const alreadyConnected = isConnected(network.id);

  const [expanded, setExpanded] = useState(false);
  const [values, setValues]     = useState<Record<string, string>>({});
  const [showPw, setShowPw]     = useState(false);
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success'>(alreadyConnected ? 'success' : 'idle');

  // Both required fields must be non-empty
  const allFilled = network.fields
    .filter(f => f.required)
    .every(f => (values[f.id] ?? '').trim().length > 0);

  // Use a ref to prevent race-condition double-submissions that bypass the status check
  const submittingRef = useRef(false);

  const handleLink = async () => {
    if (!allFilled || status !== 'idle' || submittingRef.current) return;
    submittingRef.current = true;
    setStatus('loading');
    try {
      await new Promise(r => setTimeout(r, 2000)); // "Récupération des données API..."
      setStatus('success');
      connectAccount(network.id);
      toast.success(`${network.name} synchronisé !`, {
        description: 'Vos performances sont maintenant disponibles sur le Dashboard.',
      });
    } catch {
      // Simulate API failure — revert to idle so user can retry
      setStatus('idle');
      toast.error(`Échec de la connexion à ${network.name}. Vérifiez vos identifiants.`);
    } finally {
      submittingRef.current = false;
    }
  };

  const IconComp = network.icon;

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-green-300 bg-green-50 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-green-200 flex items-center justify-center shrink-0">
          <IconComp />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{network.name}</p>
          <p className="text-xs text-green-700 font-medium mt-0.5 flex items-center gap-1">
            <Check size={11} strokeWidth={3} /> Compte Synchronisé
          </p>
          <p className="text-[11px] text-green-600/80 mt-0.5">{network.kpiPreview}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 border border-green-300 px-3 py-1 text-xs font-bold text-green-700 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Actif
        </span>
      </div>
    );
  }

  // ── Idle / expanded form ───────────────────────────────────────────────────
  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      expanded ? `${network.bgColor} ${network.borderColor}` : 'border-border bg-card hover:border-primary/30'
    }`}>
      {/* Header row — click to expand */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
          <IconComp />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{network.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {expanded ? 'Saisissez vos identifiants' : 'Cliquez pour connecter'}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Expandable credential form */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-current/10">
          {/* Required fields indicator */}
          <p className="text-[11px] text-muted-foreground pt-1">
            Les deux champs sont obligatoires pour activer la synchronisation.
          </p>

          {network.fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                {field.label}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={field.type === 'password' && !showPw ? 'password' : field.type === 'password' ? 'text' : field.type}
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    (values[field.id] ?? '').trim().length > 0
                      ? 'border-primary/60'
                      : 'border-border'
                  }`}
                  autoComplete={field.type === 'password' ? 'current-password' : field.type === 'email' ? 'email' : 'username'}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Security note */}
          <div className="flex items-center gap-2 pt-1">
            <Shield size={12} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">Connexion chiffrée — vos identifiants ne sont jamais stockés.</p>
          </div>

          {/* CTA button — disabled until BOTH fields filled */}
          <button
            onClick={handleLink}
            disabled={!allFilled}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
              allFilled
                ? 'bg-foreground text-background hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-md'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 10h-2a8 8 0 01-8-8z"/>
                </svg>
                <span>Récupération des données API…</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                Lier le compte
              </>
            )}
          </button>

          {/* Progress hint when both filled */}
          {allFilled && status === 'idle' && (
            <p className="text-center text-[11px] text-primary font-medium animate-pulse">
              ✓ Identifiants complets — prêt à synchroniser
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function ConnectAccountModal({ open, onClose }: ConnectAccountModalProps) {
  const { connected } = useConnectedAccounts();
  const syncedCount = connected.size;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-background shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wifi size={18} className="text-primary" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Connecter un réseau
            </h2>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Saisissez vos identifiants pour activer la synchronisation des performances.
          </p>

          {syncedCount > 0 && (
            <div className="mt-4 ml-12 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {syncedCount} compte{syncedCount > 1 ? 's' : ''} synchronisé{syncedCount > 1 ? 's' : ''} — Dashboard mis à jour
            </div>
          )}
        </div>

        {/* Network list */}
        <div className="p-6 space-y-3">
          {NETWORKS.map(net => (
            <NetworkRow key={net.id} network={net} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-5 py-3 hover:opacity-90 transition-opacity"
          >
            {syncedCount > 0 ? `Terminer (${syncedCount} réseau${syncedCount > 1 ? 'x' : ''} connecté${syncedCount > 1 ? 's' : ''})` : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
}
