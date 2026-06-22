/**
 * Shared data, types and helpers for the ConsumptionTab.
 */
import { CREDIT_COSTS, ACTION_LABELS, type CreditAction, type CreditSpendEntry } from '../../../lib/creditsCosts';

// ── Palette ───────────────────────────────────────────────────────────────────
export const SLICE_COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981'];

// ── Category metadata ─────────────────────────────────────────────────────────
export interface CategoryMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Inbox & Messagerie':    { label: 'Inbox & Messagerie',    color: 'text-sky-700 dark:text-sky-400',      bg: 'bg-sky-50 dark:bg-sky-950/30',       border: 'border-sky-200 dark:border-sky-800/50' },
  'Génération de contenu': { label: 'Génération de contenu', color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30',   border: 'border-violet-200 dark:border-violet-800/50' },
  'Outils & Diagnostics':  { label: 'Outils & Diagnostics',  color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30',   border: 'border-orange-200 dark:border-orange-800/50' },
  'SEO & GEO':             { label: 'SEO & GEO',             color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-200 dark:border-amber-800/50' },
  'Automatisation':        { label: 'Automatisation',        color: 'text-teal-700 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-950/30',       border: 'border-teal-200 dark:border-teal-800/50' },
};

export const ACTION_CATEGORY: Record<CreditAction, string> = {
  INBOX_AI_REPLY:    'Inbox & Messagerie',
  POST_TEXT_SINGLE:  'Génération de contenu',
  VOICE_DICTATION:   'Génération de contenu',
  VIDEO_SCRIPT:      'Génération de contenu',
  CAROUSEL_VISUAL:   'Génération de contenu',
  DIAGNOSTIC_REPAIR: 'Outils & Diagnostics',
  GEO_RADAR_SCAN:    'SEO & GEO',
  CITATION_ANALYZER: 'SEO & GEO',
  COUNTER_ATTACK:    'SEO & GEO',
  BULK_CALENDAR:     'Automatisation',
};

// ── Tariff definition ─────────────────────────────────────────────────────────
export interface TariffRow {
  action: CreditAction;
  label: string;
  category: string;
  unitCost: number;
  ecoUnitCost: number;
  description: string;
}

export const TARIFF_ROWS: TariffRow[] = [
  { action: 'INBOX_AI_REPLY',    label: ACTION_LABELS.INBOX_AI_REPLY,    category: 'Inbox & Messagerie',    unitCost: CREDIT_COSTS.INBOX_AI_REPLY,    ecoUnitCost: 0.5,                          description: 'Réponse automatique IA dans WhatsApp, Instagram ou Messenger' },
  { action: 'POST_TEXT_SINGLE',  label: ACTION_LABELS.POST_TEXT_SINGLE,  category: 'Génération de contenu', unitCost: CREDIT_COSTS.POST_TEXT_SINGLE,  ecoUnitCost: 0.5,                          description: 'Génération d\'un post texte ou réponse avis Google rapide' },
  { action: 'VOICE_DICTATION',   label: ACTION_LABELS.VOICE_DICTATION,   category: 'Génération de contenu', unitCost: CREDIT_COSTS.VOICE_DICTATION,   ecoUnitCost: 0.5,                          description: 'Transcription et mise en forme par dictée vocale' },
  { action: 'VIDEO_SCRIPT',      label: ACTION_LABELS.VIDEO_SCRIPT,      category: 'Génération de contenu', unitCost: CREDIT_COSTS.VIDEO_SCRIPT,      ecoUnitCost: CREDIT_COSTS.VIDEO_SCRIPT,    description: 'Script vidéo vertical complet (TikTok / YouTube Shorts) avec mise en scène' },
  { action: 'CAROUSEL_VISUAL',   label: ACTION_LABELS.CAROUSEL_VISUAL,   category: 'Génération de contenu', unitCost: CREDIT_COSTS.CAROUSEL_VISUAL,   ecoUnitCost: CREDIT_COSTS.CAROUSEL_VISUAL, description: 'Carrousel visuel multi-slides (textes + suggestions visuelles IA)' },
  { action: 'DIAGNOSTIC_REPAIR', label: ACTION_LABELS.DIAGNOSTIC_REPAIR, category: 'Outils & Diagnostics',  unitCost: CREDIT_COSTS.DIAGNOSTIC_REPAIR, ecoUnitCost: CREDIT_COSTS.DIAGNOSTIC_REPAIR, description: 'Diagnostic de connexion 1-clic + réparation automatique de token' },
  { action: 'GEO_RADAR_SCAN',    label: ACTION_LABELS.GEO_RADAR_SCAN,    category: 'SEO & GEO',             unitCost: CREDIT_COSTS.GEO_RADAR_SCAN,    ecoUnitCost: CREDIT_COSTS.GEO_RADAR_SCAN,  description: 'Scan complet Radar GEO & GEA (ChatGPT + Gemini + Perplexity)' },
  { action: 'CITATION_ANALYZER', label: ACTION_LABELS.CITATION_ANALYZER, category: 'SEO & GEO',             unitCost: CREDIT_COSTS.CITATION_ANALYZER, ecoUnitCost: CREDIT_COSTS.CITATION_ANALYZER, description: 'Analyseur de citations et tracking de sources concurrentes' },
  { action: 'COUNTER_ATTACK',    label: ACTION_LABELS.COUNTER_ATTACK,    category: 'SEO & GEO',             unitCost: CREDIT_COSTS.COUNTER_ATTACK,    ecoUnitCost: CREDIT_COSTS.COUNTER_ATTACK,  description: 'Contre-attaque sémantique — article de blog 500 mots optimisé SEO' },
  { action: 'BULK_CALENDAR',     label: ACTION_LABELS.BULK_CALENDAR,     category: 'Automatisation',        unitCost: CREDIT_COSTS.BULK_CALENDAR,     ecoUnitCost: CREDIT_COSTS.BULK_CALENDAR,   description: 'Génération en masse de 30 jours de calendrier éditorial complet' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildDonutData(history: CreditSpendEntry[]) {
  const totals: Record<string, number> = {};
  history.forEach(e => {
    const cat = ACTION_CATEGORY[e.action] ?? 'Autre';
    totals[cat] = (totals[cat] ?? 0) + e.amount;
  });
  const total = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }));
}

export function buildActionSummary(history: CreditSpendEntry[]): Record<CreditAction, { count: number; total: number }> {
  const out = {} as Record<CreditAction, { count: number; total: number }>;
  history.forEach(e => {
    if (!out[e.action]) out[e.action] = { count: 0, total: 0 };
    out[e.action].count += 1;
    out[e.action].total += e.amount;
  });
  return out;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return dateStr; }
}

