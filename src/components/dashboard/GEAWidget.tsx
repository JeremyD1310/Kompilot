/**
 * GEAWidget — Generative Engine Advertising
 * Widget compact pour le tableau de bord.
 * - Commerçants : sélecteur de budget + lancement en 1 clic
 * - Agence : tableau ROI publicitaire IA multi-comptes
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Info, ChevronDown, BarChart2, Eye, MousePointerClick, Sparkles } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useUserProfile } from '../../context/UserProfileContext';
import { TermTooltip } from '../shared/TermTooltip';

/* ── Budget options ─────────────────────────────────────────────────────────── */
const BUDGET_OPTIONS = [
  { label: '50 €', value: 50, desc: 'Boost local — ~1 500 impressions IA' },
  { label: '100 €', value: 100, desc: 'Boost Pro — ~3 500 impressions IA', popular: true },
  { label: 'Personnalisé', value: null, desc: 'Définissez votre budget' },
];

/* ── Mock ROI data (Agency) ─────────────────────────────────────────────────── */
const AGENCY_ROI_DATA = [
  { account: 'Resto du Port', spend: 100, impressions: 3820, cpi: 2.62, trend: '+12%' },
  { account: 'Salon Lucia', spend: 50, impressions: 1640, cpi: 3.05, trend: '+8%' },
  { account: 'Boulangerie Merci', spend: 75, impressions: 2150, cpi: 3.49, trend: '+5%' },
];

/* ── Disclaimer ─────────────────────────────────────────────────────────────── */
const MEDIA_DISCLAIMER =
  'Les budgets publicitaires G.E.A. sont définis par l\'utilisateur et facturés indépendamment de l\'abonnement SaaS Kompilot.';

