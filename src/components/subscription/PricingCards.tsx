import { useState } from 'react';
import { Check, Zap, X, Sparkles } from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { PLANS, type PlanId, type Plan, useSubscription } from '../../context/SubscriptionContext';
import { SubscriptionCheckoutPanel } from './SubscriptionCheckoutPanel';
import { WelcomeModal } from './WelcomeModal';
import { useWelcomeEmail } from '../../hooks/useWelcomeEmail';
import { useAuth } from '../../hooks/useAuth';

// ── Feature table ─────────────────────────────────────────────────────────────

const FEATURES: { label: string; free: boolean | string; pro: boolean | string; expert: boolean | string }[] = [
  { label: 'Posts / mois',               free: '3 posts',   pro: '50 posts',   expert: 'Illimité'     },
  { label: 'Réseaux sociaux',            free: '1 réseau',  pro: '5 réseaux',  expert: 'Illimité'     },
  { label: 'Stories Instagram & Facebook', free: false,     pro: true,         expert: true           },
  { label: 'Génération IA de légendes',  free: false,       pro: true,         expert: true           },
  { label: 'Boîte de réception',         free: false,       pro: true,         expert: true           },
  { label: 'Multi-utilisateurs',         free: false,       pro: false,        expert: true           },
  { label: 'Rapports PDF',               free: false,       pro: false,        expert: true           },
  { label: 'Support prioritaire',        free: false,       pro: false,        expert: true           },
];

// ── Plan descriptions ─────────────────────────────────────────────────────────

const PLAN_SUBTITLES: Record<string, string> = {
  free:    '3 posts par mois. Idéal pour tester.',
  starter: 'Jusqu\'à 50 posts par mois. Automatisez votre présence.',
  agency:  'Posts illimités. Solution complète pour agences.',
  pro:     'Jusqu\'à 50 posts par mois. Automatisez votre présence.',
  expert:  'Posts illimités. Solution complète pour agences.',
};

// ── Feature row ───────────────────────────────────────────────────────────────

function FeatureRow({ value, isStories }: { value: boolean | string; isStories?: boolean }) {
  if (value === false) return <X size={16} className="mx-auto text-muted-foreground/40" />;
  if (value === true) {
    if (isStories) {
      return (
        <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 whitespace-nowrap">
          <Sparkles size={10} />Nouveau
        </span>
      );
    }
    return <Check size={16} className="mx-auto text-green-500" strokeWidth={2.5} />;
  }
  return <span className="text-sm text-foreground font-medium">{value}</span>;
}

// ── Plan card ─────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
  isCurrent: boolean;
  onSelect: (id: PlanId) => void;
}

