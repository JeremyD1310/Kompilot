import { useState, type ReactNode } from 'react';
import {
  ArrowRight, CalendarDays, CheckCircle2, ExternalLink, LifeBuoy,
  Loader2, MessageSquare, PhoneCall, Send, Sparkles, X,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { openAIChat } from '../../hooks/useMentorTriggers';
import {
  changeBillingPlan,
  checkMissingFeature,
  submitMissingFeature,
  type BillingStatus,
  type CancellationMetrics,
  type FeatureCheckResult,
} from '../../lib/cancellationClient';
import { cn } from '../../lib/utils';
import type { SubscriptionPlanId } from '../../../shared/pricingCatalog';

type Reason = 'hard_to_use' | 'missing_feature' | 'too_expensive' | 'other';

const fallbackValue = [
  { title: "Scores d'audit GEO", desc: 'Votre visibilité dans les réponses des assistants IA.' },
  { title: 'Réponses IA aux avis Google', desc: 'Vos réponses préparées et votre historique de traitement.' },
  { title: 'Calendrier éditorial', desc: 'Vos publications planifiées et vos automatismes de contenu.' },
];

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex justify-end px-5 pt-4">
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fermer">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function HelpReasonModal({ onClose, firstName }: { onClose: () => void; firstName: string }) {
  return (
    <Modal onClose={onClose}>
      <div className="space-y-5 px-6 pb-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><LifeBuoy size={22} /></div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">On peut vous aider à débloquer ça</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Ce n'est pas toujours évident au début, {firstName}. Nous pouvons vous accompagner sans vous pousser à rester.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <a href="mailto:support@kompilot.fr?subject=Appel de 15 minutes Kompilot" className="rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-primary/5">
            <PhoneCall size={18} className="mb-3 text-primary" />
            <p className="font-bold text-foreground">Parler 15 minutes</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Demandez un appel avec le support pour revoir ensemble le point qui vous bloque.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Contacter le support <ArrowRight size={13} /></span>
          </a>
          <button onClick={() => { onClose(); openAIChat('Je trouve Kompilot difficile à utiliser. Peux-tu m’accompagner pas à pas ?'); }} className="rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5">
            <MessageSquare size={18} className="mb-3 text-primary" />
            <p className="font-bold text-foreground">Ouvrir l'assistant d'aide</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Posez votre question directement à l'assistant déjà disponible dans Kompilot.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Ouvrir l'assistant <ArrowRight size={13} /></span>
          </button>
        </div>
        <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">Je préfère continuer ma résiliation</button>
      </div>
    </Modal>
  );
}

