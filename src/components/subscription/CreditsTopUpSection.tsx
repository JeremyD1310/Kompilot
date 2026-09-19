import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, toast } from '@blinkdotnew/ui';
import { Zap, Sparkles, X, Loader2 } from 'lucide-react';
import { useCredits } from '../../context/CreditsContext';
import { LegalConsentBlock, isLegalConsentValid, type LegalConsentState, CGV_VERSION } from './LegalConsentBlock';
import { createOneTimeCheckout } from '../../lib/billingClient';

const CREDIT_PACKS = [
  { id: 'kompilot_ai_250_once', credits: 250, price: 19, priceHT: 15.83, label: 'Starter', emoji: '🌱', desc: 'Idéal pour tester' },
  { id: 'kompilot_ai_750_once', credits: 750, price: 49, priceHT: 40.83, label: 'Boost', emoji: '🚀', desc: 'Le plus populaire', popular: true },
  { id: 'kompilot_ai_2000_once', credits: 2000, price: 99, priceHT: 82.5, label: 'Power', emoji: '⚡', desc: 'Meilleur rapport' },
];

type SelectedPack = { credits: number; price: number; priceHT: number; label: string; id: string } | null;

export function CreditsTopUpSection() {
  const { credits, limit, usage, refresh } = useCredits();
  const [selectedPack, setSelectedPack] = useState<SelectedPack>(null);
  const [consent, setConsent] = useState<LegalConsentState>({ cgvAccepted: false, retractionWaived: false });
  const [loading, setLoading] = useState(false);

  const remaining = Math.max(0, limit - usage);
  const pct = Math.round((remaining / limit) * 100);
  const isLow = remaining <= 2;

  const handleSelectPack = (pack: typeof CREDIT_PACKS[0]) => {
    setSelectedPack(pack);
    setConsent({ cgvAccepted: false, retractionWaived: false });
  };

  const handleConfirm = async () => {
    if (!selectedPack || !isLegalConsentValid(consent) || loading) return;
    setLoading(true);
    try {
      const result = await createOneTimeCheckout(selectedPack.id as 'kompilot_ai_250_once' | 'kompilot_ai_750_once' | 'kompilot_ai_2000_once', {
        ...consent, cgvVersion: CGV_VERSION, acceptedAt: new Date().toISOString(), userAgent: navigator.userAgent,
      });
      if (result.url) {
        const paymentWindow = window.open(result.url, '_blank', 'noopener,noreferrer');
        if (!paymentWindow) throw new Error('Autorisez les fenêtres pop-up puis réessayez.');
        await refresh();
        setSelectedPack(null);
      } else {
        toast.error('Erreur lors du paiement', { description: result.error || 'Réessayez ou contactez le support.' });
      }
    } catch {
      toast.error('Erreur réseau', { description: 'Impossible de contacter le serveur de paiement.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap size={14} className="text-primary" />
            </div>
            Crédits de génération IA
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Balance */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className={isLow ? 'text-amber-500' : 'text-primary'} />
                <span className="text-sm font-semibold text-foreground">Solde actuel</span>
              </div>
              <span className={`text-sm font-bold ${isLow ? 'text-amber-600' : 'text-foreground'}`}>
                {remaining} / {limit} crédits
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isLow && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ Presque épuisé — rechargez pour continuer à générer du contenu.
              </p>
            )}
          </div>

          {/* Packs */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Choisissez un pack de crédits
            </p>
            <div className="grid grid-cols-3 gap-3">
              {CREDIT_PACKS.map(pack => (
                <div
                  key={pack.id}
                  className={`relative rounded-xl border p-3 text-center cursor-pointer transition-all hover:shadow-md ${
                    pack.popular
                      ? 'border-primary bg-primary/[0.04] hover:border-primary/80'
                      : 'border-border hover:border-primary/40'
                  } ${selectedPack?.id === pack.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleSelectPack(pack)}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 whitespace-nowrap">
                      ⭐ Populaire
                    </span>
                  )}
                  <p className="text-xl mb-1">{pack.emoji}</p>
                  <p className="text-xs font-bold text-foreground">{pack.label}</p>
                  <p className="text-lg font-extrabold text-foreground mt-0.5">{pack.credits}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight mb-2">crédits IA</p>
                  <Button size="sm" variant={pack.popular ? 'default' : 'outline'} className="w-full h-7 text-[11px] font-bold">
                    {pack.price}€
                  </Button>
                  <p className="text-[8px] text-muted-foreground mt-1">{pack.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Prix TTC · Crédits cumulables · Valables 12 mois
            </p>
          </div>

          {/* ── Clickwrap + Confirm (appears when a pack is selected) ── */}
          {selectedPack && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Pack <span className="text-primary">{selectedPack.label}</span> — {selectedPack.credits} crédits IA
                </p>
                <button
                  onClick={() => setSelectedPack(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Annuler"
                >
                  <X size={14} />
                </button>
              </div>

              <LegalConsentBlock state={consent} onChange={setConsent} disabled={loading} />

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-9" onClick={() => setSelectedPack(null)} disabled={loading}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={!isLegalConsentValid(consent) || loading}
                  className="flex-1 gap-1.5 text-xs h-9"
                >
                  {loading
                    ? <><Loader2 size={12} className="animate-spin" /> Ouverture…</>
                    : <><Zap size={12} /> Payer {selectedPack.price}€</>
                  }
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
