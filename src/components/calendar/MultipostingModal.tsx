import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Textarea, toast,
} from '@blinkdotnew/ui';
import { Globe, Sparkles, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { blink } from '../../blink/client';
import { launchConfetti } from '../../lib/confetti';
import { analyticsTrackPostPublished } from '../../firebase/analytics';

// ── Brand icons ────────────────────────────────────────────────────────────
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.83a8.16 8.16 0 004.79 1.54V6.93a4.85 4.85 0 01-1.02-.24z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
    </svg>
  );
}

// ── Platform config ────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'instagram',       label: 'Instagram',      Icon: InstagramIcon, color: 'text-pink-500',   border: 'border-pink-400',   bg: 'bg-pink-50 dark:bg-pink-950/30',   charLimit: 2200 },
  { id: 'facebook',        label: 'Facebook',       Icon: FacebookIcon,  color: 'text-blue-500',   border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',   charLimit: 63206 },
  { id: 'linkedin',        label: 'LinkedIn',       Icon: LinkedinIcon,  color: 'text-blue-700',   border: 'border-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30',   charLimit: 3000 },
  { id: 'google_business', label: 'Google',         Icon: GoogleIcon,    color: 'text-orange-500', border: 'border-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', charLimit: 1500 },
  { id: 'tiktok',          label: 'TikTok',         Icon: TikTokIcon,    color: 'text-foreground', border: 'border-foreground/40', bg: 'bg-muted',                         charLimit: 2200 },
  { id: 'website',         label: 'Mon site web',   Icon: Globe,         color: 'text-primary',    border: 'border-primary',    bg: 'bg-primary/5',                     charLimit: 10000 },
] as const;
type PlatformId = (typeof PLATFORMS)[number]['id'];

