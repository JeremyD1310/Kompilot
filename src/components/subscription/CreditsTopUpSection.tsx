import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, toast } from '@blinkdotnew/ui';
import { Zap, Sparkles, Rocket, Film, Wand2, X, Loader2 } from 'lucide-react';
import { useCredits } from '../../context/CreditsContext';
import { LegalConsentBlock, isLegalConsentValid, type LegalConsentState, CGV_VERSION } from './LegalConsentBlock';
import { createCheckoutSession } from '../../lib/billingClient';

const CREDIT_PACKS = [
  { id: 'pack10', credits: 10, price: 3, priceHT: 2.5, label: 'Starter', emoji: '🌱', desc: 'Idéal pour tester' },
  { id: 'pack30', credits: 30, price: 7, priceHT: 5.83, label: 'Boost', emoji: '🚀', desc: 'Le plus populaire', popular: true },
  { id: 'pack100', credits: 100, price: 19, priceHT: 15.83, label: 'Power', emoji: '⚡', desc: 'Meilleur rapport' },
];

type SelectedPack = { credits: number; price: number; priceHT: number; label: string; id: string } | null;

export function CreditsTopUpSection() {
  const { credits, limit, usage, addCredits } = useCredits();
  const [selectedPack, setSelectedPack] = useState<SelectedPack>(null);
  const [consent, setConsent] = useState<LegalConsentState>({ cgvAccepted: false, retractionWaived: false });
  const [loading, setLoading] = useState(false);

  const remaining = credits === 'unlimited' ? limit : Math.max(0, limit - usage);
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
      const legalConsent = {
        cgvAccepted:      true,
        retractionWaived: true,
        cgvVersion:       CGV_VERSION,
        acceptedAt:       new Date().toISOString(),
        userAgent:        navigator.userAgent,
      };
      // Credit packs map to 'pro' plan ID for now (backend will handle one-time via price ID)
      const result = await createCheckoutSession(selectedPack.id as 'pro' | 'expert', legalConsent);
      if (result.url && !result.fallback) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        setSelectedPack(null);
      } else if (result.fallback) {
        // Stripe not configured: simulate locally
        addCredits(selectedPack.credits);
        toast.success(`${selectedPack.credits} crédits IA ajoutés ! 🎉`, {
          description: 'Ils sont disponibles immédiatement dans votre Cockpit.',
        });
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

          {/* ── Pack Booster Événementiel ── */}
          <div className="relative rounded-2xl border-2 border-transparent bg-gradient-to-br from-violet-600 via-violet-500 to-emerald-500 p-[2px] shadow-lg shadow-violet-500/20">
            <div className="rounded-[14px] bg-gradient-to-br from-[#1a0533] via-[#0f1f18] to-[#0b1a14] px-4 py-4 space-y-3">
              {/* Badge édition limitée */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wide shadow">
                  ⚡ Édition limitée
                </span>
                <span className="text-xl font-extrabold text-white">49 €</span>
              </div>

              {/* Title */}
              <div>
                <p className="text-sm font-extrabold text-white leading-tight">Pack Booster Événementiel ⚡</p>
                <p className="text-[10px] text-violet-300 mt-0.5">Achat unique · Sans abonnement</p>
              </div>

              {/* Features */}
              <ul className="space-y-1.5">
                {[
                  { icon: <Zap size={11} />, text: '10 crédits publications valables à vie' },
                  { icon: <Wand2 size={11} />, text: 'Modèle IA spécial Ouverture / Événement / Promo Flash' },
                  { icon: <Film size={11} />, text: 'Script de Reel d\'inauguration guidé pas à pas' },
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                      {f.icon}
                    </span>
                    <span className="text-[11px] text-violet-100 leading-snug">{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSelectPack({ id: 'pack_booster', credits: 10, price: 49, priceHT: 40.83, label: 'Booster Événementiel', emoji: '⚡', desc: 'Édition limitée' })}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-emerald-500 hover:from-violet-600 hover:to-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all active:scale-95"
              >
                <Rocket size={14} /> Booster mon activité 🚀
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}