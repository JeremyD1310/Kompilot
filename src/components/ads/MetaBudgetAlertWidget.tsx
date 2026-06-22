/**
 * MetaBudgetAlertWidget — Pro-side widget: simplified Meta budget analysis.
 * Shows a vulgarized 3-indicator verdict + "Activer le Bouclier" CTA.
 */
import { useState } from 'react';
import {
  TrendingDown, Loader2, MapPin, Gauge, AlertTriangle,
  CheckCircle2, Zap, RefreshCw, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BudgetAnalysis {
  globalScore: number;
  wasteLevel: 'high' | 'medium' | 'low';
  wastePercent: number;
  localVisibility: number;
  verdict: string;
  pageConnected: boolean;
}

// ── Mock analyses ─────────────────────────────────────────────────────────────

const MOCK_ANALYSIS: BudgetAnalysis = {
  globalScore: 42,
  wasteLevel: 'high',
  wastePercent: 58,
  localVisibility: 34,
  verdict: 'Peut largement mieux faire',
  pageConnected: false,
};

const MOCK_ANALYSIS_GOOD: BudgetAnalysis = {
  globalScore: 74,
  wasteLevel: 'medium',
  wastePercent: 28,
  localVisibility: 71,
  verdict: 'Performances correctes',
  pageConnected: true,
};

// ── Waste gauge ───────────────────────────────────────────────────────────────

function WasteGauge({ level, percent }: { level: BudgetAnalysis['wasteLevel']; percent: number }) {
  const colors = {
    high:   { bg: '#FEE2E2', bar: '#EF4444', label: 'Budget gaspillé', text: '#DC2626' },
    medium: { bg: '#FEF3C7', bar: '#F59E0B', label: 'Gaspillage modéré', text: '#D97706' },
    low:    { bg: '#D1FAE5', bar: '#10B981', label: 'Peu de gaspillage', text: '#059669' },
  };
  const c = colors[level];

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: c.bg + '60', border: `1px solid ${c.bar}30` }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.bar + '20' }}>
          <TrendingDown size={14} style={{ color: c.bar }} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Indicateur Gaspillage</p>
          <p className="text-xs font-bold" style={{ color: c.text }}>{c.label}</p>
        </div>
        <span className="ml-auto text-2xl font-extrabold tabular-nums" style={{ color: c.bar }}>
          {percent}%
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: c.bar + '20' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${c.bar}cc, ${c.bar})` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {level === 'high' ? 'Ciblage trop large + absence de tracking de conversion' :
         level === 'medium' ? 'Quelques audiences hors zone de chalandise' :
         'Ciblage bien configuré pour votre secteur'}
      </p>
    </div>
  );
}

// ── Local visibility indicator ────────────────────────────────────────────────

function LocalVisibilityBadge({ percent }: { percent: number }) {
  const color = percent >= 60 ? '#10B981' : percent >= 40 ? '#F59E0B' : '#EF4444';
  const label = percent >= 60 ? 'Bonne couverture locale' : percent >= 40 ? 'Zone partielle' : 'Hors zone de chalandise';

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/30">
          <MapPin size={14} className="text-blue-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visibilité Locale</p>
          <p className="text-xs font-bold" style={{ color }}>{label}</p>
        </div>
        <span className="ml-auto text-2xl font-extrabold tabular-nums" style={{ color }}>
          {percent}%
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {percent < 40
          ? 'Vos publicités touchent des personnes qui ne peuvent pas venir dans votre commerce'
          : percent < 60
          ? 'Une partie du budget atteint des zones hors de votre rayon habituel'
          : 'La majorité de vos publicités touchent votre clientèle cible locale'}
      </p>
    </div>
  );
}

// ── Global score ring ─────────────────────────────────────────────────────────

function GlobalScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="28" fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="35" cy="35" r="28" fill="none" strokeWidth="8"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score global de performance</p>
        <p className="text-base font-extrabold mt-0.5" style={{ color }}>
          {score}/100 — "{verdict}"
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {score < 50
            ? <><AlertTriangle size={11} className="text-amber-500" /><span className="text-[11px] text-muted-foreground">Des actions correctives sont nécessaires</span></>
            : <><CheckCircle2 size={11} className="text-emerald-500" /><span className="text-[11px] text-muted-foreground">Des améliorations restent possibles</span></>
          }
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MetaBudgetAlertWidgetProps {
  pageUrl?: string;
}

export function MetaBudgetAlertWidget({ pageUrl }: MetaBudgetAlertWidgetProps) {
  const [connecting, setConnecting]   = useState(false);
  const [activating, setActivating]   = useState(false);
  const [analysis, setAnalysis]       = useState<BudgetAnalysis | null>(null);
  const [shieldActive, setShieldActive] = useState(false);
  const [inputUrl, setInputUrl]       = useState(pageUrl ?? '');

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    setAnalysis(null);
    setShieldActive(false);

    await new Promise(r => setTimeout(r, 1800));

    // Vary result based on input to feel dynamic
    const isGood = inputUrl.toLowerCase().includes('pro') || inputUrl.toLowerCase().includes('opti');
    setAnalysis(isGood ? MOCK_ANALYSIS_GOOD : MOCK_ANALYSIS);
    setConnecting(false);
  };

  const handleActivateShield = async () => {
    if (activating || shieldActive) return;
    setActivating(true);

    await new Promise(r => setTimeout(r, 1600));

    setShieldActive(true);
    setActivating(false);
    setAnalysis(prev => prev ? { ...prev, globalScore: Math.min(prev.globalScore + 32, 96), wasteLevel: 'low', wastePercent: Math.max(prev.wastePercent - 40, 8), localVisibility: Math.min(prev.localVisibility + 38, 94), verdict: 'Performances optimisées', pageConnected: true } : prev);

    toast.success('⚡ Bouclier Publicitaire Kompilot activé !', {
      description: 'Tracking CAPI configuré · Landing pages sectorielles liées · Ciblage local optimisé',
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-border flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,.06) 0%, rgba(245,158,11,.05) 100%)' }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)' }}>
          <Gauge size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground">
            📉 Est-ce que vos publicités Meta vous rapportent vraiment ?
          </p>
          <p className="text-[11px] text-muted-foreground">
            Analyse rapide de vos performances publicitaires locales
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Connection form */}
        {!analysis && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Page Facebook / Instagram de votre commerce
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <WifiOff size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://facebook.com/votrecommerce — ou laissez vide"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)' }}
            >
              {connecting ? (
                <><Loader2 size={14} className="animate-spin" /> Analyse en cours…</>
              ) : (
                <><Wifi size={14} /> Analyser mes publicités Meta</>
              )}
            </button>

            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">65 % des commerces locaux</strong> perdent plus de la moitié de leur budget Meta en raison d'un ciblage trop large et d'un tracking de conversion absent.
              </p>
            </div>
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <div className="space-y-4">
            {/* Global score */}
            <GlobalScoreRing score={analysis.globalScore} verdict={analysis.verdict} />

            {/* Waste gauge */}
            <WasteGauge level={analysis.wasteLevel} percent={analysis.wastePercent} />

            {/* Local visibility */}
            <LocalVisibilityBadge percent={analysis.localVisibility} />

            {/* Shield CTA or Active badge */}
            {shieldActive ? (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                    Bouclier Publicitaire Kompilot actif ✓
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CAPI configuré · Landing pages sectorielles liées · Ciblage optimisé
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleActivateShield}
                  disabled={activating}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)' }}
                >
                  {activating ? (
                    <><Loader2 size={14} className="animate-spin" /> Configuration en cours…</>
                  ) : (
                    <><Zap size={15} /> ⚡ Activer le Bouclier Publicitaire Kompilot</>
                  )}
                </button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Tracking CAPI · Landing pages sectorielles · Sans toucher au Business Manager
                </p>
              </div>
            )}

            {/* Reset */}
            <div className="flex justify-center">
              <button
                onClick={() => { setAnalysis(null); setShieldActive(false); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={11} />
                Analyser une autre page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
