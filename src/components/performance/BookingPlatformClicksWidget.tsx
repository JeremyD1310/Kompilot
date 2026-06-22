/**
 * BookingPlatformClicksWidget
 * Shows booking click stats with a date-range filter and bar chart.
 * Appears in the Performance / ROI tab.
 */
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ExternalLink, TrendingUp, MousePointerClick, Zap,
  CalendarRange, ChevronDown, Info, HelpCircle, AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEstablishment } from '../../context/EstablishmentContext';
import {
  getBookingClicks,
  getClicksForDateRange,
  estimateReservations,
  estimateRevenue,
  getAverageBasket,
  getCurrentDayKey,
  daysAgoKey,
  simulateClicks,
} from '../../lib/bookingClickTracker';
import { detectPlatformFromUrl } from '../../lib/bookingPlatforms';

// ── Tooltip primitive ─────────────────────────────────────────────────────────

/**
 * Lightweight CSS-only-ish tooltip — renders above the trigger by default.
 * No portal needed: uses absolute positioning within a relative wrapper.
 */
function Tip({
  content,
  children,
  side = 'top',
  maxWidth = 220,
  icon,
}: {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  icon?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), 300);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  const posClass: Record<typeof side, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  const arrowClass: Record<typeof side, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-foreground',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-foreground',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-foreground',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-foreground',
  };

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            posClass[side]
          )}
          style={{ width: maxWidth }}
        >
          <span className="flex items-start gap-1.5 bg-foreground text-background text-[10px] leading-relaxed font-medium rounded-lg px-2.5 py-2 shadow-xl">
            {icon && <span className="shrink-0 mt-px">{icon}</span>}
            {content}
          </span>
          {/* Arrow */}
          <span
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClass[side]
            )}
          />
        </span>
      )}
    </span>
  );
}

// ── Preset definitions ────────────────────────────────────────────────────────

type Preset = '7d' | '14d' | '30d' | '90d' | 'custom';

interface PresetOption {
  id: Preset;
  label: string;
  days?: number;
  tooltip: string;
}

const PRESETS: PresetOption[] = [
  {
    id: '7d',
    label: '7 jours',
    days: 6,
    tooltip: "Affiche les 7 derniers jours glissants, aujourd'hui inclus. Idéal pour surveiller une campagne en cours.",
  },
  {
    id: '14d',
    label: '14 jours',
    days: 13,
    tooltip: "Deux semaines complètes — utile pour comparer semaine courante vs semaine précédente.",
  },
  {
    id: '30d',
    label: '30 jours',
    days: 29,
    tooltip: "Vue mensuelle glissante. Correspond approximativement à un mois calendaire.",
  },
  {
    id: '90d',
    label: '90 jours',
    days: 89,
    tooltip: "Trois mois de tendance — parfait pour identifier des patterns saisonniers ou l'effet d'une campagne longue durée.",
  },
  {
    id: 'custom',
    label: 'Perso.',
    tooltip: "Définissez votre propre plage de dates. La date de début ne peut pas dépasser aujourd'hui, et la plage est limitée aux données stockées localement (depuis l'activation du tracking).",
  },
];

// ── Bar chart ─────────────────────────────────────────────────────────────────

interface ChartDay {
  date: string;
  label: string;
  clicks: number;
}

