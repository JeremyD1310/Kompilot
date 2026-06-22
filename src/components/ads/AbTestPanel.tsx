/**
 * A/B Testing panel for LocalAdsModal.
 * Manages two ad variants (creative + targeting) and simulates
 * live comparative performance metrics with a winner declaration.
 */
import { useState, useEffect, useRef } from 'react';
import { FlaskConical, Trophy, RefreshCw, Pencil, Check, X, ChevronRight } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdVariant {
  id: 'A' | 'B';
  headline: string;
  cta: string;
  audience: string;
  radius: number;
  color: string;         // Tailwind text colour token
  borderColor: string;   // Tailwind border colour token
  bgColor: string;       // Tailwind bg colour token
}

interface VariantMetrics {
  reach: number;
  clicks: number;
  ctr: number;
  rdv: number;
  cpc: number;
  spend: number;        // % of budget consumed
}

interface AbTestPanelProps {
  budget: number;
  baseRadius: number;
  launched: boolean;
  onLaunchTest: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  'Femmes 25–45 ans · Beauté',
  'Hommes & Femmes 18–55 · Proximité',
  'Parents · Familles locales',
  'Professionnels actifs 30–50 ans',
  'Jeunes adultes 18–30 · Tendances',
];

const CTA_OPTIONS = [
  'Réserver maintenant',
  'En savoir plus',
  'Appeler',
  'Obtenir un devis',
  'Voir les offres',
];

