import { useState, useEffect } from 'react';
import { ShieldCheck, Settings2, X } from 'lucide-react';

const STORAGE_KEY = 'kompilot_cookie_consent';

type ConsentState = 'accepted' | 'declined' | 'custom' | null;

/* ── Customize modal (unchanged logic) ─────────────────────────────────────── */
function CustomizeModal({
  onSave,
  onClose,
}: {
  onSave: (prefs: Record<string, boolean>) => void;
  onClose: () => void;
}) {
  const [prefs, setPrefs] = useState({
    essential: true,
    analytics: true,
    marketing: false,
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
        style={{ animation: 'cookieSlideUp 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 size={15} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Personnaliser les cookies</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Choisissez les types de cookies que vous acceptez. Les cookies essentiels sont toujours actifs car ils garantissent le bon fonctionnement du site.
        </p>

        <div className="space-y-3">
          {[
            { key: 'essential' as const, label: 'Essentiels', desc: 'Nécessaires au fonctionnement du site. Toujours actifs.', locked: true },
            { key: 'analytics' as const, label: 'Analytiques', desc: "Mesure d'audience anonyme pour améliorer nos services.", locked: false },
            { key: 'marketing' as const, label: 'Marketing', desc: 'Publicités personnalisées et suivi de campagnes.', locked: false },
          ].map(item => (
            <div key={item.key} className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 bg-muted/20">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  {item.locked && (
                    <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">Requis</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              <button
                onClick={() => !item.locked && setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                disabled={item.locked}
                className={`relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 mt-0.5 ${
                  prefs[item.key] ? 'bg-primary' : 'bg-muted-foreground/30'
                } ${item.locked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Toggle ${item.label}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                    prefs[item.key] ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-9 text-xs border border-border rounded-lg text-foreground hover:bg-muted/40 transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(prefs)}
            className="flex-1 h-9 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={13} />
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Cookie Banner — slim bottom strip ─────────────────────────────────────── */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (state: ConsentState) => {
    setHiding(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, state ?? 'declined');
      setVisible(false);
      setHiding(false);
    }, 350);
  };

  const accept = () => dismiss('accepted');
  const decline = () => dismiss('declined');

  const handleCustomSave = (prefs: Record<string, boolean>) => {
    localStorage.setItem(STORAGE_KEY, 'custom');
    localStorage.setItem('kompilot_cookie_prefs', JSON.stringify(prefs));
    setShowCustomize(false);
    dismiss('custom');
  };

  if (!visible) return null;

  return (
    <>
      {showCustomize && (
        <CustomizeModal onSave={handleCustomSave} onClose={() => setShowCustomize(false)} />
      )}

      {/* Slim bottom strip */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-350 ease-out ${
          hiding
            ? 'opacity-0 translate-y-full'
            : 'opacity-100 translate-y-0'
        }`}
        style={{ animation: hiding ? undefined : 'cookieSlideUp 0.3s ease-out' }}
        role="dialog"
        aria-label="Consentement cookies"
      >
        <div className="bg-card/96 backdrop-blur-md border-t border-border shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap sm:flex-nowrap">

            {/* Icon + Text */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base shrink-0" aria-hidden="true">🍪</span>
              <p className="text-xs text-muted-foreground leading-snug truncate">
                <span className="font-semibold text-foreground">Cookies RGPD —&nbsp;</span>
                Kompilot utilise des cookies essentiels et analytiques.{' '}
                <a href="/privacy" className="text-primary hover:underline whitespace-nowrap">
                  Politique de confidentialité
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCustomize(true)}
                className="h-7 px-2.5 text-[11px] font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors whitespace-nowrap"
              >
                <Settings2 size={11} className="inline mr-1 -mt-px" />
                Personnaliser
              </button>
              <button
                onClick={decline}
                className="h-7 px-2.5 text-[11px] font-medium border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="h-7 px-3 text-[11px] font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1 whitespace-nowrap"
              >
                <ShieldCheck size={11} />
                Tout accepter
              </button>
              <button
                onClick={decline}
                className="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
