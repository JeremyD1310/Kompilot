/**
 * MultiAnglesPostEngine
 *
 * 3-tab AI post generation system. Each tab generates a different marketing angle:
 *   📖 Storytelling  — human / behind-the-scenes
 *   🎯 Solution      — client benefit / result
 *   ⚡ Urgence       — commercial / booking urgency
 *
 * Features:
 * - AI generation per angle via backend router
 * - Live phone mockup preview (Instagram / Facebook)
 * - AI engagement score per variant
 * - "Approuver et planifier les 3 variantes" bulk action
 */
import { useState, useCallback, useRef } from 'react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import {
  Sparkles, Wand2, RefreshCw, CheckCircle2, Copy,
  Check, Zap, BookOpen, Target, AlarmClock, CalendarPlus,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { aiGenerate } from '../../lib/aiRouterClient';
import { useEstablishment } from '../../context/EstablishmentContext';
import { type ScheduledPost } from '../../hooks/useScheduledPosts';
import { PhoneMockupPreview } from './PhoneMockupPreview';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AngleKey = 'storytelling' | 'solution' | 'urgence';

interface AngleConfig {
  key: AngleKey;
  emoji: string;
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  promptInstruction: string;
  color: string;
  bgActive: string;
  iconColor: string;
  Icon: React.ElementType;
}

interface AngleState {
  text: string;
  isGenerating: boolean;
  isStreaming: boolean;
  approved: boolean;
}

type AnglesState = Record<AngleKey, AngleState>;

// ── Angle configs ─────────────────────────────────────────────────────────────

const ANGLES: AngleConfig[] = [
  {
    key: 'storytelling',
    emoji: '📖',
    label: 'Storytelling',
    shortLabel: 'Story',
    tagline: 'Angle humain & coulisses',
    description: "Racontez l'histoire de votre établissement. Créez une connexion émotionnelle avec votre audience.",
    promptInstruction: `Rédige une publication STORYTELLING qui :
- Révèle les coulisses ou l'histoire humaine de l'établissement
- Crée une connexion émotionnelle authentique
- Utilise un ton chaleureux et personnel
- Se termine par une invitation douce (pas agressive)
- 3 à 5 phrases maximum, ton naturel, style Instagram/Facebook`,
    color: 'text-violet-600',
    bgActive: 'bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800',
    iconColor: 'text-violet-600',
    Icon: BookOpen,
  },
  {
    key: 'solution',
    emoji: '🎯',
    label: 'Solution',
    shortLabel: 'Solution',
    tagline: 'Angle bénéfice & résultat',
    description: "Mettez en avant les bénéfices concrets pour vos clients. Répondez à leurs problèmes.",
    promptInstruction: `Rédige une publication SOLUTION qui :
- Présente clairement un problème client et comment l'établissement le résout
- Met en avant UN bénéfice concret et mesurable
- Utilise des formulations orientées résultat ("Vous repartez avec...", "Fini le...", "Imaginez...")
- Inclut un appel à l'action clair
- 3 à 5 phrases maximum, percutant et direct`,
    color: 'text-teal-600',
    bgActive: 'bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800',
    iconColor: 'text-teal-600',
    Icon: Target,
  },
  {
    key: 'urgence',
    emoji: '⚡',
    label: 'Urgence',
    shortLabel: 'Urgence',
    tagline: 'Angle commercial & réservation',
    description: "Créez un sentiment d'urgence lié à votre calendrier. Convertissez directement en réservations.",
    promptInstruction: `Rédige une publication URGENCE COMMERCIALE qui :
- Crée un sentiment d'urgence authentique (places limitées, offre limitée dans le temps, événement à venir)
- Inclut OBLIGATOIREMENT une invitation à réserver / appeler / contacter
- Utilise des déclencheurs psychologiques naturels (ne pas rater, dernières places, seulement cette semaine)
- Termine avec un CTA direct et fort (ex : "Réservez maintenant ↗", "Cliquez sur le lien en bio")
- 3 à 5 phrases, ton énergique et commercial`,
    color: 'text-orange-600',
    bgActive: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
    iconColor: 'text-orange-600',
    Icon: AlarmClock,
  },
];

const DEFAULT_ANGLE_STATE: AngleState = {
  text: '',
  isGenerating: false,
  isStreaming: false,
  approved: false,
};