export function seedDemoHistory() {
  const today = new Date();
  const entries: CreditSpendEntry[] = [
    { date: today.toISOString().slice(0, 10), amount: 1,  action: 'INBOX_AI_REPLY',    label: ACTION_LABELS.INBOX_AI_REPLY },
    { date: today.toISOString().slice(0, 10), amount: 10, action: 'GEO_RADAR_SCAN',    label: ACTION_LABELS.GEO_RADAR_SCAN },
    { date: today.toISOString().slice(0, 10), amount: 1,  action: 'POST_TEXT_SINGLE',  label: ACTION_LABELS.POST_TEXT_SINGLE },
    { date: today.toISOString().slice(0, 10), amount: 5,  action: 'CAROUSEL_VISUAL',   label: ACTION_LABELS.CAROUSEL_VISUAL },
    { date: today.toISOString().slice(0, 10), amount: 10, action: 'COUNTER_ATTACK',    label: ACTION_LABELS.COUNTER_ATTACK },
    ...[-1, -2, -3, -4, -5].flatMap(daysAgo => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysAgo);
      const dateStr = d.toISOString().slice(0, 10);
      return [
        { date: dateStr, amount: 5,  action: 'VIDEO_SCRIPT'      as CreditAction, label: ACTION_LABELS.VIDEO_SCRIPT },
        { date: dateStr, amount: 1,  action: 'INBOX_AI_REPLY'    as CreditAction, label: ACTION_LABELS.INBOX_AI_REPLY },
        { date: dateStr, amount: 30, action: 'BULK_CALENDAR'     as CreditAction, label: ACTION_LABELS.BULK_CALENDAR },
        { date: dateStr, amount: 10, action: 'CITATION_ANALYZER' as CreditAction, label: ACTION_LABELS.CITATION_ANALYZER },
        { date: dateStr, amount: 1,  action: 'POST_TEXT_SINGLE'  as CreditAction, label: ACTION_LABELS.POST_TEXT_SINGLE },
        { date: dateStr, amount: 5,  action: 'DIAGNOSTIC_REPAIR' as CreditAction, label: ACTION_LABELS.DIAGNOSTIC_REPAIR },
        { date: dateStr, amount: 1,  action: 'VOICE_DICTATION'   as CreditAction, label: ACTION_LABELS.VOICE_DICTATION },
      ];
    }),
  ];
  try {
    localStorage.setItem('kompilot_credit_history_v1', JSON.stringify(entries));
  } catch { /* noop */ }
}