// ── Publishing animation sub-component ─────────────────────────────────────
function PublishingOverlay({
  platforms,
  onDone,
}: {
  platforms: PlatformId[];
  onDone: () => void;
}) {
  const steps = [
    { key: 'connect', label: '🔄 Connexion aux API en cours...', icon: 'spin' },
    ...platforms.map(pid => {
      const p = PLATFORMS.find(pl => pl.id === pid)!;
      return { key: pid, label: `📱 Publication sur ${p.label}...`, icon: 'check' };
    }),
    { key: 'done', label: '🎉 Contenu propulsé avec succès sur tous vos réseaux !', icon: 'final' },
    { key: 'time', label: '⏱ Temps gagné : 15 minutes', icon: 'final' },
  ];

  const [visibleCount, setVisibleCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (visibleCount < steps.length) {
      const delay = visibleCount === 0 ? 400 : 700;
      const t = setTimeout(() => setVisibleCount(c => c + 1), delay);
      return () => clearTimeout(t);
    } else {
      launchConfetti();
      const t = setTimeout(() => setFinished(true), 600);
      return () => clearTimeout(t);
    }
  }, [visibleCount, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/95 backdrop-blur-sm p-8"
    >
      <div className="w-full max-w-sm space-y-3">
        <AnimatePresence>
          {steps.slice(0, visibleCount).map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                step.icon === 'final'
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-muted text-foreground'
              }`}
            >
              {step.icon === 'spin' && i === 0 && visibleCount === 1 ? (
                <Loader2 size={15} className="animate-spin text-primary shrink-0" />
              ) : step.icon === 'check' ? (
                <CheckCircle2 size={15} className="text-green-500 shrink-0" />
              ) : (
                <span className="shrink-0 text-base leading-none">✅</span>
              )}
              <span>{step.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
          >
            <Button onClick={onDone} className="px-8">
              Fermer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface MultipostingModalProps {
  open: boolean;
  onClose: () => void;
  initialText?: string;
  initialChannels?: string[];
  onPublished?: (channels: string[], variants: Record<string, string>) => void;
}

type AiVariants = Partial<Record<PlatformId, string>>;

export function MultipostingModal({
  open, onClose, initialText = '', initialChannels = [], onPublished,
}: MultipostingModalProps) {
  const [text, setText] = useState(initialText);
  const [selected, setSelected] = useState<PlatformId[]>(initialChannels as PlatformId[]);
  const [activeTab, setActiveTab] = useState<PlatformId | null>(null);
  const [variants, setVariants] = useState<AiVariants>({});
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingVariant, setEditingVariant] = useState<AiVariants>({});

  // Sync initial props on open
  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setSelected(initialChannels as PlatformId[]);
    setVariants({});
    setEditingVariant({});
    setPublishing(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected.length > 0 && !activeTab) setActiveTab(selected[0]);
    if (selected.length === 0) setActiveTab(null);
    if (activeTab && !selected.includes(activeTab)) setActiveTab(selected[0] ?? null);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlatform = (id: PlatformId) =>
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const selectAll = () => setSelected(PLATFORMS.map(p => p.id) as PlatformId[]);

  const handleGenerateVariants = async () => {
    if (!text.trim()) { toast.error('Rédigez d\'abord votre texte.'); return; }
    setGenerating(true);
    try {
      const selectedPlatforms = PLATFORMS.filter(p => selected.includes(p.id));
      const platformInstructions = selectedPlatforms.map(p => {
        const rules: Record<PlatformId, string> = {
          instagram: '"instagram": texte ultra-court 80-150 chars, retours à la ligne, emojis expressifs, OBLIGATOIREMENT 5 hashtags à la fin.',
          facebook: '"facebook": commence par une question engageante, ton conversationnel, max 2 hashtags.',
          linkedin: '"linkedin": storytelling corporate 300-600 chars, accroche forte, paragraphes courts, emojis sobres, ton professionnel.',
          google_business: '"google_business": factuel et local SEO, 150-300 chars, mots-clés géolocalisés, call-to-action simple.',
          tiktok: '"tiktok": hook ultra-court <100 chars, tendance, très punchy, accroche scroll-stopper.',
          website: '"website": style blog 400-800 chars, structuré, sans hashtags, ton informatif et engageant.',
        };
        return rules[p.id] ?? `"${p.id}": version adaptée.`;
      }).join('\n');

      const schemaProperties: Record<string, { type: string; description: string }> = {};
      selectedPlatforms.forEach(p => {
        schemaProperties[p.id] = { type: 'string', description: `Texte adapté pour ${p.label}` };
      });

      const { object } = await blink.ai.generateObject({
        prompt: `Tu es un expert en marketing digital. Adapte ce texte pour chaque réseau social selon les règles suivantes:\n${platformInstructions}\n\nTexte original:\n"""\n${text}\n"""\n\nRéponds uniquement avec l'objet JSON demandé.`,
        schema: {
          type: 'object',
          properties: schemaProperties,
          required: selectedPlatforms.map(p => p.id),
        },
      });
      setVariants(object as AiVariants);
      setEditingVariant(object as AiVariants);
      if (selected.length > 0) setActiveTab(selected[0]);
      toast.success('Variantes IA générées !');
    } catch (err: unknown) {
      const e = err as { message?: string; name?: string };
      if (e?.message?.includes('401') || e?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
      } else {
        toast.error('Erreur lors de la génération IA.', { description: e?.message ?? 'Réessayez.' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!text.trim() || selected.length === 0) return;
    setPublishing(true);
  };

  const handlePublishDone = () => {
    setPublishing(false);
    onPublished?.(selected, editingVariant as Record<string, string>);
    // Track in Firebase Analytics
    selected.forEach(channel => analyticsTrackPostPublished(channel));
    toast.success('🚀 Publication réussie sur tous vos réseaux !');
    onClose();
  };

  const showPreviews = selected.length >= 2 && text.trim().length > 0 && Object.keys(variants).length > 0;
  const activePlatform = PLATFORMS.find(p => p.id === activeTab);
  const activeVariantText = activeTab ? (editingVariant[activeTab] ?? variants[activeTab] ?? '') : '';

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 shrink-0 border-b border-border">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">🚀</span> Multiposting Intelligent en 1 Clic
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 overflow-y-auto">
          {/* Publishing overlay */}
          <AnimatePresence>
            {publishing && (
              <PublishingOverlay platforms={selected} onDone={handlePublishDone} />
            )}
          </AnimatePresence>

          <div className="px-6 py-5 space-y-6">
            {/* A) Network selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Réseaux de publication
                </p>
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  ✅ Tout sélectionner
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label, Icon, color, border, bg }) => {
                  const isOn = selected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePlatform(id)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                        isOn
                          ? `${border} ${bg} ${color} shadow-sm`
                          : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/40'
                      }`}
                    >
                      <Icon className={isOn ? color : 'text-muted-foreground'} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text area */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Texte principal
              </p>
              <Textarea
                placeholder="Rédigez votre contenu ici... L'IA l'adaptera automatiquement pour chaque réseau."
                value={text}
                onChange={e => setText(e.target.value)}
                className="min-h-[110px] resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{text.length} caractères</p>
            </div>

            {/* Generate button */}
            {selected.length >= 2 && text.trim() && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <Button
                  variant="outline"
                  onClick={handleGenerateVariants}
                  disabled={generating}
                  className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
                >
                  {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? 'Génération des variantes...' : 'Générer les variantes IA'}
                </Button>
              </motion.div>
            )}

            {/* B) AI Platform Variants */}
            <AnimatePresence>
              {showPreviews && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={12} className="text-primary" />
                    Prévisualisations IA par réseau
                  </p>

                  {/* Tabs */}
                  <div className="flex gap-1.5 flex-wrap">
                    {selected.map(pid => {
                      const pl = PLATFORMS.find(p => p.id === pid)!;
                      const isActive = activeTab === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => setActiveTab(pid)}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? `${pl.border} ${pl.bg} ${pl.color}`
                              : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          <pl.Icon className={isActive ? pl.color : 'text-muted-foreground'} />
                          {pl.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    {activeTab && activePlatform && (
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-xl border-2 ${activePlatform.border} ${activePlatform.bg} p-4 space-y-2`}
                      >
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${activePlatform.color}`}>
                          <activePlatform.Icon />
                          {activePlatform.label} — Version adaptée IA
                        </div>
                        <Textarea
                          value={activeVariantText}
                          onChange={e => setEditingVariant(prev => ({ ...prev, [activeTab]: e.target.value }))}
                          className="min-h-[100px] resize-none bg-background/60 text-sm"
                          placeholder="Le texte adapté apparaîtra ici..."
                        />
                        <p className="text-[11px] text-muted-foreground text-right">
                          {activeVariantText.length} / {activePlatform.charLimit.toLocaleString()} caractères
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* C) Publish button */}
            <div className="pt-2 pb-1">
              <Button
                className="w-full h-12 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md disabled:opacity-40"
                disabled={selected.length === 0 || !text.trim()}
                onClick={handlePublish}
              >
                🚀 Publier partout en 1 clic
                {selected.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                    {selected.length} réseaux
                  </span>
                )}
              </Button>
              {(selected.length === 0 || !text.trim()) && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {selected.length === 0 ? 'Sélectionnez au moins un réseau' : 'Rédigez votre texte pour continuer'}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