// ── Quick topic chips ─────────────────────────────────────────────────────────

const TOPIC_CHIPS = [
  { label: '🎉 Promo / Offre', value: 'une promotion ou offre spéciale' },
  { label: '📅 Événement', value: 'un événement ou une nouveauté' },
  { label: '📸 Coulisses', value: 'les coulisses et l\'équipe de l\'établissement' },
  { label: '⭐ Avis clients', value: 'les retours positifs de nos clients' },
  { label: '🌟 Produit phare', value: 'notre produit ou service phare' },
  { label: '🗓 Cette semaine', value: 'l\'actualité de la semaine de l\'établissement' },
];

// ── Streaming helper ──────────────────────────────────────────────────────────

function useStreamText(onUpdate: (text: string) => void, onDone: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stream = useCallback((fullText: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let partial = '';
    const words = fullText.split(' ');
    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (idx >= words.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onUpdate(fullText);
        onDone();
        return;
      }
      const chunk = words.slice(idx, idx + 3).join(' ');
      partial += (partial ? ' ' : '') + chunk;
      onUpdate(partial);
      idx += 3;
    }, 35);
  }, [onUpdate, onDone]);

  return stream;
}

// ── Single angle panel ────────────────────────────────────────────────────────

function AnglePanel({
  config,
  state,
  topic,
  establishment,
  onGenerate,
  onApprove,
  onCopy,
  onReset,
}: {
  config: AngleConfig;
  state: AngleState;
  topic: string;
  establishment: ReturnType<typeof useEstablishment>['activeEstablishment'];
  onGenerate: () => void;
  onApprove: () => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { Icon } = config;

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasText = state.text.trim().length > 0;
  const isActive = state.isGenerating || state.isStreaming;

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
      state.approved
        ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10'
        : 'border-border bg-card'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${
        state.approved ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-muted/20'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${state.approved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted/60'} flex items-center justify-center`}>
            {state.approved
              ? <CheckCircle2 size={16} className="text-emerald-600" />
              : <Icon size={15} className={config.iconColor} />
            }
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{config.emoji}</span>
              <span className="text-sm font-bold text-foreground">{config.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{config.tagline}</p>
          </div>
        </div>
        {state.approved && (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 rounded-full px-2 py-0.5">
            ✓ Approuvé
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Description when no text */}
        {!hasText && !isActive && (
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">
            {config.description}
          </p>
        )}

        {/* Generated text area */}
        {(hasText || isActive) && (
          <div className={`rounded-xl border ${
            state.approved ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-primary/20 bg-primary/3'
          } p-3`}>
            <div className="flex items-start gap-2">
              <Sparkles size={13} className={`${config.iconColor} shrink-0 mt-0.5 ${isActive ? 'animate-pulse' : ''}`} />
              <p className="text-sm text-foreground leading-relaxed flex-1 whitespace-pre-wrap">
                {state.text || ''}
                {state.isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                )}
              </p>
              {hasText && !isActive && (
                <button
                  onClick={onReset}
                  className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors"
                  title="Effacer"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Booking link reminder for urgence */}
        {config.key === 'urgence' && establishment.bookingUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-orange-200/60 bg-orange-50/60 dark:bg-orange-950/10 px-3 py-1.5">
            <span className="text-[10px]">🔗</span>
            <p className="text-[10px] text-orange-700 dark:text-orange-400 font-medium truncate">
              Lien réservation intégré : {establishment.bookingUrl}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={hasText ? 'outline' : 'default'}
            onClick={onGenerate}
            disabled={isActive || !topic.trim()}
            className={`h-7 text-xs gap-1.5 ${!hasText ? '' : 'border-border'}`}
          >
            {isActive
              ? <><RefreshCw size={11} className="animate-spin" /> Génération…</>
              : hasText
              ? <><RefreshCw size={11} /> Régénérer</>
              : <><Sparkles size={11} /> Générer</>
            }
          </Button>

          {hasText && !isActive && (
            <>
              <button
                onClick={handleCopy}
                className="h-7 px-2.5 rounded-lg border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex items-center gap-1"
              >
                {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
              </button>

              <button
                onClick={() => setShowPreview(v => !v)}
                className="h-7 px-2.5 rounded-lg border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all flex items-center gap-1"
              >
                {showPreview ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Aperçu
              </button>

              {!state.approved ? (
                <button
                  onClick={onApprove}
                  className="ml-auto h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95"
                >
                  <CheckCircle2 size={11} /> Approuver
                </button>
              ) : (
                <span className="ml-auto text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Approuvé
                </span>
              )}
            </>
          )}
        </div>

        {/* Phone mockup preview (collapsible) */}
        {showPreview && hasText && (
          <div className="pt-2 border-t border-border/60">
            <PhoneMockupPreview
              text={state.text}
              angle={config.key}
              establishment={establishment}
              isStreaming={state.isStreaming}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface MultiAnglesPostEngineProps {
  upcomingPosts?: ScheduledPost[];
  onCreatePost?: (text: string, channels: string[], angle: AngleKey) => void;
  onScheduleAll?: (variants: { angle: AngleKey; text: string }[]) => void;
}

export function MultiAnglesPostEngine({
  upcomingPosts = [],
  onCreatePost,
  onScheduleAll,
}: MultiAnglesPostEngineProps) {
  const { activeEstablishment } = useEstablishment();

  const [topic, setTopic] = useState('');
  const [angles, setAngles] = useState<AnglesState>({
    storytelling: { ...DEFAULT_ANGLE_STATE },
    solution:     { ...DEFAULT_ANGLE_STATE },
    urgence:      { ...DEFAULT_ANGLE_STATE },
  });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [schedulingAll, setSchedulingAll] = useState(false);

  // ── Per-angle state helpers ─────────────────────────────────────────────────

  const updateAngle = useCallback((key: AngleKey, patch: Partial<AngleState>) => {
    setAngles(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  // ── Stream helpers per angle (top-level hooks — no rules violation) ──────────

  const streamStorytelling = useStreamText(
    (text) => updateAngle('storytelling', { text, isStreaming: true }),
    ()     => updateAngle('storytelling', { isStreaming: false }),
  );
  const streamSolution = useStreamText(
    (text) => updateAngle('solution', { text, isStreaming: true }),
    ()     => updateAngle('solution', { isStreaming: false }),
  );
  const streamUrgence = useStreamText(
    (text) => updateAngle('urgence', { text, isStreaming: true }),
    ()     => updateAngle('urgence', { isStreaming: false }),
  );
  const streamers: Record<AngleKey, (text: string) => void> = {
    storytelling: streamStorytelling,
    solution: streamSolution,
    urgence: streamUrgence,
  };

  // ── Generate a single angle ─────────────────────────────────────────────────

  const generateAngle = useCallback(async (key: AngleKey) => {
    if (!topic.trim()) return;

    const config = ANGLES.find(a => a.key === key)!;
    const estName     = activeEstablishment.name;
    const category    = activeEstablishment.category;
    const bookingUrl  = activeEstablishment.bookingUrl;

    updateAngle(key, { isGenerating: true, text: '', approved: false });

    try {
      const prompt = `
Établissement : "${estName}" (${category})
${bookingUrl ? `Lien de réservation : ${bookingUrl}` : ''}

Sujet / idée principale : ${topic}

${config.promptInstruction}
`.trim();

      const result = await aiGenerate({
        taskType: 'CREATIVE_CONTENT',
        prompt,
        contextData: {
          establishmentName: estName,
          businessType: category,
          city: (activeEstablishment as any).city ?? '',
          bookingUrl: bookingUrl ?? '',
          angle: config.label,
        },
        maxTokens: 350,
      });

      updateAngle(key, { isGenerating: false, isStreaming: true });
      streamers[key](result.content);
    } catch (err: any) {
      toast.error(`Erreur ${config.label}: ${err?.message ?? 'Génération échouée'}`);
      updateAngle(key, { isGenerating: false });
    }
  }, [topic, activeEstablishment, updateAngle, streamers]);

  // ── Generate all 3 angles ───────────────────────────────────────────────────

  const handleGenerateAll = async () => {
    if (!topic.trim()) return;
    setIsGeneratingAll(true);
    // Sequential to avoid throttling
    for (const cfg of ANGLES) {
      await generateAngle(cfg.key);
      // Small delay between calls to respect rate limits
      await new Promise(r => setTimeout(r, 400));
    }
    setIsGeneratingAll(false);
    toast.success('3 variantes générées !');
  };

  // ── Approve all & schedule ──────────────────────────────────────────────────

  const approvedVariants = ANGLES
    .filter(cfg => angles[cfg.key].approved && angles[cfg.key].text)
    .map(cfg => ({ angle: cfg.key, text: angles[cfg.key].text }));

  const allHaveText = ANGLES.every(cfg => angles[cfg.key].text.trim().length > 0);

  const handleApproveAndScheduleAll = async () => {
    if (approvedVariants.length === 0 && allHaveText) {
      // Auto-approve all then schedule
      ANGLES.forEach(cfg => updateAngle(cfg.key, { approved: true }));
      const all = ANGLES.map(cfg => ({ angle: cfg.key, text: angles[cfg.key].text }));
      setSchedulingAll(true);
      await new Promise(r => setTimeout(r, 600));
      setSchedulingAll(false);
      onScheduleAll?.(all);
      toast.success('3 variantes approuvées et envoyées au calendrier !', { duration: 4000 });
      return;
    }

    if (approvedVariants.length === 0) {
      toast.error('Générez d\'abord les 3 variantes, puis approuvez-les.');
      return;
    }

    setSchedulingAll(true);
    await new Promise(r => setTimeout(r, 500));
    setSchedulingAll(false);
    onScheduleAll?.(approvedVariants);
    toast.success(`${approvedVariants.length} variante${approvedVariants.length > 1 ? 's' : ''} envoyée${approvedVariants.length > 1 ? 's' : ''} au calendrier !`, { duration: 4000 });
  };

  const approvedCount = ANGLES.filter(cfg => angles[cfg.key].approved).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-violet-500/3 to-orange-500/3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wand2 size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Posts Multi-Angles IA</h3>
            <p className="text-[11px] text-muted-foreground">
              3 angles marketing différents — 1 sujet, 3× plus d'impact
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-bold gap-1 rounded-full hidden sm:flex">
            <Sparkles size={9} /> IA Multi-angles
          </Badge>
          {approvedCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 rounded-full px-2 py-0.5">
              {approvedCount}/3 approuvés
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* ── Topic input ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            💡 Sujet du contenu
          </label>

          {/* Topic chips */}
          <div className="flex flex-wrap gap-1.5">
            {TOPIC_CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => setTopic(chip.value)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                  topic === chip.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:border-primary/30'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Free-text input */}
          <div className="relative">
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerateAll(); }}
              placeholder="Ou décrivez votre sujet librement… (ex: notre nouvelle carte d'été, offre -20% ce week-end)"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all pr-10"
            />
            {topic && (
              <button
                onClick={() => setTopic('')}
                className="absolute right-3 top-3 text-muted-foreground/60 hover:text-muted-foreground transition-opacity"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Generate All button ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleGenerateAll}
            disabled={isGeneratingAll || !topic.trim()}
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            {isGeneratingAll
              ? <><RefreshCw size={13} className="animate-spin" /> Génération des 3 angles…</>
              : <><Zap size={13} /> Générer les 3 angles</>
            }
          </Button>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">⌘↵ pour générer</span>
        </div>

        {/* ── 3 angle panels ── */}
        <div className="space-y-3">
          {ANGLES.map(cfg => (
            <AnglePanel
              key={cfg.key}
              config={cfg}
              state={angles[cfg.key]}
              topic={topic}
              establishment={activeEstablishment}
              onGenerate={() => generateAngle(cfg.key)}
              onApprove={() => updateAngle(cfg.key, { approved: !angles[cfg.key].approved })}
              onCopy={() => navigator.clipboard.writeText(angles[cfg.key].text).catch(() => {})}
              onReset={() => updateAngle(cfg.key, { text: '', approved: false })}
            />
          ))}
        </div>

        {/* ── Approve & Schedule ALL CTA ── */}
        {allHaveText && (
          <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-teal-500/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarPlus size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Planifier les 3 variantes</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Les 3 angles seront envoyés au calendrier avec les horaires optimaux suggérés par l'IA.
                  {approvedCount > 0 && approvedCount < 3 && (
                    <span className="text-amber-600"> ({approvedCount}/3 approuvées)</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleApproveAndScheduleAll}
              disabled={schedulingAll}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-3 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {schedulingAll ? (
                <><RefreshCw size={15} className="animate-spin" /> Planification…</>
              ) : (
                <><CalendarPlus size={15} /> Approuver et planifier les 3 variantes</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