export function MissingFeatureModal({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeatureCheckResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (feature.trim().length < 3) return toast.error('Décrivez la fonctionnalité qui vous manque.');
    setLoading(true);
    try {
      const match = await checkMissingFeature(feature);
      setResult(match);
      if (!match.exists) {
        await submitMissingFeature(feature);
        setSubmitted(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'La vérification a échoué.');
    } finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-5 px-6 pb-6">
        <div>
          <h3 className="text-lg font-extrabold text-foreground">Dites-nous ce qui vous manque</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Nous allons vérifier si cette fonctionnalité existe déjà dans Kompilot.</p>
        </div>
        {!result && (
          <div className="space-y-2">
            <label htmlFor="missing-feature" className="text-sm font-semibold text-foreground">Quelle fonctionnalité vous manque&nbsp;?</label>
            <textarea id="missing-feature" value={feature} onChange={e => setFeature(e.target.value)} rows={4} placeholder="Ex. suivre mes avis Google depuis une seule page…" className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={handleSubmit} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Vérifier la fonctionnalité
            </button>
          </div>
        )}
        {result?.exists && (
          <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} /><div><p className="font-bold text-foreground">Cette fonctionnalité existe déjà</p><p className="mt-1 text-sm text-muted-foreground">{result.description}</p></div></div>
            <a href={result.tryPath} onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Essayer {result.featureName} <ExternalLink size={14} /></a>
          </div>
        )}
        {result && !result.exists && submitted && (
          <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex gap-3"><Sparkles className="mt-0.5 shrink-0 text-primary" size={19} /><div><p className="font-bold text-foreground">Merci, votre demande est transmise</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">L'équipe produit va l'étudier. Si vous souhaitez toujours annuler, vous pouvez continuer.</p></div></div>
            <button onClick={onContinue} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-950/20 dark:text-red-400">Continuer ma résiliation <ArrowRight size={14} /></button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function ValueAtStake({ metrics }: { metrics: CancellationMetrics | null }) {
  const personalizedItems = [
    ...(metrics?.postsPublished ? [{ title: `${metrics.postsPublished} publications réalisées`, desc: 'Votre contenu et vos validations sont centralisés dans Kompilot.' }] : []),
    ...(metrics?.geoScoreCurrent ? [{ title: `Score GEO : ${metrics.geoScoreCurrent}/100`, desc: metrics.geoScoreDelta !== null && metrics.geoScoreDelta !== undefined ? `${metrics.geoScoreDelta >= 0 ? '+' : ''}${metrics.geoScoreDelta} points depuis votre inscription.` : 'Votre progression de visibilité dans les réponses IA.' }] : []),
  ];
  // Review handling is intentionally generic until the refactored reviews data is reliable.
  const items = personalizedItems.length > 0
    ? [...personalizedItems, fallbackValue[1]]
    : fallbackValue;
  return <div className="space-y-2.5">{items.map(item => <div key={item.title} className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"><p className="text-sm font-semibold text-foreground">{item.title}</p><p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.desc}</p></div>)}</div>;
}

export function PersonalizedConfirm({ planName, metrics, onBack, onConfirm, loading = false }: { planName: string; metrics: CancellationMetrics | null; onBack: () => void; onConfirm: () => void; loading?: boolean }) {
  return <Modal onClose={onBack}><div className="space-y-5 px-6 pb-6"><div><h3 className="text-lg font-extrabold text-foreground">Avant de confirmer</h3><p className="mt-1 text-sm text-muted-foreground">Voici ce que vous conserverez jusqu'à la fin de votre période avec l'offre {planName}.</p></div><ValueAtStake metrics={metrics} /><div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground"><CalendarDays size={14} className="shrink-0" /> Votre accès restera actif jusqu'à la date indiquée par votre abonnement.</div><div className="flex gap-2"><button onClick={onBack} disabled={loading} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50">Conserver mon abonnement</button><button onClick={onConfirm} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{loading && <Loader2 size={15} className="animate-spin" />} {loading ? 'Enregistrement…' : 'Confirmer'}</button></div></div></Modal>;
}

export function DowngradeModal({ currentPlan, billing, onBack, onDone }: { currentPlan: SubscriptionPlanId; billing: BillingStatus; onBack: () => void; onDone: (periodEnd?: string | null) => void }) {
  const target = currentPlan === 'agency' ? 'multi' : 'pro';
  const targetName = target === 'multi' ? 'Multi' : 'Pro';
  const [loading, setLoading] = useState(false);
  const handleDowngrade = async () => {
    setLoading(true);
    try { const result = await changeBillingPlan(target, billing.billingInterval ?? 'monthly'); toast.success(`Passage vers l'offre ${targetName} programmé.`); onDone(result.subscription?.currentPeriodEnd ?? billing.currentPeriodEnd); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Le changement de forfait a échoué.'); }
    finally { setLoading(false); }
  };
  return <Modal onClose={onBack}><div className="space-y-5 px-6 pb-6"><div><h3 className="text-lg font-extrabold text-foreground">Une formule plus simple peut suffire</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Avant d'annuler, vous pouvez passer de {currentPlan === 'agency' ? 'Agency' : 'Multi'} à {targetName}. Vos données restent dans Kompilot et votre abonnement continue sur le nouveau forfait.</p></div><div className="rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="font-bold text-foreground">Forfait {targetName}</p><p className="mt-1 text-xs text-muted-foreground">Une option plus légère, sans supprimer votre compte ni votre historique.</p></div><div className="flex gap-2"><button onClick={onBack} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-foreground hover:bg-muted/50">Pas maintenant</button><button onClick={handleDowngrade} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{loading && <Loader2 size={15} className="animate-spin" />} Passer à {targetName}</button></div></div></Modal>;
}

export function ExitSummary({ planName, periodEnd, onClose }: { planName: string; periodEnd?: string | null; onClose: () => void }) {
  const date = periodEnd ? new Date(periodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'la fin de votre période en cours';
  return <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-800/40 dark:bg-emerald-950/20"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600" size={23} /><div><h3 className="font-extrabold text-foreground">Votre résiliation est bien enregistrée</h3><p className="text-xs text-muted-foreground">Vous restez sur {planName} jusqu'au {date}.</p></div></div><div className="space-y-2 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground"><p><strong className="text-foreground">Revenir :</strong> reconnectez-vous et reprenez un abonnement quand vous le souhaitez, ou écrivez-nous à support@kompilot.fr.</p><p><strong className="text-foreground">Vos données :</strong> elles restent accessibles pendant la période active. Après la fin du délai d'export annoncé par Kompilot, elles suivent notre politique de conservation et de suppression.</p></div><button onClick={onClose} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">Retour aux paramètres</button></div>;
}