const DEFAULT_VARIANTS: [AdVariant, AdVariant] = [
  {
    id: 'A',
    headline: '🌸 Offre de bienvenue — -20% sur votre 1ère visite',
    cta: 'Réserver maintenant',
    audience: 'Femmes 25–45 ans · Beauté',
    radius: 5,
    color: 'text-violet-700',
    borderColor: 'border-violet-400',
    bgColor: 'bg-violet-50',
  },
  {
    id: 'B',
    headline: '⭐ Nos clients adorent ! Venez découvrir nos services',
    cta: 'En savoir plus',
    audience: 'Hommes & Femmes 18–55 · Proximité',
    radius: 10,
    color: 'text-teal-700',
    borderColor: 'border-teal-400',
    bgColor: 'bg-teal-50',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function seeded(seed: number, t: number) {
  const x = Math.sin(seed * 31 + t * 7) * 10000;
  return x - Math.floor(x);
}

function calcMetrics(variantSeed: number, budget: number, tick: number): VariantMetrics {
  const progress = Math.min(1, tick / 70);
  const base = (budget / 2) * progress;  // each variant gets half the budget
  const noiseR = 0.88 + 0.24 * seeded(variantSeed, tick);
  const noiseC = 0.80 + 0.40 * seeded(variantSeed + 1, tick);
  const reach  = Math.round(base * 28 * noiseR);
  const ctr    = +(2.4 + 2.0 * seeded(variantSeed + 2, tick)).toFixed(1);
  const clicks = Math.round(reach * (ctr / 100) * noiseC);
  const rdv    = Math.round(clicks * (0.07 + 0.06 * seeded(variantSeed + 3, tick)));
  const cpc    = clicks > 0 ? +((base / clicks)).toFixed(2) : 0;
  const spend  = Math.round(progress * 100);
  return { reach, clicks, ctr, rdv, cpc, spend };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EditableField({
  label, value, options, onSave,
}: { label: string; value: string; options?: string[]; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <div className="flex items-start gap-1.5 group">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">{label}</p>
          <p className="text-xs text-foreground leading-snug">{value}</p>
        </div>
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0 text-muted-foreground hover:text-primary"
        >
          <Pencil size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
      {options ? (
        <select
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
      <div className="flex gap-1.5">
        <button onClick={commit} className="flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-1 text-[10px] font-semibold">
          <Check size={10} /> OK
        </button>
        <button onClick={cancel} className="flex items-center gap-1 rounded-md border border-border text-muted-foreground px-2 py-1 text-[10px] font-semibold">
          <X size={10} /> Annuler
        </button>
      </div>
    </div>
  );
}

function VariantCard({
  variant, metrics, isWinner, launched, onUpdate,
}: {
  variant: AdVariant;
  metrics: VariantMetrics | null;
  isWinner: boolean;
  launched: boolean;
  onUpdate: (v: Partial<AdVariant>) => void;
}) {
  return (
    <div className={cn(
      'relative rounded-xl border-2 p-3 space-y-2.5 transition-all',
      isWinner ? `${variant.borderColor} ${variant.bgColor} shadow-md` : 'border-border bg-card',
    )}>
      {/* Badge */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
          variant.bgColor, variant.color,
        )}>
          Variante {variant.id}
        </span>
        {isWinner && launched && (
          <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            <Trophy size={10} /> Meilleure perf.
          </span>
        )}
      </div>

      {/* Editable fields */}
      <EditableField
        label="Accroche"
        value={variant.headline}
        onSave={headline => onUpdate({ headline })}
      />
      <div className="grid grid-cols-2 gap-2">
        <EditableField
          label="CTA"
          value={variant.cta}
          options={CTA_OPTIONS}
          onSave={cta => onUpdate({ cta })}
        />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Rayon</p>
          <div className="flex items-center gap-1.5">
            <input
              type="range" min={1} max={25} step={1} value={variant.radius}
              onChange={e => onUpdate({ radius: +e.target.value })}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-violet-600"
            />
            <span className={cn('text-[10px] font-bold tabular-nums', variant.color)}>{variant.radius} km</span>
          </div>
        </div>
      </div>
      <EditableField
        label="Audience ciblée"
        value={variant.audience}
        options={AUDIENCE_OPTIONS}
        onSave={audience => onUpdate({ audience })}
      />

      {/* Live metrics */}
      {launched && metrics && (
        <div className={cn('rounded-lg border px-2.5 py-2 mt-1 grid grid-cols-3 gap-x-2 gap-y-1.5', variant.borderColor + '/40', variant.bgColor + '/40')}>
          {[
            { l: 'Portée',  v: metrics.reach.toLocaleString('fr-FR') },
            { l: 'Clics',   v: metrics.clicks.toLocaleString('fr-FR') },
            { l: 'CTR',     v: `${metrics.ctr}%` },
            { l: 'RDV',     v: String(metrics.rdv) },
            { l: 'CPC',     v: metrics.cpc > 0 ? `${metrics.cpc}€` : '—' },
            { l: 'Budget',  v: `${metrics.spend}%` },
          ].map(({ l, v }) => (
            <div key={l} className="text-center">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wide">{l}</p>
              <p className={cn('text-[11px] font-extrabold tabular-nums', variant.color)}>{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function AbTestPanel({ budget, launched, onLaunchTest }: AbTestPanelProps) {
  const [variants, setVariants] = useState<[AdVariant, AdVariant]>(DEFAULT_VARIANTS);
  const [metricsA, setMetricsA] = useState<VariantMetrics | null>(null);
  const [metricsB, setMetricsB] = useState<VariantMetrics | null>(null);
  const [tick, setTick]         = useState(0);
  const [winner, setWinner]     = useState<'A' | 'B' | null>(null);
  const tickRef = useRef(0);

  const updateVariant = (id: 'A' | 'B', patch: Partial<AdVariant>) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v) as [AdVariant, AdVariant]);
  };

  useEffect(() => {
    if (!launched) return;
    const interval = setInterval(() => {
      tickRef.current = Math.min(70, tickRef.current + 1);
      const t = tickRef.current;
      setTick(t);
      const mA = calcMetrics(1, budget, t);
      const mB = calcMetrics(5, budget, t);
      setMetricsA(mA);
      setMetricsB(mB);
      // Declare winner after 40% progress with consistent leader
      if (t > 28 && !winner) {
        if (mA.rdv > mB.rdv * 1.15) setWinner('A');
        else if (mB.rdv > mA.rdv * 1.15) setWinner('B');
      }
    }, 1600);
    return () => clearInterval(interval);
  }, [launched, budget]);

  const progress = Math.round((tick / 70) * 100);

  // Apply winner to campaign handler
  const handleApplyWinner = () => {
    if (!winner) return;
    const w = variants.find(v => v.id === winner)!;
    toast.success(`✅ Variante ${winner} appliquée à votre campagne`, {
      description: `"${w.headline.slice(0, 50)}…" sera diffusée en priorité.`,
    });
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <FlaskConical size={13} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">Test A/B des créatifs publicitaires</p>
          <p className="text-[10px] text-muted-foreground">Comparez 2 versions — l'IA identifie la plus performante</p>
        </div>
        {launched && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <RefreshCw size={10} className="animate-spin" />
            <span className="text-emerald-600 font-semibold">Live</span>
          </div>
        )}
      </div>

      {/* Progress bar (only when live) */}
      {launched && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Progression du test</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Split bar visualisation (only when live) */}
      {launched && metricsA && metricsB && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
          <p className="text-[11px] font-bold text-foreground">Comparaison RDV générés</p>
          {(['A', 'B'] as const).map(id => {
            const m = id === 'A' ? metricsA : metricsB;
            const v = variants.find(v => v.id === id)!;
            const maxRdv = Math.max(metricsA.rdv, metricsB.rdv, 1);
            const pct = Math.round((m.rdv / maxRdv) * 100);
            return (
              <div key={id} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className={cn('font-bold', v.color)}>Variante {id}</span>
                  <span className="font-extrabold text-foreground tabular-nums">{m.rdv} RDV</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', id === 'A' ? 'bg-violet-500' : 'bg-teal-500')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Variant cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variants.map(v => (
          <VariantCard
            key={v.id}
            variant={v}
            metrics={v.id === 'A' ? metricsA : metricsB}
            isWinner={winner === v.id}
            launched={launched}
            onUpdate={patch => updateVariant(v.id, patch)}
          />
        ))}
      </div>

      {/* Winner banner */}
      {winner && (
        <div className={cn(
          'rounded-xl border-2 px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
          winner === 'A' ? 'border-violet-400 bg-violet-50' : 'border-teal-400 bg-teal-50',
        )}>
          <Trophy size={18} className={winner === 'A' ? 'text-violet-600 shrink-0 mt-0.5' : 'text-teal-600 shrink-0 mt-0.5'} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs font-extrabold', winner === 'A' ? 'text-violet-800' : 'text-teal-800')}>
              🏆 Variante {winner} en tête !
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
              {winner === 'A' ? variants[0].headline.slice(0, 55) : variants[1].headline.slice(0, 55)}…
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {winner === 'A'
                ? `+${Math.round(((metricsA?.rdv ?? 0) / Math.max(metricsB?.rdv ?? 1, 1) - 1) * 100)}% de RDV`
                : `+${Math.round(((metricsB?.rdv ?? 0) / Math.max(metricsA?.rdv ?? 1, 1) - 1) * 100)}% de RDV`} vs l'autre variante
            </p>
          </div>
          <button
            onClick={handleApplyWinner}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-white shrink-0',
              winner === 'A' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-teal-600 hover:bg-teal-700',
            )}
          >
            Appliquer <ChevronRight size={10} />
          </button>
        </div>
      )}

      {/* Pre-launch CTA */}
      {!launched && (
        <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-4 py-4 text-center space-y-2">
          <FlaskConical size={20} className="text-violet-400 mx-auto" />
          <p className="text-xs font-semibold text-violet-800">
            Personnalisez vos 2 variantes ci-dessus, puis lancez votre test.
          </p>
          <p className="text-[10px] text-violet-600">
            Chaque variante reçoit 50% du budget — l'IA déclare un gagnant en cours de diffusion.
          </p>
          <button
            onClick={onLaunchTest}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white px-4 py-2 text-xs font-extrabold shadow-sm hover:from-violet-700 hover:to-teal-600 transition-all active:scale-95"
          >
            <FlaskConical size={13} /> Lancer le test A/B
          </button>
        </div>
      )}
    </div>
  );
}