/* ── Commerce view ──────────────────────────────────────────────────────────── */
function CommerceGEA() {
  const [selected, setSelected] = useState<number | null>(100);
  const [custom, setCustom] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const effectiveBudget = selected === null ? Number(custom) || 0 : selected;

  const handleLaunch = () => {
    if (effectiveBudget <= 0) {
      toast.error('Saisissez un budget valide.');
      return;
    }
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      toast.success(`Campagne G.E.A. lancée — ${effectiveBudget} € de boost IA !`, {
        description: 'Vos publications vont être incluses dans les réponses de ChatGPT, Gemini et Claude.',
      });
    }, 1600);
  };

  return (
    <div className="space-y-4">
      {/* Budget selector */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
          Budget de boost IA
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BUDGET_OPTIONS.map((opt) => {
            const isSelected = opt.value === null ? selected === null : selected === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setSelected(opt.value);
                  setCustomOpen(opt.value === null);
                }}
                className={`relative rounded-xl border py-3 px-2 text-center transition-all text-xs font-semibold ${
                  isSelected
                    ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-teal-400/50'
                }`}
              >
                {opt.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-teal-500 text-white rounded-full px-2 py-0.5 whitespace-nowrap">
                    Populaire
                  </span>
                )}
                <span className="block text-sm font-extrabold">{opt.label}</span>
                <span className="block text-[9px] mt-0.5 leading-tight opacity-70">{opt.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        <AnimatePresence>
          {customOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden"
            >
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  placeholder="Montant en €"
                  className="w-full rounded-lg border border-input bg-background px-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">€</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Minimum recommandé : 25 €</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Estimated reach */}
      {effectiveBudget > 0 && (
        <motion.div
          key={effectiveBudget}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 px-3 py-2.5"
        >
          <Eye size={14} className="text-teal-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
              ≈ {Math.round(effectiveBudget * 35).toLocaleString('fr-FR')} impressions IA estimées
            </p>
            <p className="text-[10px] text-teal-600/70 dark:text-teal-400/70">
              Dans les réponses de ChatGPT, Gemini & Claude
            </p>
          </div>
        </motion.div>
      )}

      {/* Launch CTA */}
      <button
        type="button"
        onClick={handleLaunch}
        disabled={launching || effectiveBudget <= 0}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold py-3 text-sm hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-500/20"
      >
        {launching ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Activation en cours…
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Lancer la campagne publicitaire IA
          </>
        )}
      </button>

      {/* Disclaimer */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setShowDisclaimer(s => !s)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info size={10} />
          Note sur la facturation
          <ChevronDown size={10} className={`transition-transform ${showDisclaimer ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {showDisclaimer && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-muted-foreground leading-relaxed border-l-2 border-amber-400 pl-2 overflow-hidden"
          >
            {MEDIA_DISCLAIMER}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Agency ROI view ────────────────────────────────────────────────────────── */
function AgencyGEA() {
  const totalSpend = AGENCY_ROI_DATA.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = AGENCY_ROI_DATA.reduce((s, r) => s + r.impressions, 0);
  const avgCpi = totalImpressions > 0 ? (totalSpend / totalImpressions * 1000).toFixed(2) : '0.00';

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Budget total', value: `${totalSpend} €`, icon: <TrendingUp size={12} /> },
          { label: 'Impressions IA', value: totalImpressions.toLocaleString('fr-FR'), icon: <Eye size={12} /> },
          { label: 'CPM moyen', value: `${avgCpi} €`, icon: <BarChart2 size={12} />, term: 'CPM' as const },
        ].map(({ label, value, icon, term }) => (
          <div key={label} className="rounded-xl bg-muted/40 border border-border px-2.5 py-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              {icon}
              <span className="text-[9px] uppercase tracking-wide font-bold">{label}</span>
              {term && <TermTooltip term={term} size="sm" />}
            </div>
            <p className="text-sm font-extrabold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Per-account table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-4 gap-0 bg-muted/40 border-b border-border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          <span>Compte</span>
          <span className="text-right">Budget</span>
          <span className="text-right">Impressions</span>
          <span className="text-right">Tendance</span>
        </div>
        {AGENCY_ROI_DATA.map((row) => (
          <div key={row.account} className="grid grid-cols-4 gap-0 px-3 py-2.5 border-b border-border/50 last:border-0 text-xs hover:bg-muted/20 transition-colors">
            <span className="font-medium text-foreground truncate pr-2">{row.account}</span>
            <span className="text-right text-muted-foreground">{row.spend} €</span>
            <span className="text-right text-foreground font-semibold">{row.impressions.toLocaleString('fr-FR')}</span>
            <span className="text-right text-teal-600 font-bold">{row.trend}</span>
          </div>
        ))}
      </div>

      {/* CPI note */}
      <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
        <Info size={10} className="shrink-0 mt-0.5 text-amber-500" />
        <span>Coût par inclusion IA (CPI) = budget ÷ impressions × 1 000. {MEDIA_DISCLAIMER}</span>
      </p>

      {/* Add campaign CTA */}
      <button
        type="button"
        onClick={() => toast.success('Nouvelle campagne G.E.A. — configurez le budget par compte.')}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold py-2.5 text-xs hover:bg-teal-700 active:scale-[0.98] transition-all shadow-sm"
      >
        <Sparkles size={13} />
        Lancer une campagne G.E.A. multi-comptes
      </button>
    </div>
  );
}

/* ── Main widget ────────────────────────────────────────────────────────────── */
export function GEAWidget() {
  const { masterProfile } = useUserProfile();
  const isAgency = masterProfile === 'agence';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-teal-200/60 dark:border-teal-800/40 bg-card overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-teal-50/60 to-teal-50/20 dark:from-teal-950/30 dark:to-transparent">
        <div className="w-8 h-8 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
          <Zap size={15} className="text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-extrabold text-foreground">G.E.A. — Publicité IA</p>
            <TermTooltip term="GEA" size="md" />
            <span className="text-[9px] font-bold bg-teal-500 text-white rounded-full px-2 py-0.5 uppercase tracking-wide">
              Nouveau
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isAgency
              ? 'Pilotage ROI publicitaire multi-comptes sur moteurs IA'
              : 'Boostez votre présence dans les réponses de ChatGPT, Gemini & Claude'}
          </p>
        </div>
        {isAgency && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 rounded-full px-2.5 py-1 shrink-0">
            <MousePointerClick size={10} />
            Hub G.E.A.
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {isAgency ? <AgencyGEA /> : <CommerceGEA />}
      </div>
    </motion.div>
  );
}
