/**
 * AdTruthDetector — "Le Détecteur de Mensonges Publicitaires"
 * Shows the gap between platform-reported ROAS and Kompilot's real attribution.
 */
import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Eye, TrendingDown } from 'lucide-react';

// ── Channel truth data ─────────────────────────────────────────────────────────

type Channel = 'google' | 'meta' | 'local';

interface TruthData {
  declaredRoas: number;
  realRoas: number;
  declaredLabel: string;
  realLabel: string;
  realStatus: 'loss' | 'underperform' | 'ok';
  inflationPct: number;
  explanation: string;
}

const TRUTH_DATA: Record<Channel, TruthData> = {
  google: {
    declaredRoas: 3.5,
    realRoas: 1.2,
    declaredLabel: 'On scale ✓',
    realLabel: 'Sous-performant',
    realStatus: 'underperform',
    inflationPct: 192,
    explanation:
      "Google Ads attribue les conversions à la dernière session payante, même si l'achat aurait eu lieu sans la publicité. Résultat : les clics organiques et directs sont souvent « volés » par le canal payant.",
  },
  meta: {
    declaredRoas: 4.1,
    realRoas: 0.9,
    declaredLabel: 'On scale ✓',
    realLabel: 'Perte nette',
    realStatus: 'loss',
    inflationPct: 356,
    explanation:
      "Meta utilise une fenêtre d'attribution de 7 jours après clic + 1 jour après vue. N'importe quelle conversion survenant dans cette fenêtre lui est attribuée — même si le client avait déjà décidé d'acheter.",
  },
  local: {
    declaredRoas: 2.8,
    realRoas: 2.1,
    declaredLabel: 'On scale ✓',
    realLabel: 'Acceptable',
    realStatus: 'ok',
    inflationPct: 33,
    explanation:
      "Les Local Ads (Google Maps, fiches GMB) ont une attribution plus propre car l'intention locale est directe. L'écart reste présent mais reste dans des marges acceptables.",
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ROASRow({
  label,
  roas,
  badge,
  badgeVariant,
  animate,
}: {
  label: string;
  roas: number;
  badge: string;
  badgeVariant: 'green' | 'red' | 'amber';
  animate?: boolean;
}) {
  const [displayed, setDisplayed] = useState(animate ? 0 : roas);

  useEffect(() => {
    if (!animate) { setDisplayed(roas); return; }
    setDisplayed(0);
    const start = performance.now();
    const duration = 900;
    const step = (ts: number) => {
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(parseFloat((eased * roas).toFixed(1)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [roas, animate]);

  const badgeStyles: Record<string, string> = {
    green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };

  const roasColor: Record<string, string> = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
      <span className="text-sm text-slate-300 font-medium flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className={`text-lg font-black tabular-nums ${roasColor[badgeVariant]}`}>
          {displayed.toFixed(1)}x
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${badgeStyles[badgeVariant]}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}

function InflationBar({ pct }: { pct: number }) {
  const cappedWidth = Math.min(pct, 400);
  const displayWidth = (cappedWidth / 400) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-500 font-semibold">Sur-attribution déclarée</span>
        <span className="text-red-400 font-black">+{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000"
          style={{ width: `${displayWidth}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AdTruthDetectorProps {
  activeChannel: Channel;
}

export function AdTruthDetector({ activeChannel }: AdTruthDetectorProps) {
  const [revealed, setRevealed] = useState(false);
  const [animating, setAnimating] = useState(false);

  const data = TRUTH_DATA[activeChannel];

  // Reset when channel changes
  useEffect(() => {
    setRevealed(false);
    setAnimating(false);
  }, [activeChannel]);

  const handleReveal = () => {
    setRevealed(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
  };

  const statusIcon = {
    loss: <XCircle size={13} className="text-red-400 shrink-0" />,
    underperform: <TrendingDown size={13} className="text-amber-400 shrink-0" />,
    ok: <CheckCircle size={13} className="text-emerald-400 shrink-0" />,
  }[data.realStatus];

  const realBadgeVariant: 'green' | 'red' | 'amber' = {
    loss: 'red',
    underperform: 'amber',
    ok: 'green',
  }[data.realStatus] as 'green' | 'red' | 'amber';

  return (
    <div className="rounded-2xl border border-red-500/20 bg-[#0f1521] overflow-hidden shadow-[0_0_40px_-12px_rgba(239,68,68,0.15)]">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0 border border-red-500/20">
          <ShieldAlert size={17} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-white">Vérification de l'Attribution</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 whitespace-nowrap">
              🔍 Détecteur de mensonges
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ce que la plateforme vous montre vs. la réalité
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Platform row */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
            Affiché par la plateforme
          </p>
          <ROASRow
            label={`${activeChannel === 'google' ? '🔍 Google Ads' : activeChannel === 'meta' ? '📘 Meta Ads' : '📍 Local Ads'} — Rapporté`}
            roas={data.declaredRoas}
            badge={data.declaredLabel}
            badgeVariant="green"
          />
        </div>

        {/* Divider with eye icon */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <button
            onClick={handleReveal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
              revealed
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 cursor-default'
                : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 cursor-pointer active:scale-95'
            }`}
          >
            <Eye size={11} />
            {revealed ? 'Vérité révélée' : 'Révéler la vérité'}
          </button>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Kompilot row */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
            Kompilot Tracking — Réel
          </p>
          {revealed ? (
            <ROASRow
              label="🛰️ Kompilot — Attribution réelle"
              roas={data.realRoas}
              badge={data.realLabel}
              badgeVariant={realBadgeVariant}
              animate={animating}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] border-dashed">
              <span className="text-sm text-slate-600 font-medium">🛰️ Kompilot — Attribution réelle</span>
              <div className="flex items-center gap-2">
                <div className="text-lg font-black text-slate-600">?.?x</div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/[0.04] text-slate-600 border border-white/[0.06]">
                  Masqué
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inflation bar — only when revealed */}
        {revealed && (
          <div className="pt-1">
            <InflationBar pct={data.inflationPct} />
          </div>
        )}

        {/* Status pill */}
        {revealed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            {statusIcon}
            <p className="text-xs text-slate-400 leading-snug">
              {data.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 bg-white/[0.02] border-t border-white/[0.04]">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-semibold">Kompilot</span> retrace chaque conversion jusqu'à la source réelle pour vous éviter de scaler des campagnes qui vous coûtent de l'argent.
        </p>
      </div>
    </div>
  );
}
