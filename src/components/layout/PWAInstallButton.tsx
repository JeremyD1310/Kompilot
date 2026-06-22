import { useState, useEffect } from 'react';
import { Button, toast } from '@blinkdotnew/ui';

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    // iOS Safari detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  const steps = isIOS
    ? [
        { n: '1', t: 'Appuyez sur Partager ↑ en bas de Safari' },
        { n: '2', t: 'Sélectionnez « Sur l\'écran d\'accueil »' },
        { n: '3', t: 'Confirmez avec « Ajouter »' },
      ]
    : [
        { n: '1', t: 'Appuyez sur ⋮ en haut à droite de Chrome' },
        { n: '2', t: 'Choisissez « Ajouter à l\'écran d\'accueil »' },
        { n: '3', t: 'Confirmez avec « Ajouter »' },
      ];

  return (
    <>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 hover:bg-primary/15 text-primary px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
        title="Installer Kompilot sur votre écran d'accueil"
      >
        📱 <span className="hidden xs:inline sm:hidden md:inline">Installer l'app</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">📱</div>
              <div>
                <h3 className="font-bold text-base text-foreground">Installer Kompilot</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Accès rapide depuis votre écran d'accueil</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2 mb-5">
              {steps.map(({ n, t }) => (
                <div key={n} className="flex items-start gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {n}
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{t}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="flex items-center gap-4 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 mb-5">
              {['⚡ Accès instantané', '🔔 Notifications', '📴 Mode hors ligne'].map(b => (
                <span key={b} className="text-[10px] font-semibold text-primary">{b}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => {
                  setIsInstalled(true);
                  setShowModal(false);
                  toast('Application installée 📱', { description: 'Kompilot est maintenant sur votre écran d\'accueil !' });
                }}
              >
                ✅ C'est fait !
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
