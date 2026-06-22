/**
 * MilestoneThresholdsPanel
 *
 * Settings UI for customising when milestone notifications fire.
 * Grouped by metric family (Rank, Reviews, Rating, Reply Rate, AI Replies).
 * Each control is a slider + numeric input — changes persist to localStorage
 * and take effect on the next milestone check without a page reload.
 *
 * Reset-to-defaults button clears all customisations.
 */
import { useState, useCallback } from 'react';
import {
  Settings2, RotateCcw, MapPin, Star, MessageSquare,
  Sparkles, TrendingUp, Info, CheckCircle2, Lock,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import {
  loadThresholds,
  saveThreshold,
  resetThresholds,
  DEFAULT_THRESHOLDS,
  type MilestoneThresholds,
  type ThresholdDef,
} from '../../lib/milestoneThresholds';

// ── Types ─────────────────────────────────────────────────────────────────────

type ThresholdKey = keyof MilestoneThresholds;

interface Group {
  label: string;
  icon: React.ReactNode;
  color: string;
  keys: ThresholdKey[];
}

// ── Metric groups ─────────────────────────────────────────────────────────────

const GROUPS: Group[] = [
  {
    label: 'Position Google Maps',
    icon: <MapPin size={14} />,
    color: 'text-emerald-600',
    keys: ['rankTopN'],
  },
  {
    label: 'Volume d\'avis',
    icon: <MessageSquare size={14} />,
    color: 'text-amber-600',
    keys: ['reviewsFirst', 'reviewsSecond', 'reviewsThird'],
  },
  {
    label: 'Note moyenne',
    icon: <Star size={14} />,
    color: 'text-amber-500',
    keys: ['ratingFirst', 'ratingSecond'],
  },
  {
    label: 'Taux de réponse',
    icon: <TrendingUp size={14} />,
    color: 'text-teal-600',
    keys: ['replyRateFirst', 'replyRatePerfect'],
  },
  {
    label: 'Réponses IA',
    icon: <Sparkles size={14} />,
    color: 'text-violet-600',
    keys: ['aiRepliesFirst', 'aiRepliesSecond', 'aiRepliesThird'],
  },
];

// ── Single threshold row ──────────────────────────────────────────────────────

function ThresholdRow({
  thresholdKey,
  def,
  isLocked,
  onChange,
}: {
  thresholdKey: ThresholdKey;
  def: ThresholdDef;
  isLocked: boolean;
  onChange: (key: ThresholdKey, value: number) => void;
}) {
  const [inputVal, setInputVal] = useState(String(def.value));
  const isDefault = def.value === def.default;

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setInputVal(String(v));
    onChange(thresholdKey, v);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v >= def.min && v <= def.max) {
      onChange(thresholdKey, v);
    }
  };

  const handleInputBlur = () => {
    const v = parseFloat(inputVal);
    if (isNaN(v) || v < def.min || v > def.max) {
      setInputVal(String(def.value)); // revert to current valid value
    }
  };

  const pct = ((def.value - def.min) / (def.max - def.min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{def.label}</span>
            {isLocked && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                <Lock size={8} /> Fixe
              </span>
            )}
            {!isDefault && !isLocked && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                Modifié
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{def.description}</p>
        </div>

        {/* Value input */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={inputVal}
            onChange={handleInput}
            onBlur={handleInputBlur}
            disabled={isLocked}
            min={def.min}
            max={def.max}
            step={def.step}
            className="w-16 text-right text-sm font-bold text-foreground bg-background border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed tabular-nums"
          />
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{def.unit}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-150"
            style={{ width: `${isLocked ? 100 : pct}%` }}
          />
        </div>
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={def.value}
          onChange={handleSlider}
          disabled={isLocked}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ height: '8px' }}
        />
        <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
          <span>{def.min} {def.unit}</span>
          <span>{def.max} {def.unit}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function MilestoneThresholdsPanel() {
  const [thresholds, setThresholds] = useState<MilestoneThresholds>(loadThresholds);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((key: ThresholdKey, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
    saveThreshold(key, value);
    setSaved(false);
  }, []);

  const handleSave = () => {
    // All changes are already persisted on every slider move via saveThreshold().
    // This button is a UX affordance confirming "I'm done".
    setSaved(true);
    toast.success('Seuils de milestones sauvegardés ✓');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    resetThresholds();
    setThresholds(loadThresholds()); // reloads defaults
    setSaved(false);
    toast('Seuils réinitialisés aux valeurs par défaut', { icon: '↩️' });
  };

  const hasChanges = (Object.keys(thresholds) as ThresholdKey[]).some(
    k => thresholds[k].value !== DEFAULT_THRESHOLDS[k].value,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Settings2 size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Seuils des milestones de performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personnalisez les valeurs qui déclenchent les notifications et emails de célébration.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-xl px-3 py-1.5 transition-colors"
            >
              <RotateCcw size={11} /> Réinitialiser
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saved ? <CheckCircle2 size={11} /> : null}
            {saved ? 'Sauvegardé' : 'Confirmer'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-3 py-2.5">
        <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-snug">
          Les modifications s'appliquent immédiatement au prochain cap détecté — sans rechargement de page.
          Un email de célébration + une notification in-app sont envoyés à chaque franchissement.
        </p>
      </div>

      {/* Metric groups */}
      {GROUPS.map(group => (
        <div key={group.label} className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Group header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
            <span className={group.color}>{group.icon}</span>
            <span className="text-xs font-bold text-foreground">{group.label}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {group.keys.length} seuil{group.keys.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Threshold rows */}
          <div className="divide-y divide-border">
            {group.keys.map(key => (
              <div key={key} className="px-4 py-4">
                <ThresholdRow
                  thresholdKey={key}
                  def={thresholds[key]}
                  isLocked={key === 'replyRatePerfect'}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Ordering constraint notice */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Conseil :</strong> Les seuils doivent respecter un ordre croissant au sein d'un même groupe
          (ex : 1er cap ≤ 2e cap ≤ 3e cap). Des valeurs incohérentes peuvent empêcher certaines célébrations de se déclencher.
        </p>
      </div>
    </div>
  );
}