function PlanCard({ plan, isPopular, isCurrent, onSelect }: PlanCardProps) {
  const featureValues = FEATURES.map(f => f[(plan.id === 'starter' ? 'pro' : plan.id === 'agency' ? 'expert' : plan.id) as 'free' | 'pro' | 'expert']);
  const isExpert = plan.id === 'expert';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
        isExpert
          ? 'border-violet-400 shadow-[0_0_0_2px_rgba(139,92,246,0.25),0_8px_32px_-8px_rgba(139,92,246,0.3)]'
          : isPopular
            ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.3)] scale-[1.02]'
            : 'border-border hover:border-primary/40 hover:shadow-md'
      } ${isCurrent ? 'bg-primary/[0.03]' : 'bg-card'}`}
    >
      {/* Expert banner */}
      {isExpert && (
        <div className="bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[11px] font-bold uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
          <Sparkles size={11} /> Stories Instagram & Facebook incluses
        </div>
      )}
      {/* Popular ribbon (non-expert) */}
      {isPopular && !isExpert && (
        <div className="bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest text-center py-1.5">
          ⭐ Populaire
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{plan.name}</p>
            {isCurrent && <Badge variant="secondary" className="text-[10px] py-0">Actuel</Badge>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-foreground">{plan.price}€</span>
            <span className="text-sm text-muted-foreground">/mois</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{PLAN_SUBTITLES[plan.id]}</p>
        </div>

        {/* Feature list */}
        <ul className="space-y-3 mb-8 flex-1">
          {FEATURES.map((f, i) => {
            const val = featureValues[i];
            const isStoriesRow = f.label.includes('Stories');
            return (
              <li key={f.label} className={`flex items-center gap-2.5 text-sm ${isStoriesRow && val === true ? 'rounded-lg bg-violet-50/60 px-2 py-1 -mx-2' : ''}`}>
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {val === false
                    ? <X size={14} className="text-muted-foreground/30" />
                    : isStoriesRow
                      ? <span className="text-base">📱</span>
                      : <Check size={14} className="text-green-500" strokeWidth={2.5} />
                  }
                </div>
                <span className={val === false ? 'text-muted-foreground/50 line-through' : isStoriesRow && val === true ? 'text-violet-700 font-semibold' : 'text-foreground'}>
                  {f.label}
                  {typeof val === 'string' && (
                    <span className="ml-1 text-muted-foreground font-normal">— {val}</span>
                  )}
                </span>
                {isStoriesRow && val === true && (
                  <span className="ml-auto text-[10px] font-bold text-violet-500 bg-violet-100 border border-violet-200 rounded-full px-2 py-0.5">Nouveau ✨</span>
                )}
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-100 text-green-700 text-sm font-semibold py-2.5 border border-green-300">
            <Check size={15} strokeWidth={2.5} />
            Offre actuelle
          </div>
        ) : (
          <Button
            onClick={() => onSelect(plan.id)}
            variant={isExpert ? 'default' : isPopular ? 'default' : 'outline'}
            className={`w-full gap-2 ${isExpert ? 'bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 border-0' : ''}`}
          >
            {plan.price === 0 ? 'Rester sur le gratuit' : (
              <>
                <Zap size={14} />
                Choisir {plan.name}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type PricingCheckout = { planId: PlanId; planName: string; priceHT: number; invoiceDesc: string } | null;

function monthYearLabel() {
  const s = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PricingCards() {
  const { currentPlan, setPlan } = useSubscription();
  const { user } = useAuth();
  const { sendWelcomeEmail } = useWelcomeEmail();
  const [checkout, setCheckout] = useState<PricingCheckout>(null);
  const [welcomeModal, setWelcomeModal] = useState<{ open: boolean; planName: string }>({ open: false, planName: '' });

  const handleSelect = (id: PlanId) => {
    if (id === currentPlan.id) return;
    const plan = PLANS.find(p => p.id === id)!;
    if (plan.price === 0) {
      setPlan(id);
      toast.success('Offre gratuite activée.');
      return;
    }
    setCheckout({
      planId: id,
      planName: `Offre ${plan.name}`,
      priceHT: parseFloat((plan.price / 1.2).toFixed(2)),
      invoiceDesc: `Abonnement ${plan.name} – ${monthYearLabel()}`,
    });
  };

  const handlePaymentSuccess = () => {
    if (!checkout) return;
    setPlan(checkout.planId);
    const plan = PLANS.find(p => p.id === checkout.planId)!;
    setWelcomeModal({ open: true, planName: checkout.planName });
    sendWelcomeEmail(checkout.planName);
    toast.success(`Offre ${plan.name} activée ! 🎉`, {
      description: `Votre abonnement à ${plan.price}€/mois est maintenant actif.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choisissez votre offre</h2>
        <p className="text-muted-foreground text-sm">Passez à une offre supérieure à tout moment. Annulation sans engagement.</p>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700">
          <Sparkles size={12} />
          Nouveau : Stories Instagram & Facebook disponibles dans l'offre Expert 🎉
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isPopular={plan.id === 'pro'}
            isCurrent={currentPlan.id === plan.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Prix TTC • Paiement sécurisé • Résiliation à tout moment
      </p>

      {checkout && checkout.planId !== 'free' && (
        <SubscriptionCheckoutPanel
          planId={checkout.planId as 'pro' | 'expert' | 'starter' | 'agency'}
          planName={checkout.planName}
          onCancel={() => setCheckout(null)}
          onCheckoutOpened={() => setCheckout(null)}
        />
      )}

      <WelcomeModal
        open={welcomeModal.open}
        onClose={() => setWelcomeModal({ open: false, planName: '' })}
        planName={welcomeModal.planName}
        firstName={user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0]}
      />
    </div>
  );
}