function ClicksBarChart({ data, compact }: { data: ChartDay[]; compact: boolean }) {
  const max = Math.max(...data.map(d => d.clicks), 1);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const labelEvery = data.length <= 14 ? 1 : data.length <= 30 ? 3 : 7;

  return (
    <div className="relative">
      <div className={cn('flex items-end gap-px', compact ? 'h-16' : 'h-24')}>
        {data.map((d, i) => {
          const heightPct = Math.max((d.clicks / max) * 100, d.clicks > 0 ? 6 : 1);
          const isActive = activeIdx === i;
          return (
            <div
              key={d.date}
              className="flex flex-col items-center flex-1 cursor-default group relative"
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {/* Hover tooltip */}
              {isActive && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] font-semibold px-2 py-1 rounded-md whitespace-nowrap z-20 pointer-events-none shadow-lg">
                  {d.date}
                  <span className="ml-1 text-emerald-300">
                    {d.clicks} clic{d.clicks > 1 ? 's' : ''}
                  </span>
                  <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-l-transparent border-r-transparent border-b-transparent border-t-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'w-full rounded-t transition-all duration-150',
                  d.clicks > 0
                    ? isActive
                      ? 'bg-emerald-500'
                      : 'bg-emerald-400 dark:bg-emerald-500 group-hover:bg-emerald-500'
                    : 'bg-muted/40 dark:bg-muted/20'
                )}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-px mt-1">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[7px] text-muted-foreground leading-none block truncate">
                {d.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI card with tooltip ─────────────────────────────────────────────────────

function KpiCard({
  value,
  label,
  colorClass,
  tooltip,
}: {
  value: string | number;
  label: string;
  colorClass: string;
  tooltip: string;
}) {
  return (
    <div className="rounded-lg bg-white/60 dark:bg-white/5 p-2.5 text-center relative">
      <p className={cn('text-2xl font-extrabold tabular-nums', colorClass)}>
        {value}
      </p>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <Tip content={tooltip} side="bottom" maxWidth={200}>
          <HelpCircle size={9} className="text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
        </Tip>
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function BookingPlatformClicksWidget() {
  const { activeEstablishment } = useEstablishment();
  const bookingUrl = activeEstablishment?.bookingUrl ?? '';
  const platform = bookingUrl ? detectPlatformFromUrl(bookingUrl) : null;

  // Date range state
  const [preset, setPreset] = useState<Preset>('7d');
  const [customStart, setCustomStart] = useState(daysAgoKey(29));
  const [customEnd, setCustomEnd] = useState(getCurrentDayKey());
  const [showCustom, setShowCustom] = useState(false);

  // Derived dates
  const { startDate, endDate } = useMemo(() => {
    if (preset === 'custom') return { startDate: customStart, endDate: customEnd };
    const found = PRESETS.find(p => p.id === preset);
    const days = found?.days ?? 6;
    return { startDate: daysAgoKey(days), endDate: getCurrentDayKey() };
  }, [preset, customStart, customEnd]);

  // Data
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [totalAllTime, setTotalAllTime] = useState(0);

  useEffect(() => {
    const load = () => {
      setChartData(getClicksForDateRange(startDate, endDate));
      setTotalAllTime(getBookingClicks());
    };
    load();
    window.addEventListener('kompilot:booking-click', load);
    return () => window.removeEventListener('kompilot:booking-click', load);
  }, [startDate, endDate]);

  const rangeClicks = useMemo(() => chartData.reduce((s, d) => s + d.clicks, 0), [chartData]);
  const reservations = estimateReservations(rangeClicks);
  const revenue = estimateRevenue(reservations, getAverageBasket());
  const isDev = import.meta.env.DEV;
  const today = getCurrentDayKey();

  // Range label
  const rangeLabel = useMemo(() => {
    if (preset !== 'custom') return PRESETS.find(p => p.id === preset)?.label ?? '';
    return `${customStart} → ${customEnd}`;
  }, [preset, customStart, customEnd]);

  // Custom range: warn if gap > 90 days (performance)
  const customDayCount = useMemo(() => {
    if (preset !== 'custom') return 0;
    const ms = new Date(customEnd + 'T00:00:00').getTime() - new Date(customStart + 'T00:00:00').getTime();
    return Math.round(ms / 86_400_000) + 1;
  }, [preset, customStart, customEnd]);
  const customRangeTooLong = preset === 'custom' && customDayCount > 365;

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!bookingUrl) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Aucun outil de réservation configuré
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Ajoutez votre lien Fresha, TheFork, Planity… dans les paramètres de votre établissement pour suivre vos clics de réservation.
          </p>
        </div>
      </div>
    );
  }

  // ── Widget ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 dark:border-emerald-800 p-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
            <MousePointerClick size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Clics vers {platform ? platform.name : 'votre page de réservation'}
            </p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-muted-foreground">Suivi sur : {rangeLabel}</p>
              <Tip
                content="Les clics sont enregistrés localement dans votre navigateur lorsqu'un visiteur clique sur un bouton de réservation généré par Kompilot. Les données ne sont disponibles que depuis l'activation du tracking."
                side="right"
                maxWidth={240}
                icon={<Info size={9} />}
              >
                <Info size={9} className="text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
              </Tip>
            </div>
          </div>
        </div>
        {platform && <span className="text-2xl">{platform.emoji}</span>}
      </div>

      {/* ── Date range filter ── */}
      <div className="space-y-2">
        {/* Label + presets row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tip
            content="Choisissez la période d'analyse. Les périodes glissantes (7j, 14j…) se terminent toujours aujourd'hui. Pour analyser une semaine passée précise, utilisez «\u00a0Perso.\u00a0»."
            side="right"
            maxWidth={250}
            icon={<CalendarRange size={9} />}
          >
            <CalendarRange size={12} className="text-muted-foreground cursor-help shrink-0" />
          </Tip>

          {PRESETS.map(p => (
            <Tip key={p.id} content={p.tooltip} side="top" maxWidth={220}>
              <button
                onClick={() => {
                  setPreset(p.id);
                  setShowCustom(p.id === 'custom');
                }}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border',
                  preset === p.id
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-white/60 dark:bg-white/10 text-muted-foreground border-border hover:border-emerald-400 hover:text-emerald-700'
                )}
              >
                {p.label}
                {p.id === 'custom' && <ChevronDown size={9} className="inline ml-0.5" />}
              </button>
            </Tip>
          ))}
        </div>

        {/* Custom date inputs */}
        {showCustom && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap bg-white/50 dark:bg-white/5 rounded-lg px-3 py-2 border border-border">
              {/* Start date */}
              <div className="flex items-center gap-1.5">
                <Tip
                  content="Date de début de l'analyse. Doit être antérieure ou égale à la date de fin. Les données antérieures à l'activation du tracking afficheront 0."
                  side="bottom"
                  maxWidth={220}
                  icon={<Info size={9} />}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground cursor-help">Du</span>
                </Tip>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={e => setCustomStart(e.target.value)}
                  className="text-[11px] bg-transparent border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  title="Date de début — les données antérieures au premier clic tracké afficheront 0"
                />
              </div>

              {/* End date */}
              <div className="flex items-center gap-1.5">
                <Tip
                  content="Date de fin de l'analyse. Ne peut pas dépasser aujourd'hui — le tracking ne prédit pas le futur."
                  side="bottom"
                  maxWidth={220}
                  icon={<Info size={9} />}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground cursor-help">au</span>
                </Tip>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={today}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="text-[11px] bg-transparent border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  title={`Date de fin — maximum aujourd'hui (${today})`}
                />
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-muted-foreground">
                  {customDayCount} jour{customDayCount > 1 ? 's' : ''}
                </span>
                <Tip
                  content={
                    customRangeTooLong
                      ? "Plage très longue (> 365 jours) — l'affichage peut être dense. Pensez à utiliser une période plus courte pour plus de lisibilité."
                      : `Période de ${customDayCount} jour${customDayCount > 1 ? 's' : ''} sélectionnée. Chaque barre du graphique représente un jour.`
                  }
                  side="left"
                  maxWidth={220}
                  icon={customRangeTooLong ? <AlertCircle size={9} /> : <Info size={9} />}
                >
                  {customRangeTooLong
                    ? <AlertCircle size={10} className="text-amber-500 cursor-help" />
                    : <Info size={9} className="text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
                  }
                </Tip>
              </div>
            </div>

            {/* Warning when range too long */}
            {customRangeTooLong && (
              <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <AlertCircle size={11} className="text-amber-500 shrink-0 mt-px" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Plage de plus de 365 jours — le graphique peut être difficile à lire. Réduisez la période pour une meilleure lisibilité.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── KPI stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          value={rangeClicks}
          label={`clics (${rangeLabel})`}
          colorClass={rangeClicks > 0 ? 'text-emerald-600' : 'text-muted-foreground'}
          tooltip={`Nombre total de clics sur votre bouton de réservation sur la période sélectionnée (${rangeLabel}). Chaque clic correspond à un visiteur qui a cliqué sur le bouton «\u00a0Réserver maintenant\u00a0» dans l'aperçu Kompilot.`}
        />
        <KpiCard
          value={reservations}
          label="résa estimées"
          colorClass={reservations > 0 ? 'text-teal-600' : 'text-muted-foreground'}
          tooltip="Estimation basée sur un taux de conversion standard de 15\u00a0% des clics en réservation réelle. Cette valeur est indicative — connectez Google Analytics pour un suivi précis."
        />
        <KpiCard
          value={revenue > 0 ? `${revenue}€` : '—'}
          label="CA estimé"
          colorClass={revenue > 0 ? 'text-blue-600' : 'text-muted-foreground'}
          tooltip={`Chiffre d'affaires estimé = réservations estimées × panier moyen (${getAverageBasket()}€ par défaut). Modifiez votre panier moyen dans les paramètres de facturation pour affiner ce calcul.`}
        />
      </div>

      {/* ── Bar chart ── */}
      <div className="bg-white/40 dark:bg-white/5 rounded-lg p-3 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Clics par jour — {rangeLabel}
            </p>
            <Tip
              content="Chaque barre représente le nombre de clics sur votre lien de réservation pour ce jour précis. Survolez une barre pour voir la date et le nombre exact. Les jours sans clic affichent une barre grise minimale."
              side="top"
              maxWidth={240}
              icon={<Info size={9} />}
            >
              <Info size={9} className="text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
            </Tip>
          </div>
          {rangeClicks > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
              {rangeClicks} total
            </span>
          )}
        </div>
        {chartData.length > 0 ? (
          <ClicksBarChart data={chartData} compact={chartData.length <= 14} />
        ) : (
          <p className="text-[10px] text-muted-foreground text-center py-3">Aucune donnée pour cette période</p>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-emerald-500 shrink-0" />
          <span className="text-[11px] text-muted-foreground">
            {totalAllTime > 0
              ? `${totalAllTime} clic${totalAllTime > 1 ? 's' : ''} au total (toutes périodes)`
              : 'Aucun clic tracké pour le moment'}
          </span>
          <Tip
            content="Compteur global depuis l'activation du tracking, toutes périodes confondues. Ce chiffre ne se réinitialise pas à chaque période."
            side="top"
            maxWidth={230}
            icon={<Info size={9} />}
          >
            <Info size={9} className="text-muted-foreground/40 hover:text-muted-foreground cursor-help transition-colors" />
          </Tip>
        </div>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
        >
          Voir la page <ExternalLink size={10} />
        </a>
      </div>

      {/* Hint when no data in range */}
      {rangeClicks === 0 && (
        <p className="text-[10px] text-muted-foreground bg-white/40 dark:bg-white/5 rounded-lg px-3 py-2">
          💡 Les clics sont comptés lorsqu&apos;un visiteur clique sur votre bouton de réservation généré par Kompilot (Cockpit IA → activer l&apos;option réservation).
        </p>
      )}

      {/* Dev: simulate clicks */}
      {isDev && (
        <button
          onClick={() => {
            if (platform) simulateClicks(platform.id, 5);
            else simulateClicks('unknown', 5);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 text-[10px] font-medium hover:bg-amber-100 transition-colors w-full justify-center"
        >
          <Zap size={10} /> Simuler 5 clics (dev only)
        </button>
      )}
    </div>
  );
}
